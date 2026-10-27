"use client";

import { useEffect, useRef } from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "fade-up" | "paper-settle" | "ink-write" | "draw" | "node-snap";
  as?: "div" | "section" | "li" | "article" | "header" | "figure";
  threshold?: number;
};

const pendingNodes = new Set<HTMLElement>();
let observer: IntersectionObserver | null = null;
let loaderReady = false;
let layoutReady: Promise<void> | null = null;

function waitForLayout() {
  if (!layoutReady) {
    const imageDecodes = Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth > 0)
      .map((image) => image.decode());
    layoutReady = Promise.allSettled([document.fonts.ready, ...imageDecodes]).then(
      (results) => {
        const failures = results.flatMap((result) =>
          result.status === "rejected" ? [result.reason] : [],
        );
        if (failures.length) {
          console.warn("Some loaded assets could not be decoded before reveals.", failures);
        }
      },
    );
  }
  return layoutReady;
}

function revealNode(node: HTMLElement) {
  node.dataset.visible = "true";
  pendingNodes.delete(node);
}

function onLoaderReady() {
  loaderReady = true;
  if (pendingNodes.size) {
    window.setTimeout(() => {
      [...pendingNodes]
        .sort((a, b) => {
          const position = a.compareDocumentPosition(b);
          if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
          if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
          return 0;
        })
        .forEach(revealNode);
    }, 80);
  }
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "fade-up",
  as: Tag = "div",
  threshold = 0.25,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reducedMotion === "true" ||
      !("IntersectionObserver" in window)
    ) {
      node.dataset.visible = "true";
      return;
    }

    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              const revealThreshold = Number(
                target.dataset.revealThreshold ?? 0.25,
              );
              if (entry.intersectionRatio < revealThreshold) continue;
              if (loaderReady) {
                revealNode(target);
              } else {
                pendingNodes.add(target);
              }
              observer?.unobserve(target);
            }
          }
        },
        {
          threshold: [0, 0.12, 0.25, 0.5, 0.75, 0.9, 1],
          rootMargin: "0px 0px -12% 0px",
        },
      );
      window.addEventListener("pmforge:loader-done", onLoaderReady, { once: true });
      if (document.documentElement.dataset.loaderDone === "true") loaderReady = true;
    }

    document.documentElement.classList.add("js-ready");
    let active = true;
    const fallback = window.setTimeout(() => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        revealNode(node);
        observer?.unobserve(node);
      }
    }, 2500);
    void waitForLayout().then(() => {
      if (active && node.dataset.visible !== "true") observer?.observe(node);
    });
    return () => {
      active = false;
      window.clearTimeout(fallback);
      pendingNodes.delete(node);
      observer?.unobserve(node);
    };
  }, [threshold]);

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      data-visible="false"
      data-reveal={variant}
      data-reveal-threshold={threshold}
    >
      {children}
    </Tag>
  );
}
