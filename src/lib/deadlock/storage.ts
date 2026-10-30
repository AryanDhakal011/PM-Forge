"use client";
import Dexie, { type EntityTable } from "dexie";
import { replay, savedRunSchema, withEchoes } from "./engine";
import type { SavedRun } from "./types";
const local = new Dexie("pmforge-deadlock-v1") as Dexie & {
  runs: EntityTable<SavedRun, "id">;
};
local.version(1).stores({ runs: "id,ownerId,parentId,updatedAt" });
const memory = new Map<string, SavedRun>();
let degraded = false;
export class DeadlockConflict extends Error {
  constructor() {
    super(
      "This run changed in another tab. Reload to continue its latest event log.",
    );
  }
}
export async function loadRun(id: string, ownerId: string) {
  let run: SavedRun | undefined;
  try {
    run = await local.runs.get(id);
    const live = memory.get(id);
    if (live && (!run || live.revision > run.revision)) run = live;
  } catch {
    run = memory.get(id);
  }
  if (!run || run.ownerId !== ownerId) return null;
  const checked = savedRunSchema.parse(run) as SavedRun;
  replay(checked.events);
  return checked;
}
export async function listRuns(ownerId: string) {
  try {
    const disk = await local.runs
      .where("ownerId")
      .equals(ownerId)
      .reverse()
      .sortBy("updatedAt");
    const merged = new Map(disk.map((r) => [r.id, r]));
    for (const r of memory.values())
      if (
        r.ownerId === ownerId &&
        (!merged.has(r.id) || merged.get(r.id)!.revision < r.revision)
      )
        merged.set(r.id, r);
    return [...merged.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  } catch {
    return [...memory.values()]
      .filter((r) => r.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}
export async function persistRun(run: SavedRun, expectedRevision?: number) {
  const next = savedRunSchema.parse(withEchoes(run)) as SavedRun;
  replay(next.events);
  if (degraded) {
    const current = memory.get(next.id);
    if (current && current.revision !== expectedRevision)
      throw new DeadlockConflict();
    if (
      !current &&
      next.parentId &&
      [...memory.values()].filter((r) => r.parentId === next.parentId).length >=
        6
    )
      throw Error("This run already has six branches.");
    memory.set(next.id, next);
    return false;
  }
  try {
    await local.transaction("rw", local.runs, async () => {
      const current = await local.runs.get(next.id);
      if (
        current &&
        (current.ownerId !== next.ownerId ||
          current.revision !== expectedRevision)
      )
        throw new DeadlockConflict();
      if (
        current &&
        JSON.stringify(current.events) !==
          JSON.stringify(next.events.slice(0, current.events.length))
      )
        throw new DeadlockConflict();
      if (next.parentId && !current) {
        const branches = await local.runs
          .where("parentId")
          .equals(next.parentId)
          .count();
        if (branches >= 6)
          throw Error(
            "This run already has six branches. Export or remove one before making another.",
          );
      }
      await local.runs.put(next);
    });
    memory.set(next.id, next);
    return true;
  } catch (error) {
    if (
      error instanceof DeadlockConflict ||
      (error instanceof Error && error.message.includes("six branches"))
    )
      throw error;
    const current = memory.get(next.id);
    if (
      current &&
      expectedRevision !== undefined &&
      current.revision !== expectedRevision
    )
      throw new DeadlockConflict();
    degraded = true;
    memory.set(next.id, next);
    return false;
  }
}
export async function saveNote(id: string, ownerId: string, note: string) {
  const run = await loadRun(id, ownerId);
  if (!run) return;
  run.note = note.slice(0, 500);
  memory.set(id, run);
  if (degraded) return;
  try {
    await local.runs.update(id, { note: run.note });
  } catch {
    memory.set(id, run);
  }
}
export async function deleteRun(id: string, ownerId: string) {
  const run = await loadRun(id, ownerId);
  if (!run) return;
  try {
    await local.runs.delete(id);
  } catch {}
  memory.delete(id);
  try {
    localStorage.removeItem(`pmforge.deadlock.transcript.v1:${ownerId}:${id}`);
  } catch {}
}
export function downloadRun(run: SavedRun) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(run, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `pmforge-deadlock-${run.id}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
