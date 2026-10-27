/**
 * Single source of truth for reduced motion.
 *
 * The OS preference and the in-app footer toggle are combined with OR: either
 * one can reduce motion, and a stored "full" value can never override an OS
 * request for less motion.
 */

export type StoredMotion = "reduce" | "full" | null;

export type MotionPrefs = {
  reduced: boolean;
  osReduced: boolean;
  stored: StoredMotion;
};

const STORAGE_KEY = "pmforge.reducedMotion";
const LEGACY_KEY = "pmforge.motion";

export function readStoredMotion(): StoredMotion {
  try {
    const value =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_KEY);
    if (value === "reduce") return "reduce";
    if (value === "full") return "full";
    return null;
  } catch {
    // Storage can throw in private mode or when blocked by the browser.
    return null;
  }
}

export function writeStoredMotion(value: Exclude<StoredMotion, null>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Preference persistence is an enhancement, never a hard failure.
  }
}

export function systemPrefersReduced(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function resolveMotionPrefs(): MotionPrefs {
  const osReduced = systemPrefersReduced();
  const stored = readStoredMotion();
  return {
    osReduced,
    stored,
    reduced: osReduced || stored === "reduce",
  };
}

export const MOTION_STORAGE_KEY = STORAGE_KEY;
