import data from "../../../content/invisible-wall/scenes.json";
import cast from "../../../content/invisible-wall/cast.json";
export const people = cast;
export type Speaker = keyof typeof people;
export type Expression = "neutral" | "thinking" | "pressured" | "annoyed" | "approving";
export type Line = { id: string; speaker: Speaker; expression: Expression; text: string; voiceId: string; phase: string; when?: string };
export type Scene = { id: string; type: string; background: string; speakers: string[]; lines: Line[]; choices: { id: string; text: string; effects: Record<string, number>; receipt: string | null; next: string | null }[]; tool: string; goal: string; canStill: string; next: string | null };
export const scenes = data as Scene[];
export const sceneById = Object.fromEntries(scenes.map(s => [s.id, s]));
export const clueInfo = {
  C1: { title: "Throttle / benchmark correlation", reading: "The slowdown follows progress, not load.", strength: [-2, -1, 2, 1] },
  C2: { title: "The ownerless wardend process", reading: "Something runs that nobody admits to.", strength: [-1, -1, 2, 2] },
  C3: { title: "The WARD glass plane", reading: "The limit is deliberate.", strength: [-3, -2, 3, 1] },
  C4: { title: "Commit signed I.O.", reading: "A founder wrote ‘stop at 74’. The author trail includes an Annex code.", strength: [-3, -2, 3, 2] },
  C5: { title: "High-load oscillation", reading: "The wall also steadies the system. Low load concealed the risk.", strength: [-2, -1, 3, -3] },
  C6: { title: "The Founders’ Charter", reading: "No capability beyond index 74 without joint review.", strength: [-2, -3, 3, -3] },
} as const;
export type Clue = keyof typeof clueInfo;
export const hypotheses = ["Scheduler bug", "Cost control", "Deliberate safety limit", "Sabotage by a person"];
export const logEvents = [134, 286, 438];
