"use client";
import Dexie, { type EntityTable } from "dexie";
import { z } from "zod";
import { replay, type Event } from "./engine";
export type Run = {
  version: 1;
  id: string;
  ownerId: string;
  events: Event[];
  revision: number;
  updatedAt: string;
  parentId?: string;
  forkAt?: number;
  note: string;
};
const schema = z.object({
  version: z.literal(1),
  id: z.string().uuid(),
  ownerId: z.string().min(1),
  events: z
    .array(
      z.object({
        action: z.object({ type: z.string() }).passthrough(),
        at: z.string().datetime(),
      }),
    )
    .max(1000),
  revision: z.number().int().min(0),
  updatedAt: z.string().datetime(),
  parentId: z.string().uuid().optional(),
  forkAt: z.number().int().min(0).optional(),
  note: z.string().max(1000),
});
const local = new Dexie("pmforge-ghost-metric-v1") as Dexie & {
  runs: EntityTable<Run, "id">;
};
local.version(1).stores({ runs: "id,ownerId,parentId,updatedAt" });
export function createRun(ownerId: string): Run {
  return {
    version: 1,
    id: crypto.randomUUID(),
    ownerId,
    events: [],
    revision: 0,
    updatedAt: new Date().toISOString(),
    note: "",
  };
}
export function validateRun(value: unknown) {
  const r = schema.parse(value) as Run;
  if (r.revision !== r.events.length)
    throw Error("The revision does not match the decision log.");
  replay(r.events);
  return r;
}
export async function listRuns(ownerId: string) {
  return (
    await local.runs.where("ownerId").equals(ownerId).sortBy("updatedAt")
  ).reverse();
}
export async function loadRun(id: string, ownerId: string) {
  const r = await local.runs.get(id);
  return r?.ownerId === ownerId ? validateRun(r) : null;
}
export async function saveRun(r: Run, expected?: number) {
  validateRun(r);
  await local.transaction("rw", local.runs, async () => {
    const old = await local.runs.get(r.id);
    if (old && (old.ownerId !== r.ownerId || old.revision !== expected))
      throw Error("This run changed in another tab. Reload before continuing.");
    if (
      old &&
      JSON.stringify(old.events) !==
        JSON.stringify(r.events.slice(0, old.events.length))
    )
      throw Error("Keep the original log. Replay into a new branch instead.");
    await local.runs.put(r);
  });
}
export function branchRun(run: Run, index: number): Run {
  if (!Number.isInteger(index) || index < 0 || index >= run.events.length)
    throw Error("Choose a recorded decision.");
  return {
    ...createRun(run.ownerId),
    parentId: run.id,
    forkAt: index,
    events: structuredClone(run.events.slice(0, index)),
    revision: index,
  };
}
export function exportRun(run: Run) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(run, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `pmforge-ghost-metric-${run.id}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
