"use client";

import { useEffect, useState } from "react";
import { getPerfRegistry } from "@/three/sceneRuntime";

type SceneSnapshot = {
  calls?: number;
  triangles?: number;
  geometries?: number;
  textures?: number;
  programs?: number;
  dpr?: number;
  frameloop?: string;
  fps?: number;
  frameMs?: number;
  mountedAt?: number;
  firstFrameAt?: number | null;
};

function buildReport() {
  const registry = getPerfRegistry();
  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const scripts = resources.filter((entry) => entry.initiatorType === "script");
  const styles = resources.filter((entry) => entry.initiatorType === "link");
  const scenes: Record<string, unknown> = {};

  for (const [id, raw] of Object.entries(registry?.scenes ?? {})) {
    const scene = raw as SceneSnapshot;
    scenes[id] = {
      ...scene,
      initMs:
        typeof scene.firstFrameAt === "number" && scene.mountedAt
          ? Math.round(scene.firstFrameAt - scene.mountedAt)
          : null,
      firstFrameMs:
        typeof scene.firstFrameAt === "number" && nav
          ? Math.round(scene.firstFrameAt - nav.startTime)
          : null,
    };
  }

  return {
    capturedAt: Math.round(performance.now()),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio,
    },
    navigation: nav
      ? {
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
          loadEventEnd: Math.round(nav.loadEventEnd),
          documentTransferKB: Math.round(nav.transferSize / 1024),
        }
      : null,
    loader: {
      doneAt: registry?.loaderDoneAt ? Math.round(registry.loaderDoneAt) : null,
      variant: document.querySelector<HTMLElement>("[data-loader-overlay]")?.dataset.variant ?? null,
    },
    js: {
      scriptCount: scripts.length,
      transferKB: Math.round(
        scripts.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024,
      ),
      styleTransferKB: Math.round(
        styles.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024,
      ),
    },
    canvases: document.querySelectorAll("canvas").length,
    webglCanvases: [...document.querySelectorAll("canvas")].filter((canvas) => {
      try {
        return canvas.getContext("2d") === null;
      } catch {
        return false;
      }
    }).length,
    trackedWebGLScenes: Object.keys(registry?.scenes ?? {}).length,
    activeScenes: Object.entries(registry?.scenes ?? {})
      .filter(([, raw]) => (raw as SceneSnapshot).frameloop !== "never")
      .map(([id]) => id),
    longTasks: registry?.longTasks ?? null,
    scenes,
  };
}

function useQueryFlag() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    try {
      setEnabled(new URLSearchParams(window.location.search).has("perf"));
    } catch {
      setEnabled(false);
    }
  }, []);
  return enabled;
}

/**
 * Dev-only instrumentation. Production compiles this to `null` and none of the
 * probe code below is reachable.
 */
export function PerformanceReport() {
  if (process.env.NODE_ENV === "production") return null;
  return <PerformanceReportImpl />;
}

function PerformanceReportImpl() {
  const enabled = useQueryFlag();
  const [line, setLine] = useState("collecting…");

  useEffect(() => {
    const registry = getPerfRegistry();
    if (!registry) return;

    (window as Window & { __pmPerfReport?: () => unknown }).__pmPerfReport = buildReport;

    if (document.documentElement.dataset.loaderDone === "true" && !registry.loaderDoneAt) {
      registry.loaderDoneAt = performance.now();
    }
    const onLoaderDone = () => {
      if (!registry.loaderDoneAt) registry.loaderDoneAt = performance.now();
    };
    window.addEventListener("pmforge:loader-done", onLoaderDone);

    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          registry.longTasks.count += 1;
          registry.longTasks.totalMs += entry.duration;
          registry.longTasks.maxMs = Math.max(registry.longTasks.maxMs, entry.duration);
        }
        registry.longTasks.totalMs = Math.round(registry.longTasks.totalMs);
        registry.longTasks.maxMs = Math.round(registry.longTasks.maxMs);
      });
      observer.observe({ type: "longtask", buffered: true });
    } catch {
      observer = null;
    }

    return () => {
      window.removeEventListener("pmforge:loader-done", onLoaderDone);
      observer?.disconnect();
      delete (window as Window & { __pmPerfReport?: () => unknown }).__pmPerfReport;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const report = buildReport() as ReturnType<typeof buildReport> & {
        scenes: Record<string, SceneSnapshot>;
        activeScenes: string[];
      };
      const active = report.activeScenes[0] ?? "none";
      const scene = report.scenes[active] ?? {};
      setLine(
        [
          `WGL ${report.webglCanvases} canvas · ${report.trackedWebGLScenes} scenes · active ${report.activeScenes.join("+") || "none"}`,
          scene.fps ? `${scene.fps}fps` : null,
          scene.calls != null ? `${scene.calls} calls` : null,
          `dpr ${scene.dpr ?? report.viewport.dpr}`,
          `js ${report.js.transferKB}KB`,
          report.loader.doneAt ? `loader ${(report.loader.doneAt / 1000).toFixed(2)}s` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );
    };
    tick();
    const id = window.setInterval(tick, 700);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        zIndex: 2147483647,
        right: 10,
        bottom: 10,
        maxWidth: "min(92vw, 560px)",
        padding: "6px 9px",
        borderRadius: 4,
        background: "rgba(20, 18, 14, 0.86)",
        color: "#f6eedf",
        font: "11px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
        pointerEvents: "none",
        whiteSpace: "normal",
      }}
    >
      {line}
      <br />
      <span style={{ opacity: 0.65 }}>window.__pmPerfReport() for the full JSON</span>
    </div>
  );
}
