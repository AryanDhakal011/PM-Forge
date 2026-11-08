"use client";

export type MotionTier = "high" | "mid" | "low";

export const motion = {
  scroll: 0,
  velocity: 0,
  direction: 1,
  mouse: { x: 0, y: 0, nx: 0, ny: 0 },
  activeSection: "hero",
  tier: "high" as MotionTier,
  reduced: false,
  loaderDone: false,
  sound: false,
  compass: 0,
  calm: 0,
};

