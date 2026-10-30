"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useAssetReadiness } from "@/hooks/useAssetReadiness";
import { lockScroll } from "@/lib/scrollTo";
import { resolveMotionPrefs } from "@/lib/motionPrefs";
import {
  LOADER_DEVICE,
  LOADER_DROPLETS,
  LOADER_RINGS,
  LOADER_SESSION_KEY,
  LOADER_TIMING,
  type LoaderQuality,
  type LoaderVariant,
} from "@/lib/loaderTokens";
import { buildWaterReveal } from "@/lib/waterReveal";
import styles from "./LoaderOverlay.module.css";

type Geometry = {
  x: number;
  y: number;
  dropY: number;
  radius: number;
};

const MODIFIER_KEYS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "NumLock",
  "ScrollLock",
]);

function hasSeenLoader() {
  try {
    return window.sessionStorage.getItem(LOADER_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberLoader() {
  try {
    window.sessionStorage.setItem(LOADER_SESSION_KEY, "1");
  } catch {
    // Private mode can block sessionStorage; the loader still works.
  }
}

function isCompactViewport() {
  try {
    return window.matchMedia("(max-width: 767px)").matches;
  } catch {
    return window.innerWidth < 768;
  }
}

function measureGeometry(compact: boolean): Geometry {
  const width = window.innerWidth;
  const height = window.innerHeight;
  let x = width * 0.5;
  let y = height * 0.42;

  const canvas = document.querySelector<HTMLCanvasElement>("#hero canvas");
  const target: Element | null =
    canvas ?? document.querySelector<HTMLElement>("#hero [role='img']");
  if (target) {
    const rect = target.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
  }

  x = gsap.utils.clamp(width * 0.18, width * 0.82, x);
  y = gsap.utils.clamp(height * 0.28, height * 0.8, y);

  return {
    x,
    y,
    dropY: Math.max(56, Math.min(y - 80, height * 0.16)),
    radius:
      Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) +
      (compact ? 8 : 16),
  };
}

function deviceQuality(): LoaderQuality {
  try {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    if (nav.connection?.saveData) return "low";
    const cores = nav.hardwareConcurrency ?? 8;
    const memory = nav.deviceMemory ?? 8;
    if (cores <= LOADER_DEVICE.lowCores || memory <= LOADER_DEVICE.lowMemory) {
      return "low";
    }
    if (
      cores <= LOADER_DEVICE.mediumCores ||
      memory <= LOADER_DEVICE.mediumMemory
    ) {
      return "medium";
    }
    return "high";
  } catch {
    return "medium";
  }
}

function lowerTier(current: LoaderQuality, next: LoaderQuality): LoaderQuality {
  const rank: Record<LoaderQuality, number> = {
    low: 0,
    medium: 1,
    high: 2,
    reduced: -1,
  };
  return rank[next] < rank[current] ? next : current;
}

export function LoaderOverlay() {
  const { progressRef, readyRef, subscribe } = useAssetReadiness();
  const rootRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<SVGSVGElement>(null);
  const dropRef = useRef<SVGGElement>(null);
  const splashRef = useRef<SVGCircleElement>(null);
  const ringsRef = useRef<SVGCircleElement[]>([]);
  const dropletsRef = useRef<SVGCircleElement[]>([]);
  const metaRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [gone, setGone] = useState(false);
  const [announcement, setAnnouncement] = useState("Loading PMForge");

  useEffect(() => {
    const root = rootRef.current;
    const veil = veilRef.current;
    const stage = stageRef.current;
    const drop = dropRef.current;
    const splash = splashRef.current;
    const meta = metaRef.current;
    if (!root) return;

    const html = document.documentElement;
    const body = document.body;
    const main = document.getElementById("main");
    const header = document.querySelector<HTMLElement>("header");
    const compactRef = { current: isCompactViewport() };

    const motion = resolveMotionPrefs();
    const reduced = motion.reduced;
    const dev = process.env.NODE_ENV !== "production";
    // The overlay is already visible from the SSR byte stream; the hold budget
    // is measured from navigation start, not from React hydration, so a slow
    // hydration does not silently add to the total.
    const navElapsed = performance.now() / 1000;
    let devParam: string | null = null;
    if (dev) {
      try {
        devParam = new URLSearchParams(window.location.search).get("loader");
      } catch {
        devParam = null;
      }
    }

    const deepLink = Boolean(
      window.location.hash && window.location.hash !== "#top",
    );
    let variant: LoaderVariant =
      reduced || deepLink ? "fade" : hasSeenLoader() ? "repeat" : "full";

    let quality: LoaderQuality = reduced ? "reduced" : deviceQuality();
    if (devParam === "low") quality = "low";

    let finished = false;
    let revealed = false;
    let started = false;
    let active = true;
    let probeRaf = 0;
    let holdDone = false;
    let holdCall: gsap.core.Tween | null = null;
    let maxCall: gsap.core.Tween | null = null;
    let deadlineTimer = 0;
    const geometryRef = { current: measureGeometry(compactRef.current) };

    // Expose enough state for local QA without shipping any of it.
    const debug = dev
      ? {
          variant,
          get quality() {
            return quality;
          },
          get timeline() {
            return timelineRef.current;
          },
          skip: () => skip(),
          finish: () => finish(),
        }
      : null;

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      main?.removeAttribute("inert");
      header?.removeAttribute("inert");
      body.removeAttribute("aria-busy");
      setAnnouncement("PMForge ready");
    };

    const detachSkip = () => {
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("keydown", onKey, true);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      holdCall?.kill();
      maxCall?.kill();
      reveal();
      window.clearTimeout(deadlineTimer);
      timelineRef.current?.kill();
      timelineRef.current = null;
      detachSkip();
      html.classList.remove("is-loading");
      body.classList.remove("no-scroll");
      body.removeAttribute("aria-busy");
      main?.removeAttribute("inert");
      header?.removeAttribute("inert");
      lockScroll(false);
      rememberLoader();
      if (debug) {
        delete (window as Window & { __pmLoader?: unknown }).__pmLoader;
      }
      setGone(true);
    };

    const skip = () => {
      if (finished) return;
      if (!started) {
        begin();
        if (!started) {
          finish();
          return;
        }
      }
      timelineRef.current?.progress(1);
      reveal();
      finish();
    };

    const onPointer = () => skip();
    const onKey = (event: KeyboardEvent) => {
      if (MODIFIER_KEYS.has(event.key)) return;
      skip();
    };

    const begin = () => {
      if (started || finished || !active) return;
      started = true;
      holdCall?.kill();
      maxCall?.kill();

      const geo = geometryRef.current;
      const resolvedQuality: LoaderQuality =
        variant === "fade" ? (reduced ? "reduced" : "low") : quality;
      root.dataset.variant = variant;
      root.dataset.phase = "reveal";

      if (drop && variant !== "fade") {
        gsap.killTweensOf(drop, "scaleX,scaleY,scale");
        gsap.to(drop, {
          scale: compactRef.current ? 0.78 : 1,
          duration: LOADER_TIMING.settle,
          ease: "power2.out",
          overwrite: true,
        });
      }

      const tl = buildWaterReveal({
        elements: {
          root,
          veil,
          stage,
          drop,
          splash,
          rings: ringsRef.current.filter(Boolean),
          droplets: dropletsRef.current.filter(Boolean),
          meta,
        },
        variant,
        quality: resolvedQuality,
        origin: { x: geo.x, y: geo.y },
        radius: geo.radius,
        onReveal: reveal,
        onComplete: finish,
      });

      timelineRef.current = tl;
      tl.play(0);
    };

    const applyGeometry = () => {
      const geo = measureGeometry(compactRef.current);
      geometryRef.current = geo;
      if (stage) {
        stage.setAttribute(
          "viewBox",
          `0 0 ${window.innerWidth} ${window.innerHeight}`,
        );
      }
      if (drop && !started) {
        gsap.set(drop, { x: geo.x, y: geo.dropY });
      }
    };

    // ---------------------------------------------------------------------
    // Lock the page and stage the overlay.
    // ---------------------------------------------------------------------
    html.classList.add("is-loading");
    body.classList.add("no-scroll");
    body.setAttribute("aria-busy", "true");
    main?.setAttribute("inert", "");
    header?.setAttribute("inert", "");
    lockScroll(true);

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    if (!deepLink) window.scrollTo(0, 0);

    root.dataset.variant = variant;
    delete html.dataset.loaderBoot;
    applyGeometry();

    const mm = gsap.matchMedia();
    mm.add("(max-width: 767px)", () => {
      compactRef.current = true;
      if (!started) applyGeometry();
    });
    mm.add("(min-width: 768px)", () => {
      compactRef.current = false;
      if (!started) applyGeometry();
    });

    // The drop hangs at the top of the origin column and scales with real
    // readiness instead of pretending to load.
    let scaleTo: ((value: number) => void) | null = null;
    const baseScale = compactRef.current ? 0.34 : 0.4;
    if (drop && variant !== "fade") {
      gsap.set(stage, { autoAlpha: 1 });
      gsap.set(drop, {
        scale: baseScale,
        autoAlpha: 1,
        transformOrigin: "50% 50%",
      });
      // quickTo reuses one tween and resets it on every readiness tick. The
      // `scale` shorthand is not resettable once combined, so drive the two
      // axes individually to keep the console clean.
      const scaleXTo = gsap.quickTo(drop, "scaleX", {
        duration: LOADER_TIMING.scaleSettle,
        ease: "power2.out",
      });
      const scaleYTo = gsap.quickTo(drop, "scaleY", {
        duration: LOADER_TIMING.scaleSettle,
        ease: "power2.out",
      });
      scaleTo = (value: number) => {
        scaleXTo(value);
        scaleYTo(value);
      };
      const dropScale = (progress: number) => {
        const peak = compactRef.current ? 0.78 : 1;
        return baseScale + (peak - baseScale) * progress;
      };
      scaleTo(dropScale(progressRef.current));
      subscribe((progress) => {
        if (!started && active) scaleTo?.(dropScale(progress));
      });
    }

    // ---------------------------------------------------------------------
    // Quality: a 400ms frame-rate probe can only lower the device preset.
    //
    // Median frame time is used instead of an average because the first
    // second of this page includes hydration and the hero's shader compile:
    // one 300ms stall is not evidence of a weak GPU, and averaging it in
    // would demote every capable desktop to the fade tier.
    // ---------------------------------------------------------------------
    if (variant !== "fade") {
      const deltas: number[] = [];
      let probeStart = 0;
      let lastFrame = 0;
      const probe = (now: number) => {
        if (!probeStart) {
          probeStart = now;
          lastFrame = now;
          probeRaf = window.requestAnimationFrame(probe);
          return;
        }
        const delta = now - lastFrame;
        lastFrame = now;
        // Ignore long tasks and tab wake-ups; they say nothing about
        // sustained rendering ability.
        if (delta <= 100) deltas.push(delta);
        if (now - probeStart >= LOADER_TIMING.probe * 1000) {
          if (deltas.length >= 6) {
            deltas.sort((a, b) => a - b);
            const median = deltas[Math.floor(deltas.length / 2)];
            const fps = 1000 / median;
            if (fps < LOADER_DEVICE.lowFps) quality = lowerTier(quality, "low");
            else if (fps < LOADER_DEVICE.mediumFps) {
              quality = lowerTier(quality, "medium");
            }
          }
          return;
        }
        probeRaf = window.requestAnimationFrame(probe);
      };
      probeRaf = window.requestAnimationFrame(probe);
    }

    // ---------------------------------------------------------------------
    // Timing gates.
    // ---------------------------------------------------------------------
    const revealSeconds =
      variant === "fade"
        ? reduced
          ? LOADER_TIMING.reducedFade
          : LOADER_TIMING.routeFade
        : variant === "repeat"
          ? LOADER_TIMING.repeatFall + LOADER_TIMING.repeatSpread
          : LOADER_TIMING.fall + LOADER_TIMING.spread;

    const maxStart = Math.max(
      0,
      LOADER_TIMING.hardMax - navElapsed - revealSeconds,
    );

    if (variant === "fade") {
      holdCall = gsap.delayedCall(
        Math.max(0.02, (devParam === "slow" ? 0.6 : 0.12) - navElapsed),
        begin,
      );
    } else if (devParam === "hold") {
      // Dev-only inspection state. Click or press a key to finish.
    } else if (variant === "repeat") {
      // Repeat visits are deliberately not gated on readiness: the whole point
      // of the 0.6s variant is that the page is already warm.
      holdCall = gsap.delayedCall(
        devParam === "slow"
          ? Math.min(3.2, maxStart)
          : Math.max(0, LOADER_TIMING.repeatHold - navElapsed),
        () => {
          holdDone = true;
          begin();
        },
      );
    } else {
      const holdSeconds =
        devParam === "slow"
          ? Math.min(3.2, maxStart)
          : Math.max(0, LOADER_TIMING.hold - navElapsed);

      holdCall = gsap.delayedCall(holdSeconds, () => {
        holdDone = true;
        if (readyRef.current) begin();
      });

      subscribe(() => {
        if (holdDone && readyRef.current && active) begin();
      });

      maxCall = gsap.delayedCall(maxStart, () => {
        holdDone = true;
        begin();
      });
    }

    // Dev-only escape hatch: ?loader=skip jumps straight to the revealed page.
    if (devParam === "skip") {
      gsap.delayedCall(0.02, () => finish());
    }

    // ---------------------------------------------------------------------
    // Lifecycle listeners.
    // ---------------------------------------------------------------------
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("keydown", onKey, true);

    const onVisibility = () => {
      const tl = timelineRef.current;
      if (!tl) return;
      if (document.hidden) tl.pause();
      else tl.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onPageShow = (event: PageTransitionEvent) => {
      // Never replay after a bfcache restore.
      if (event.persisted) finish();
    };
    window.addEventListener("pageshow", onPageShow);

    const onResize = () => {
      if (started) return;
      applyGeometry();
    };
    window.addEventListener("resize", onResize);

    const onSceneReady = () => {
      if (!started) applyGeometry();
    };
    window.addEventListener("pmforge:landing-scene-ready", onSceneReady);

    // GSAP's animation clock can pause or smooth a long shader compile. The
    // maximum loading budget is wall-clock time, so it needs a native timer.
    const onDeadline = () => {
      if (html.dataset.heroSceneReady !== "true") {
        window.dispatchEvent(new Event("pmforge:hero-unavailable"));
      }
      finish();
    };
    window.addEventListener("pmforge:loader-timeout", onDeadline);
    if (html.classList.contains("loader-failed")) onDeadline();
    else if (devParam !== "hold") {
      deadlineTimer = window.setTimeout(
        onDeadline,
        Math.max(0, LOADER_TIMING.hardMax * 1000 - performance.now()),
      );
    }

    if (debug) {
      (window as Window & { __pmLoader?: unknown }).__pmLoader = debug;
    }

    return () => {
      active = false;
      holdCall?.kill();
      maxCall?.kill();
      window.clearTimeout(deadlineTimer);
      window.removeEventListener("pmforge:loader-timeout", onDeadline);
      window.cancelAnimationFrame(probeRaf);
      timelineRef.current?.kill();
      timelineRef.current = null;
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pmforge:landing-scene-ready", onSceneReady);
      mm.revert();
      if (debug) {
        delete (window as Window & { __pmLoader?: unknown }).__pmLoader;
      }
      // A StrictMode remount or a navigation away must never leave the page
      // scroll-locked.
      if (!finished) {
        html.classList.remove("is-loading");
        body.classList.remove("no-scroll");
        body.removeAttribute("aria-busy");
        main?.removeAttribute("inert");
        header?.removeAttribute("inert");
        lockScroll(false);
      }
    };
    // The hook returns stable refs/subscriptions; the loader is deliberately
    // a mount-once effect because it owns the first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!gone) return;
    // Publish readiness after React removes the veil and its scroll-lock
    // styles have painted. Measuring pinned sections mid-reveal makes the
    // first gesture compete with the loader's final layout change.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        document.documentElement.dataset.loaderDone = "true";
        window.dispatchEvent(new Event("pmforge:loader-done"));
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [gone]);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      className={styles.overlay}
      data-loader-overlay=""
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        ref={veilRef}
        className={styles.veil}
        data-loader-veil=""
        aria-hidden="true"
      />

      <svg
        ref={stageRef}
        className={styles.stage}
        data-loader-stage=""
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {LOADER_RINGS.map((factor, index) => (
          <circle
            key={factor}
            ref={(node) => {
              if (node) ringsRef.current[index] = node;
            }}
            className={styles.ring}
            data-ring={index}
          />
        ))}

        <circle
          ref={splashRef}
          className={styles.splash}
          data-loader-splash=""
        />

        {Array.from({ length: LOADER_DROPLETS }, (_, index) => (
          <circle
            key={index}
            ref={(node) => {
              if (node) dropletsRef.current[index] = node;
            }}
            className={styles.droplet}
            r={index % 2 === 0 ? 3.2 : 2.4}
            data-droplet={index}
          />
        ))}

        <g ref={dropRef} className={styles.dropWrap} data-loader-drop="">
          <path
            className={styles.drop}
            d="M0 -20C8 -8 9 2 0 12C-9 2 -8 -8 0 -20Z"
          />
        </g>
      </svg>

      <div
        ref={metaRef}
        className={styles.meta}
        data-loader-meta=""
        aria-hidden="true"
      >
        <span className={styles.wordmark}>
          PM<span className={styles.wordmarkAccent}>Forge</span>
        </span>
        <span className={styles.hint}>Click or press any key to skip</span>
      </div>

      <span className={styles.srOnly}>{announcement}</span>
    </div>
  );
}
