"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSettings } from "@/components/providers/SettingsProvider";
import { ensureScrollTrigger } from "@/lib/scrollStory";
import { setScrollInstance, scrollToSection } from "@/lib/scrollTo";

/**
 * One scroll authority for the whole site: Lenis for input smoothing and
 * GSAP ScrollTrigger for the scroll-linked scenes. Both are skipped when the
 * visitor asks for reduced motion.
 */
export function SmoothScroll() {
  const { reducedMotion } = useSettings();
  const pathname = usePathname();
  const [nativeScroll, setNativeScroll] = useState<boolean | null>(null);
  useEffect(() => {
    const compact = matchMedia("(max-width: 767px)");
    const update = () => setNativeScroll(compact.matches);
    update();
    compact.addEventListener("change", update);
    return () => compact.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (nativeScroll === null) return;
    ensureScrollTrigger();

    if (pathname.startsWith("/app") || pathname === "/onboarding") {
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      setScrollInstance(null);
      return;
    }

    if (reducedMotion) {
      document.documentElement.classList.remove("lenis", "lenis-smooth");
      setScrollInstance(null);
      ScrollTrigger.refresh();
      return;
    }

    const lenis = nativeScroll
      ? null
      : new Lenis({
          autoRaf: false,
          duration: 1.05,
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 1.6,
          syncTouch: false,
          anchors: false,
          // This component owns resize observation. Avoid a second ResizeObserver
          // in Lenis measuring the same document during ScrollTrigger refreshes.
          autoResize: false,
        });

    setScrollInstance(lenis);

    const onScroll = () => ScrollTrigger.update();
    lenis?.on("scroll", onScroll);

    const raf = (time: number) => lenis?.raf(time * 1000);
    if (lenis) gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    let disposed = false;
    let lastWidth = 0;
    let lastHeight = 0;
    let lastViewportWidth = 0;
    let lastViewportHeight = 0;
    let initialReady = false;
    let fontsReady = false;
    const refresh = () => {
      if (disposed) return;
      lenis?.resize();
      ScrollTrigger.refresh();
      // Refresh can change pin spacing. Record the resulting dimensions so
      // the observer does not schedule another refresh for our own writes.
      lastWidth = document.body.offsetWidth;
      lastHeight = document.body.offsetHeight;
      lastViewportWidth = window.innerWidth;
      lastViewportHeight = window.innerHeight;
    };
    // Measure once after typography and the real hero frame or mobile poster.
    // Separate milestone refreshes used to collide with the first gesture.
    const refreshWhenReady = () => {
      if (disposed || initialReady || !fontsReady) return;
      if (
        pathname === "/" &&
        (document.documentElement.dataset.heroSceneReady !== "true" ||
          document.documentElement.dataset.loaderDone !== "true")
      )
        return;
      initialReady = true;
      refresh();
    };
    window.addEventListener("pmforge:loader-done", refreshWhenReady);
    window.addEventListener("pmforge:landing-scene-ready", refreshWhenReady);
    void document.fonts.ready.then(() => {
      fontsReady = true;
      refreshWhenReady();
    });

    // Late images or a canvas mounting can still change document height after
    // those milestones. Recalculate once the layout has actually stopped
    // moving, debounced so a burst of changes only costs one refresh.
    let settleTimer = 0;
    const refreshWhenSettled = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (disposed || !initialReady) return;
        if (
          document.body.offsetWidth === lastWidth &&
          document.body.offsetHeight === lastHeight &&
          window.innerWidth === lastViewportWidth &&
          window.innerHeight === lastViewportHeight
        )
          return;
        // A late image should not interrupt a wheel gesture with synchronous
        // measurements of every pinned section. Settle after scrolling stops.
        if (ScrollTrigger.isScrolling()) {
          refreshWhenSettled();
          return;
        }
        refresh();
      }, 180);
    };
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(refreshWhenSettled)
        : null;
    if (resizeObserver) {
      resizeObserver.observe(document.body);
    }
    window.addEventListener("resize", refreshWhenSettled);

    // Dialog and menu locking already set this class; keep Lenis in sync.
    const observer = new MutationObserver(() => {
      if (document.body.classList.contains("no-scroll")) {
        lenis?.stop();
      } else {
        lenis?.start();
      }
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      disposed = true;
      window.clearTimeout(settleTimer);
      window.removeEventListener("pmforge:loader-done", refreshWhenReady);
      window.removeEventListener(
        "pmforge:landing-scene-ready",
        refreshWhenReady,
      );
      window.removeEventListener("resize", refreshWhenSettled);
      resizeObserver?.disconnect();
      observer.disconnect();
      lenis?.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      lenis?.destroy();
      setScrollInstance(null);
    };
  }, [reducedMotion, pathname, nativeScroll]);

  useEffect(() => {
    // Same-page anchors use Lenis instead of a native jump.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      if (href.startsWith("/#") && window.location.pathname === "/") {
        const id = href.slice(2);
        if (!id) return;
        event.preventDefault();
        scrollToSection(id, reducedMotion ? "auto" : "smooth");
        return;
      }

      if (!href.startsWith("#")) return;
      const id = href.slice(1);
      if (!id) return;
      event.preventDefault();
      scrollToSection(id, reducedMotion ? "auto" : "smooth");
      if (id === "main") {
        document.getElementById("main")?.focus({ preventScroll: true });
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [reducedMotion]);

  const pendingHash = pathname;

  useEffect(() => {
    // Route changes to a hash (for example /#blueprint from another page)
    // need a moment for the target section to paint.
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    let attempts = 0;
    let timer = 0;
    let initialScroll: number | null = null;
    let cancelled = false;
    const tryScroll = () => {
      const exists = document.getElementById(hash === "top" ? "hero" : hash);
      if (exists) {
        scrollToSection(hash, "auto");
        initialScroll = window.scrollY;
        return;
      }
      attempts += 1;
      if (attempts < 20) timer = window.setTimeout(tryScroll, 80);
    };
    timer = window.setTimeout(tryScroll, 120);

    // Late-loading fonts and images can move a deep-linked section. Re-anchor
    // once, but only if the visitor has not started scrolling themselves.
    const fonts = document.fonts;
    if (fonts?.ready) {
      void fonts.ready.then(() => {
        if (cancelled || initialScroll === null) return;
        if (Math.abs(window.scrollY - initialScroll) > 80) return;
        ScrollTrigger.refresh();
        scrollToSection(hash, "auto");
      });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pendingHash, reducedMotion]);

  return null;
}
