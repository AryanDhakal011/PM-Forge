"use client";
import { db } from "./db";
import type { Run } from "./types";
export function practiceSession() {
  // Thirty minutes of inactivity begins a new practice session, including reloads.
  const now = Date.now();
  let saved: { id: string; at: number } | null = null;
  try {
    saved = JSON.parse(
      localStorage.getItem("pmforge.practiceSession") || "null",
    );
  } catch {}
  const value =
    saved && now - saved.at < 30 * 60_000
      ? { ...saved, at: now }
      : { id: crypto.randomUUID(), at: now };
  localStorage.setItem("pmforge.practiceSession", JSON.stringify(value));
  return value.id;
}
export type ActivationEvent = {
  name:
    | "first_run_started"
    | "debrief_reached"
    | "reflection_finished"
    | "reflection_skipped";
  runId: string;
  sessionId: string;
  at: string;
  sessionOne: boolean;
};
export async function trackActivation(run: Run, name: ActivationEvent["name"]) {
  if (!run.guided || !run.sessionId) return;
  const active = practiceSession();
  const key = `activation:${run.ownerId}:${run.id}:${name}`;
  const event: ActivationEvent = {
    name,
    runId: run.id,
    sessionId: active,
    at: new Date().toISOString(),
    sessionOne: active === run.sessionId,
  };
  if (!(await db.meta.get(key)))
    await db.meta.put({ key, value: JSON.stringify(event) });
}
export async function activationEvents(
  ownerId: string,
): Promise<ActivationEvent[]> {
  const rows = await db.meta
    .where("key")
    .startsWith(`activation:${ownerId}:`)
    .toArray();
  return rows.map((row) => JSON.parse(row.value));
}
