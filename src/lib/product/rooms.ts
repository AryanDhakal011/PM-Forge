import type { Category } from "./types";

export type Room = {
  id: Category;
  label: string;
  shortName: string;
  code: string;
  order: number;
};

export const ROOMS: Room[] = [
  { id: "root-cause", label: "Root Cause Analysis", shortName: "Root cause", code: "RCA", order: 0 },
  { id: "product-sense", label: "Product Sense", shortName: "Product sense", code: "PS", order: 1 },
  { id: "strategy", label: "Market Strategy", shortName: "Strategy", code: "MS", order: 2 },
  { id: "execution-metrics", label: "Execution & Metrics", shortName: "Metrics", code: "E&M", order: 3 },
  { id: "estimation", label: "Estimation", shortName: "Estimation", code: "E", order: 4 },
  { id: "ai-technical", label: "AI & Technical", shortName: "AI & technical", code: "A&T", order: 5 },
  { id: "behavioral", label: "Behavioral", shortName: "Behavioral", code: "B", order: 6 },
];

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map((room) => [room.id, room])) as Record<Category, Room>;
