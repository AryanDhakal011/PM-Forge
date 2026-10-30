"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/** Keep the pixel-ratio ladder inside the art-direction budget. */
export type DprBounds = { min: number; max: number };

export function resolveDprBounds(
  mobile: boolean,
  reducedMotion: boolean,
): DprBounds {
  if (reducedMotion) return { min: 1, max: mobile ? 1.25 : 1.5 };
  return { min: 1, max: mobile ? 1.25 : 1.75 };
}

/**
 * Rendering above the display's native ratio is supersampling: it costs real
 * fragments and buys nothing the screen can show. The tier ceiling and the
 * device ratio are both respected, whichever is lower.
 */
export function resolveDprCeiling(max: number) {
  if (typeof window === "undefined") return max;
  return Math.min(max, Math.max(1, window.devicePixelRatio || 1));
}

/**
 * Picks a sensible starting DPR once, before the renderer is created. Mid-tier
 * machines start one rung lower instead of discovering the problem by dropping
 * frames during the opening animation.
 */
export function useInitialDpr(max: number, min = 1) {
  const [dpr, setDpr] = useState(() => {
    if (typeof window === "undefined") return min;
    const device = window.devicePixelRatio || 1;
    const cores = navigator.hardwareConcurrency ?? 8;
    const memory =
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const midTier = cores <= 4 || memory <= 4;
    const ceiling = midTier ? Math.min(max, 1.25) : max;
    return Math.max(min, Math.min(device, ceiling));
  });

  return [dpr, setDpr] as const;
}

/**
 * Reversible DPR scaling driven by sustained frame time, not a single spike.
 *
 * - 2 consecutive seconds under ~45 FPS: step resolution down 15%
 * - 4 consecutive seconds over ~57 FPS: step it back up 10%
 * - Never below `min`, never above the scene's `max`
 *
 * The scene's primary geometry/material is untouched; only resolution moves,
 * which is the least visible quality lever while scrolling.
 */
export function AdaptiveDpr({
  value,
  min,
  max,
  onChange,
  enabled = true,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  enabled?: boolean;
}) {
  const valueRef = useRef(value);
  valueRef.current = value;
  const monitor = useRef({
    started: 0,
    frames: 0,
    elapsed: 0,
    slow: 0,
    fast: 0,
    lastChange: 0,
  });

  useFrame((_, delta) => {
    if (!enabled) return;
    const state = monitor.current;
    const now = performance.now();

    // The first frames include shader compilation and the loader reveal. They
    // describe start-up cost, not sustained rendering ability.
    if (!state.started) state.started = now;
    if (now - state.started < 2600) return;
    if (delta > 0.25) return;

    state.frames += 1;
    state.elapsed += delta;
    if (state.elapsed < 1) return;

    const fps = state.frames / state.elapsed;
    state.frames = 0;
    state.elapsed = 0;

    if (fps < 48) {
      state.slow += 1;
      state.fast = 0;
    } else if (fps > 57) {
      state.fast += 1;
      state.slow = 0;
    } else {
      state.slow = 0;
      state.fast = 0;
    }

    if (
      fps < 45 &&
      state.slow >= 2 &&
      valueRef.current > min + 0.05 &&
      now - state.lastChange > 2500
    ) {
      state.lastChange = now;
      state.slow = 0;
      const next = Math.max(min, Math.round(valueRef.current * 0.85 * 20) / 20);
      if (next < valueRef.current) onChange(next);
      return;
    }

    if (
      fps > 57 &&
      state.fast >= 4 &&
      valueRef.current < max - 0.05 &&
      now - state.lastChange > 4000
    ) {
      state.lastChange = now;
      state.fast = 0;
      const next = Math.min(max, Math.round(valueRef.current * 1.1 * 20) / 20);
      if (next > valueRef.current) onChange(next);
    }
  });

  return null;
}

/**
 * In "demand" mode nothing renders until someone invalidates. This bridge
 * renders one frame whenever the scene's externally-driven inputs change or
 * the frameloop becomes enabled again.
 */
export function FrameLoopBridge({
  watch,
}: {
  watch?: string | number | boolean;
}) {
  const frameloop = useThree((state) => state.frameloop);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    invalidate();
  }, [frameloop, invalidate, watch]);

  return null;
}

/**
 * Scroll-driven state lives outside React so a scroll event never re-renders a
 * scene tree. When a section changes that state it asks the active canvas for
 * exactly one frame; a "never" scene ignores it, and a continuously running
 * scene simply receives it on its next frame.
 */
const sceneInvalidators = new Map<string, () => void>();

export function invalidateScene(id: string) {
  sceneInvalidators.get(id)?.();
}

export function SceneInvalidationBridge({ id }: { id: string }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    sceneInvalidators.set(id, invalidate);
    return () => {
      if (sceneInvalidators.get(id) === invalidate)
        sceneInvalidators.delete(id);
    };
  }, [id, invalidate]);

  return null;
}

/**
 * Readiness means "the hero has actually presented a frame", not "the React
 * effect ran". The loader can use this to finish only once there is a real
 * scene behind its reveal.
 */
export function FirstFrameReady({ onReady }: { onReady?: () => void }) {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const done = useRef(false);

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useFrame(() => {
    if (done.current || !onReady) return;
    if (gl.info.render.frame < 1) return;
    done.current = true;
    // One more task boundary after the GL commands have been submitted.
    requestAnimationFrame(() => onReady());
  });

  return null;
}

/** Dev-only scene counters used by the performance report. */
export type SceneMetrics = {
  calls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  programs: number;
  dpr: number;
  frameloop: string;
  fps: number;
  frameMs: number;
  firstFrameAt: number | null;
};

export type PerfRegistry = {
  createdAt: number;
  scenes: Record<string, Record<string, unknown>>;
  longTasks: { count: number; totalMs: number; maxMs: number };
  loaderDoneAt: number | null;
  register: (id: string, scene: Record<string, unknown>) => void;
};

type PerfWindow = Window & { __pmPerf?: PerfRegistry };

export function getPerfRegistry(): PerfRegistry | null {
  if (typeof window === "undefined") return null;
  const win = window as PerfWindow;
  if (win.__pmPerf) return win.__pmPerf;
  if (process.env.NODE_ENV === "production") return null;
  const registry: PerfRegistry = {
    createdAt: performance.now(),
    scenes: {},
    longTasks: { count: 0, totalMs: 0, maxMs: 0 },
    loaderDoneAt: null,
    register(id, scene) {
      registry.scenes[id] = { ...scene, mountedAt: performance.now() };
    },
  };
  win.__pmPerf = registry;
  return registry;
}

export function SceneMetricsProbe({ id }: { id: string }) {
  const gl = useThree((state) => state.gl);
  const frameloop = useThree((state) => state.frameloop);
  const sample = useRef({ frames: 0, elapsed: 0 });

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    // Never store the renderer itself here: it is a deep, circular object and
    // makes the report impossible to serialize.
    getPerfRegistry()?.register(id, {
      dpr: gl.getPixelRatio(),
      firstFrameAt: null,
    });
  }, [gl, id]);

  // A paused scene stops running useFrame, so its last published frameloop
  // would go stale. Keep the registry honest when the lifecycle changes.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const perf = getPerfRegistry();
    const entry = perf?.scenes[id];
    if (perf && entry) {
      perf.scenes[id] = {
        ...entry,
        frameloop,
        dpr: gl.getPixelRatio(),
      };
    }
  }, [frameloop, gl, id]);

  useFrame((_, delta) => {
    if (process.env.NODE_ENV === "production") return;
    const state = sample.current;
    state.frames += 1;
    state.elapsed += delta;
    const now = performance.now();
    if (state.elapsed < 0.5) return;

    const fps = state.frames / state.elapsed;
    const info = gl.info;
    const perf = getPerfRegistry();
    const entry = perf?.scenes[id];
    if (entry) {
      const firstFrameAt =
        typeof entry.firstFrameAt === "number"
          ? entry.firstFrameAt
          : gl.info.render.frame > 0
            ? now
            : null;
      perf.scenes[id] = {
        ...entry,
        calls: info.render.calls,
        triangles: info.render.triangles,
        points: info.render.points,
        lines: info.render.lines,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        programs: info.programs?.length ?? 0,
        dpr: gl.getPixelRatio(),
        frameloop,
        fps: Math.round(fps * 10) / 10,
        frameMs: Math.round((state.elapsed / state.frames) * 1000 * 10) / 10,
        firstFrameAt,
      } satisfies SceneMetrics;
    }
    state.frames = 0;
    state.elapsed = 0;
  });

  return null;
}
