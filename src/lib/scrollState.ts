export const scrollState = {
  /** 0 -> 1 across the hero's sticky scroll. */
  hero: 0,
  /** Story state derived from the hero scroll, consumed by the 3D scene. */
  heroCalm: 0,
  /** The most recently active section's story state. */
  calm: 0,
  signal: 0,
  learning: 0,
  projects: 0,
};

export const pointerState = {
  x: 0,
  y: 0,
};
