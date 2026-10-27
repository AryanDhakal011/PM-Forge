import gsap from "gsap";
import {
  LOADER_EASE,
  LOADER_RINGS,
  LOADER_TIMING,
  type LoaderQuality,
  type LoaderVariant,
} from "./loaderTokens";

export type WaterRevealElements = {
  root: HTMLElement;
  veil: HTMLElement | null;
  stage: SVGSVGElement | null;
  drop: SVGGElement | null;
  splash: SVGCircleElement | null;
  rings: SVGCircleElement[];
  droplets: SVGCircleElement[];
  meta: HTMLElement | null;
};

export type WaterRevealOptions = {
  elements: WaterRevealElements;
  variant: LoaderVariant;
  quality: LoaderQuality;
  /** Impact point in viewport pixels. */
  origin: { x: number; y: number };
  /** Final mask radius in pixels. Required for mask variants. */
  radius?: number;
  /** Optional duration overrides, used by the Enter button / route transitions. */
  duration?: {
    fall?: number;
    spread?: number;
    fade?: number;
  };
  /** Called when the page under the mask becomes visible (35% of the spread). */
  onReveal?: () => void;
  /** Called once the reveal has finished and the overlay can be removed. */
  onComplete?: () => void;
};

const DROPLET_FAN = Math.PI * 0.86;

/** GSAP logs "target not found" for empty lists and null entries. */
function present(...nodes: Array<Element | null | undefined>) {
  return nodes.filter((node): node is Element => Boolean(node));
}

/**
 * Builds the water-drop reveal timeline. Pure with respect to React and the
 * document: every node it touches is passed in, so the same builder can be
 * reused by the loader, the hero Enter button and future route transitions.
 *
 * The returned timeline is paused. The caller decides when readiness and the
 * minimum hold have both been satisfied.
 */
export function buildWaterReveal({
  elements,
  variant,
  quality,
  origin,
  radius = 0,
  duration,
  onReveal,
  onComplete,
}: WaterRevealOptions): gsap.core.Timeline {
  const { root, veil, stage, drop, splash, rings, droplets, meta } = elements;
  const reduced = variant === "fade" && quality === "reduced";
  const fadeOnly = variant === "fade" || quality === "low";

  // ---------------------------------------------------------------------
  // Reduced motion and route fades: one crossfade, no drop/splash/rings.
  // ---------------------------------------------------------------------
  if (fadeOnly) {
    const fade =
      duration?.fade ??
      (variant === "fade"
        ? reduced
          ? LOADER_TIMING.reducedFade
          : LOADER_TIMING.routeFade
        : LOADER_TIMING.cleanup + LOADER_TIMING.fall);
    const tl = gsap.timeline({
      paused: true,
      onComplete,
    });

    // Low-tier devices still get the drop fall; it is the one cheap piece of
    // choreography that carries the identity of the loader.
    const showDrop = quality === "low" && variant !== "fade" && Boolean(drop);
    const hidden = present(splash, ...rings, ...droplets);
    if (hidden.length) gsap.set(hidden, { autoAlpha: 0 });
    const shown = present(stage, meta, drop);
    if (shown.length) gsap.set(shown, { autoAlpha: showDrop ? 1 : 0 });

    if (showDrop && drop) {
      const fall = duration?.fall ?? LOADER_TIMING.fall;
      gsap.set(drop, { autoAlpha: 1 });
      tl.to(drop, { y: origin.y, duration: fall, ease: LOADER_EASE.fall }, 0);
      tl.call(
        () => {
          gsap.set(drop, { autoAlpha: 0 });
          onReveal?.();
        },
        undefined,
        fall,
      );
      tl.to(
        root,
        { autoAlpha: 0, duration: fade, ease: LOADER_EASE.fade },
        fall,
      );
    } else {
      tl.call(() => onReveal?.(), undefined, 0);
      tl.to(root, { autoAlpha: 0, duration: fade, ease: LOADER_EASE.fade }, 0);
    }

    return tl;
  }

  // ---------------------------------------------------------------------
  // Full / repeat: one proxy drives the mask and all three rings.
  // ---------------------------------------------------------------------
  const fall = duration?.fall ?? (variant === "repeat" ? LOADER_TIMING.repeatFall : LOADER_TIMING.fall);
  const spread = duration?.spread ?? (variant === "repeat" ? LOADER_TIMING.repeatSpread : LOADER_TIMING.spread);
  const finalRadius = Math.max(radius, Math.hypot(origin.x, origin.y) + 24);

  const activeRings = quality === "high" ? rings : rings.slice(0, 2);
  const activeDroplets =
    quality === "high" && variant !== "repeat" ? droplets : [];

  root.style.setProperty("--loader-x", `${origin.x}px`);
  root.style.setProperty("--loader-y", `${origin.y}px`);
  root.style.setProperty("--loader-r", "0px");

  rings.forEach((ring) => {
    ring.setAttribute("cx", String(origin.x));
    ring.setAttribute("cy", String(origin.y));
    ring.setAttribute("r", "0");
  });
  if (rings.length) gsap.set(rings, { autoAlpha: 0 });
  if (activeRings.length) gsap.set(activeRings, { autoAlpha: 1 });

  if (splash) {
    gsap.set(splash, {
      x: origin.x,
      y: origin.y,
      scale: 0.16,
      autoAlpha: 0,
      transformOrigin: "50% 50%",
    });
  }

  droplets.forEach((droplet) => {
    gsap.set(droplet, {
      x: origin.x,
      y: origin.y,
      scale: 1,
      autoAlpha: 0,
    });
  });

  const proxy = { r: 0 };
  const applyRadius = () => {
    root.style.setProperty("--loader-r", `${proxy.r}px`);
    for (let index = 0; index < rings.length; index += 1) {
      const factor = LOADER_RINGS[index] ?? LOADER_RINGS[LOADER_RINGS.length - 1];
      rings[index].setAttribute("r", String(proxy.r * factor));
    }
  };

  const tl = gsap.timeline({
    paused: true,
    onComplete,
  });

  if (veil) {
    tl.set(veil, { autoAlpha: 1 }, 0);
  }

  if (drop) {
    tl.to(drop, { y: origin.y, duration: fall, ease: LOADER_EASE.fall }, 0);
    tl.call(
      () => {
        gsap.set(drop, { autoAlpha: 0 });
      },
      undefined,
      fall,
    );
  }

  if (splash) {
    tl.set(splash, { autoAlpha: 0.9 }, fall);
    tl.to(
      splash,
      {
        scale: 2.4,
        autoAlpha: 0,
        duration: LOADER_TIMING.splash,
        ease: LOADER_EASE.splash,
      },
      fall,
    );
  }

  activeDroplets.forEach((droplet, index) => {
    const count = Math.max(activeDroplets.length, 1);
    const t = count === 1 ? 0 : index / (count - 1) - 0.5;
    const angle = -Math.PI / 2 + t * DROPLET_FAN;
    const distance = 54 + ((index * 37) % 46);
    tl.set(droplet, { autoAlpha: 0.9 }, fall + index * 0.014);
    tl.to(
      droplet,
      {
        x: origin.x + Math.cos(angle) * distance,
        y:
          origin.y +
          Math.sin(angle) * distance +
          (index % 2 === 0 ? 18 : 30),
        scale: 0.3,
        autoAlpha: 0,
        duration: LOADER_TIMING.droplet,
        ease: LOADER_EASE.droplets,
      },
      fall + index * 0.014,
    );
  });

  if (activeRings.length) {
    tl.to(
      activeRings,
      {
        autoAlpha: 0,
        duration: spread,
        ease: "none",
      },
      fall,
    );
  }

  tl.to(
    proxy,
    {
      r: finalRadius,
      duration: spread,
      ease: LOADER_EASE.spread,
      onUpdate: applyRadius,
    },
    fall,
  );

  tl.call(() => onReveal?.(), undefined, fall + spread * LOADER_TIMING.heroRevealAt);

  // The page is fully uncovered at this point; dissolve the remaining marks.
  if (meta) {
    tl.to(
      meta,
      { autoAlpha: 0, duration: LOADER_TIMING.metaOut, ease: "none" },
      fall,
    );
  }
  const cleanupStart = Math.max(fall, fall + spread - LOADER_TIMING.cleanup);
  if (stage) {
    tl.to(
      stage,
      { autoAlpha: 0, duration: LOADER_TIMING.cleanup, ease: "none" },
      cleanupStart,
    );
  }

  return tl;
}
