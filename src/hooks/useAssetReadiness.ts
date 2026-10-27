"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LOADER_TIMING } from "@/lib/loaderTokens";

export type AssetMilestones = {
  fonts: boolean;
  hero: boolean;
  nav: boolean;
};

export type AssetReadiness = {
  /**
   * Smoothed 0–1 readiness. Read this from a GSAP ticker or an animation
   * callback; it intentionally is not React state so a full-screen repaint is
   * never triggered by a readiness tick.
   */
  progressRef: React.MutableRefObject<number>;
  readyRef: React.MutableRefObject<boolean>;
  subscribe: (listener: (progress: number) => void) => () => void;
  ready: boolean;
  milestones: AssetMilestones;
  heroUnavailable: boolean;
};

type Options = {
  heroTimeout?: number;
};

const EMPTY: AssetMilestones = { fonts: false, hero: false, nav: false };

/**
 * Gates the loader on the things a visitor can actually see on the first
 * screen: fonts, the hero's first frame (or a declared fallback) and the
 * hydrated navigation. Below-fold scenes are never part of this gate.
 */
export function useAssetReadiness({
  heroTimeout = LOADER_TIMING.heroReadinessTimeout * 1000,
}: Options = {}): AssetReadiness {
  const progressRef = useRef(0);
  const readyRef = useRef(false);
  const targetRef = useRef(0);
  const milestonesRef = useRef<AssetMilestones>({ ...EMPTY });
  const listenersRef = useRef(new Set<(progress: number) => void>());
  const [milestones, setMilestones] = useState<AssetMilestones>({ ...EMPTY });
  const [ready, setReady] = useState(false);
  const [heroUnavailable, setHeroUnavailable] = useState(false);

  const subscribe = useCallback((listener: (progress: number) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let heroTimer = 0;
    const rafs: number[] = [];

    const mark = (key: keyof AssetMilestones) => {
      if (cancelled || milestonesRef.current[key]) return;
      milestonesRef.current = { ...milestonesRef.current, [key]: true };
      const count =
        Number(milestonesRef.current.fonts) +
        Number(milestonesRef.current.hero) +
        Number(milestonesRef.current.nav);
      targetRef.current = count / 3;
      setMilestones(milestonesRef.current);
      if (count === 3) {
        readyRef.current = true;
        setReady(true);
      }
    };

    const afterPaint = (fn: () => void) => {
      const first = window.requestAnimationFrame(() => {
        const second = window.requestAnimationFrame(() => {
          if (!cancelled) fn();
        });
        rafs.push(second);
      });
      rafs.push(first);
    };

    const markHero = () => {
      if (cancelled || milestonesRef.current.hero) return;
      window.clearTimeout(heroTimer);
      afterPaint(() => mark("hero"));
    };

    // Fonts.
    try {
      if (document.fonts?.ready) {
        void document.fonts.ready.then(() => mark("fonts"));
      } else {
        mark("fonts");
      }
    } catch {
      mark("fonts");
    }

    // Navigation is hydrated by the time this effect runs, but wait for the
    // first painted frame so the header is genuinely on screen.
    afterPaint(() => mark("nav"));

    // Hero: use the scene's existing readiness event when it exists.
    const html = document.documentElement;
    if (html.dataset.heroSceneReady === "true") {
      markHero();
    }

    const onSceneReady = (event: Event) => {
      if ((event as CustomEvent<string>).detail === "hero") markHero();
    };
    window.addEventListener("pmforge:landing-scene-ready", onSceneReady);

    // The hero is either ready (the scene reports its first presented frame)
    // or declared unavailable. The loader must not reveal an empty stage, so
    // this waits for the real scene up to `heroReadinessTimeout`; the global
    // hard max still guarantees the overlay cannot trap a visitor.
    heroTimer = window.setTimeout(() => {
      if (cancelled || milestonesRef.current.hero) return;
      setHeroUnavailable(true);
      mark("hero");
    }, heroTimeout);

    return () => {
      cancelled = true;
      window.clearTimeout(heroTimer);
      rafs.forEach((raf) => window.cancelAnimationFrame(raf));
      window.removeEventListener("pmforge:landing-scene-ready", onSceneReady);
    };
  }, [heroTimeout]);

  useEffect(() => {
    const tick = () => {
      const target = targetRef.current;
      const current = progressRef.current;
      if (Math.abs(target - current) < 0.0005) {
        if (current !== target) {
          progressRef.current = target;
          listenersRef.current.forEach((listener) => listener(target));
        }
        return;
      }

      // Frame-rate independent exponential smoothing. deltaRatio(60) is 1 for
      // a 60fps frame and grows when the tab throttles.
      const ratio = Math.min(gsap.ticker.deltaRatio(60), 8);
      const factor = 1 - Math.pow(0.84, ratio);
      const next = current + (target - current) * factor;
      progressRef.current = next;
      listenersRef.current.forEach((listener) => listener(next));
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, []);

  return {
    progressRef,
    readyRef,
    subscribe,
    ready,
    milestones,
    heroUnavailable,
  };
}
