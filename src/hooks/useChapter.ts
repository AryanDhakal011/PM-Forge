"use client";

import { useEffect, useRef, useState } from "react";

export type ChapterId = "chaos" | "signal" | "decision" | "impact";

export type SectionSpec = {
  id: string;
  scene: ChapterId;
  nav?: string;
};

/**
 * Single source of truth for the scene state machine. The scene drives the 3D
 * camera and analytics; it is intentionally not rendered as a rail.
 */
export const SECTIONS: SectionSpec[] = [
  { id: "hero", scene: "chaos", nav: "home" },
  { id: "signal", scene: "signal", nav: "modules" },
  { id: "learning", scene: "signal", nav: "modules" },
  { id: "projects", scene: "decision", nav: "projects" },
  { id: "interview", scene: "decision", nav: "interview" },
  { id: "career", scene: "impact", nav: "tools" },
  { id: "blueprint", scene: "impact", nav: "resources" },
];

const NAV_BY_ID = new Map(SECTIONS.map((section) => [section.id, section.nav]));

declare global {
  interface Window {
    __scene?: ChapterId;
    __section?: string;
  }
}

/**
 * Track which section owns the viewport. IntersectionObserver does the work —
 * there is no layout read inside a scroll handler. The section nearest the
 * viewport centre wins, which keeps tall pinned sections predictable.
 */
function useSectionState(onSection: (id: string | null) => void) {
  const callbackRef = useRef(onSection);

  useEffect(() => {
    callbackRef.current = onSection;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const visible = new Set<string>();
    let observer: IntersectionObserver | null = null;
    let frame = 0;

    const resolve = () => {
      frame = 0;
      if (!visible.size) return;
      const mid = window.innerHeight / 2;
      let best: { id: string; distance: number } | null = null;
      for (const id of visible) {
        const node = document.getElementById(id);
        if (!node) continue;
        const rect = node.getBoundingClientRect();
        const distance =
          rect.top <= mid && rect.bottom >= mid
            ? 0
            : Math.min(Math.abs(rect.top - mid), Math.abs(rect.bottom - mid));
        if (!best || distance < best.distance) best = { id, distance };
      }
      if (!best) return;
      callbackRef.current(best.id);
      if (process.env.NODE_ENV !== "production") {
        window.__section = best.id;
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(resolve);
    };

    const attach = () => {
      const nodes = SECTIONS.map((section) => document.getElementById(section.id)).filter(
        (node): node is HTMLElement => Boolean(node),
      );
      if (!nodes.length || observer) return;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target.id);
            else visible.delete(entry.target.id);
          }
          schedule();
        },
        { threshold: [0, 0.25, 0.5], rootMargin: "-20% 0px -20% 0px" },
      );
      nodes.forEach((node) => observer?.observe(node));
      schedule();
    };

    attach();
    // Sections may mount after the preloader, so re-check once.
    const retry = window.setTimeout(attach, 600);

    return () => {
      window.clearTimeout(retry);
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);
}

/** Returns the active scene (chaos → signal → decision → impact). */
export function useChapter(): ChapterId {
  const [chapter, setChapter] = useState<ChapterId>("chaos");

  useSectionState((id) => {
    if (!id) return;
    const scene = SECTIONS.find((section) => section.id === id)?.scene;
    if (!scene) return;
    setChapter((current) => (current === scene ? current : scene));
    if (process.env.NODE_ENV !== "production") {
      window.__scene = scene;
    }
  });

  return chapter;
}

/** Returns the nav key for the section currently under the viewport. */
export function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null);

  useSectionState((id) => {
    if (!id) return;
    const nav = NAV_BY_ID.get(id) ?? null;
    setActive((current) => (current === nav ? current : nav));
  });

  return active;
}

/** Returns the raw section id (used for nav theming). */
export function useActiveSectionId(): string | null {
  const [active, setActive] = useState<string | null>(null);

  useSectionState((id) => {
    setActive((current) => (current === id ? current : id));
  });

  return active;
}
