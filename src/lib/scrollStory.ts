"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/**
 * One registration for the whole page. Every section goes through here so a
 * hot reload or a remount cannot register the plugin twice.
 */
export function ensureScrollTrigger() {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return ScrollTrigger;
}

export function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * The story state is intentionally flat at both ends and moves through the
 * middle. A linear multiplier would make the scene feel like a slider; this
 * keeps "chaos" and "resolved" as readable states.
 */
export function resolveCalm(progress: number, start = 0.14, end = 0.88) {
  const t = clamp01((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
}

const storyTargets = new WeakMap<HTMLElement, Map<string, HTMLElement[]>>();

/** Register the few painted objects that consume a scroll input. Registered
 * CSS properties do not inherit through hundreds of unrelated descendants. */
export function bindStoryTargets(
  element: HTMLElement,
  property: string,
  selectors: string,
) {
  const properties =
    storyTargets.get(element) || new Map<string, HTMLElement[]>();
  properties.set(
    property,
    Array.from(element.querySelectorAll<HTMLElement>(selectors)),
  );
  storyTargets.set(element, properties);
}

export function setStoryVar(
  element: HTMLElement,
  property: string,
  value: string,
) {
  // Preserve the section value for restoration, diagnostics and old browsers.
  if (element.style.getPropertyValue(property) !== value)
    element.style.setProperty(property, value);
  for (const target of storyTargets.get(element)?.get(property) || []) {
    if (target.style.getPropertyValue(property) !== value)
      target.style.setProperty(property, value);
  }
}

/**
 * Writes the section-scoped CSS variable. Quantising to 3 decimals avoids
 * restyling the subtree for changes the eye cannot see.
 */
export function setCalmVar(element: HTMLElement | null, value: number) {
  const calm = clamp01(value);
  if (!element) return calm;
  const next = calm.toFixed(3);
  setStoryVar(element, "--calm", next);
  return calm;
}
