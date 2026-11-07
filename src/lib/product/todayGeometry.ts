export type Star = { room: number; k: number; x: number; y: number };

export function layoutStars({
  cx = 210,
  cy = 188,
  rooms = 7,
  perRoom = 9,
}: {
  cx?: number;
  cy?: number;
  rooms?: number;
  perRoom?: number;
} = {}): Star[] {
  const stars: Star[] = [];
  for (let r = 0; r < rooms; r++) {
    const base = (r / rooms) * Math.PI * 2 - Math.PI / 2;
    for (let k = 0; k < perRoom; k++) {
      const t = k / (perRoom - 1);
      const rad = 74 + t * 92;
      const wobble = Math.sin(k * 1.7 + r) * 0.07;
      const ang = base + (t - 0.5) * 0.36 + wobble;
      stars.push({ room: r, k, x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad * 0.9 });
    }
  }
  return stars;
}
