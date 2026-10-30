"use client";
import { db, WriteConflict } from "../product/db";
import { projectRunSchema } from "./schema";
import type { ProjectRun } from "./types";
export async function saveProjectRun(
  run: ProjectRun,
  expectedRevision = run.revision,
) {
  const candidate = projectRunSchema.parse(run);
  return db.transaction("rw", db.projectRuns, db.meta, async () => {
    const existing = await db.projectRuns.get(run.id);
    if (
      existing &&
      (existing.ownerId !== run.ownerId ||
        existing.revision !== expectedRevision)
    )
      throw new WriteConflict();
    if (
      existing &&
      existing.decisions.some(
        (d, i) =>
          !candidate.decisions[i] ||
          candidate.decisions[i].choiceId !== d.choiceId,
      )
    )
      throw new WriteConflict();
    const next = {
      ...candidate,
      revision: expectedRevision + 1,
      updatedAt: new Date().toISOString(),
    };
    await db.projectRuns.put(next);
    await db.meta.put({
      key: `dirty:${run.ownerId}`,
      value: `${Date.now()}:${next.revision}:project`,
    });
    return next;
  });
}
export const projectSyncCopy = (run: ProjectRun): ProjectRun =>
  run.includeNotes
    ? run
    : {
        ...run,
        draft: { ...run.draft, rationale: "" },
        decisions: run.decisions.map((d) => ({ ...d, rationale: "" })),
      };
