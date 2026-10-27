"use client";

import { useEffect, useState } from "react";

export type SceneFrameloop = "always" | "demand" | "never";

export type SceneActivity = {
  /** Any part of the owning section is in the viewport. */
  visible: boolean;
  /** The section is close enough to mount/prepare its scene. */
  near: boolean;
  /** The tab is hidden, so nothing should render. */
  hidden: boolean;
  /** Visible and the tab is in the foreground. */
  active: boolean;
  frameloop: SceneFrameloop;
};

/**
 * One lifecycle for every landing scene:
 *
 * ACTIVE       visible + foreground -> "always" (or "demand" for reduced motion)
 * VISIBLE      demand-rendered only when something changes (reduced motion)
 * NEAR         mounted ahead of time, but not rendering
 * OFFSCREEN    "never" — the render loop does no work
 * HIDDEN-TAB   "never" for every scene, including the active one
 *
 * The observer watches the section rather than the canvas so a scene pinned
 * inside a tall sticky section stays active for the whole pin.
 */
export function useSceneActivity(
  sectionId: string,
  reducedMotion: boolean,
  initialVisible = false,
): SceneActivity {
  const [visible, setVisible] = useState(initialVisible);
  const [near, setNear] = useState(initialVisible);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const sync = () => setHidden(document.visibilityState === "hidden");
    sync();
    const onPageShow = () => sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("pagehide", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", onPageShow);
    };
  }, []);

  useEffect(() => {
    const element = document.getElementById(sectionId);
    if (!element || typeof IntersectionObserver === "undefined") {
      // No observer support: keep the scene available rather than blank.
      setVisible(true);
      setNear(true);
      return;
    }

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setVisible(entry.isIntersecting);
        }
      },
      { root: null, rootMargin: "0px", threshold: 0 },
    );

    // Mount a scene roughly one viewport before it can be seen so its chunk
    // and shaders are ready, without keeping it rendering in the meantime.
    const nearObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setNear(true);
        }
      },
      { root: null, rootMargin: "100% 0px 100% 0px", threshold: 0 },
    );

    visibilityObserver.observe(element);
    nearObserver.observe(element);

    return () => {
      visibilityObserver.disconnect();
      nearObserver.disconnect();
    };
  }, [sectionId]);

  const active = visible && !hidden;
  const frameloop: SceneFrameloop = active
    ? reducedMotion
      ? "demand"
      : "always"
    : "never";

  return { visible, near, hidden, active, frameloop };
}

/**
 * Cheap "is this element close to the viewport" check for lazy mounting.
 * Once it has been true the caller normally keeps the scene mounted; this hook
 * itself is stateless apart from the observer result.
 */
export function useNearViewport(
  elementRef: React.RefObject<HTMLElement | null>,
  rootMargin = "35% 0px 35% 0px",
) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setNear(true);
            observer.disconnect();
          }
        }
      },
      { root: null, rootMargin, threshold: 0 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, rootMargin]);

  return near;
}
