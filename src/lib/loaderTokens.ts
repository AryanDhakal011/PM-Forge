/**
 * Timing contract for the water-drop loader.
 *
 * The CSS custom properties in `src/styles/tokens.css` mirror these values for
 * the handful of things the browser animates without GSAP (the overlay fade
 * fallback). Keep the two files in sync when tuning.
 */

export type LoaderVariant = "full" | "repeat" | "fade";
export type LoaderQuality = "high" | "medium" | "low" | "reduced";

export const LOADER_TIMING = {
  /** Never reveal before this, so a warm cache still reads as intentional. */
  hold: 1.1,
  /** Drop fall. Matches the Section 4 spec exactly. */
  fall: 0.45,
  /** Mask + ring spread. The spec allows up to 1.3s; 1.25 keeps a first visit under 2.8s. */
  spread: 1.25,
  /** Repeat visit in the same session. hold + fall + spread === 0.6s. */
  repeatHold: 0.12,
  repeatFall: 0.18,
  repeatSpread: 0.3,
  /** Deep link / route transition. */
  routeFade: 0.3,
  /** Reduced motion crossfade. No drop, splash, rings or split text. */
  reducedFade: 0.25,
  /** Overlay removal after the mask clears. */
  cleanup: 0.18,
  /** Impact splash lifetime. */
  splash: 0.38,
  /** Droplet lifetime. */
  droplet: 0.62,
  /** Drop settles to its final scale before the fall begins. */
  settle: 0.18,
  /** Readiness smoothing for the drop's scale. */
  scaleSettle: 0.35,
  /** Wordmark fade-in and fade-out. */
  metaIn: 0.5,
  metaDelay: 0.18,
  metaOut: 0.24,
  /** Hero reveal point inside the spread. */
  heroRevealAt: 0.35,
  /** Readiness ceiling for the hero's first 3D frame. */
  heroReadinessTimeout: 2.4,
  /** The overlay must be gone by this point, no matter what is still loading. */
  hardMax: 5,
  /** Quality probe window. */
  probe: 0.4,
} as const;

export const LOADER_EASE = {
  fall: "power2.in",
  spread: "power3.out",
  splash: "power2.out",
  droplets: "power2.out",
  fade: "power2.out",
  dropScale: "power2.out",
} as const;

/** Ring radii as a fraction of the shared spread radius. */
export const LOADER_RINGS = [1, 0.82, 0.64] as const;

export const LOADER_DROPLETS = 7;

export const LOADER_SESSION_KEY = "pmforge.loader.seen";

export const LOADER_MOTION_KEY = "pmforge.reducedMotion";

/** Device classes that lower the loader tier before the FPS probe finishes. */
export const LOADER_DEVICE = {
  lowCores: 2,
  mediumCores: 4,
  lowMemory: 2,
  mediumMemory: 4,
  lowFps: 24,
  mediumFps: 45,
} as const;
