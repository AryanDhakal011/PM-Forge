"use client";
import Dexie, { type EntityTable } from "dexie";
import type {
  Bookmark,
  DecisionRecord,
  Profile,
  Run,
  Snapshot,
  WorkspaceExport,
} from "./types";
import { exportSchema } from "./schema";
import type { ProjectRun } from "../projects/types";

class WorkspaceDatabase extends Dexie {
  projectRuns!: EntityTable<ProjectRun, "id">;
  profiles!: EntityTable<Profile, "id">;
  runs!: EntityTable<Run, "id">;
  records!: EntityTable<DecisionRecord, "id">;
  bookmarks!: EntityTable<Bookmark, "id">;
  snapshots!: EntityTable<Snapshot, "id">;
  meta!: EntityTable<{ key: string; value: string }, "key">;
  constructor() {
    super("pmforge-workspace-v1");
    this.version(1).stores({
      profiles: "id",
      runs: "id,ownerId,updatedAt,questionId",
      records: "id,ownerId,updatedAt",
      bookmarks: "id,ownerId,questionId",
      snapshots: "++id,runId,ownerId,revision",
      meta: "key",
    });
    this.version(2).stores({ projectRuns: "id,ownerId,projectId,updatedAt" });
  }
}
export const db = new WorkspaceDatabase();
export const IDENTITY_KEY = "pmforge.product.identity";
export async function getLocalProfile() {
  const id = localStorage.getItem(IDENTITY_KEY);
  return id ? db.profiles.get(id) : undefined;
}
export async function startGuest() {
  const existing = await getLocalProfile();
  if (existing?.identity === "guest") return existing;
  const profile: Profile = {
    id: `guest-${crypto.randomUUID()}`,
    name: "",
    role: "Aspiring PM",
    level: "easy",
    timeline: "Exploring",
    onboardingComplete: false,
    identity: "guest",
    updatedAt: new Date().toISOString(),
  };
  await db.profiles.put(profile);
  localStorage.setItem(IDENTITY_KEY, profile.id);
  window.dispatchEvent(new Event("pmforge:identity"));
  return profile;
}
export class WriteConflict extends Error {
  constructor() {
    super(
      "This run changed in another tab. Load the latest saved version before continuing.",
    );
  }
}
export async function saveRun(
  run: Run,
  expectedRevision: number,
  lock = false,
) {
  return db.transaction("rw", db.runs, db.snapshots, db.meta, async () => {
    const existing = await db.runs.get(run.id);
    if (existing && existing.revision !== expectedRevision)
      throw new WriteConflict();
    const next = {
      ...run,
      revision: expectedRevision + 1,
      updatedAt: new Date().toISOString(),
    };
    await db.runs.put(next);
    if (lock) {
      await db.snapshots.add({
        runId: next.id,
        ownerId: next.ownerId,
        revision: next.revision,
        data: next,
        createdAt: next.updatedAt,
      });
      const snapshots = await db.snapshots
        .where("runId")
        .equals(next.id)
        .sortBy("revision");
      await db.snapshots.bulkDelete(snapshots.slice(0, -20).map((s) => s.id!));
    }
    await db.meta.put({
      key: `dirty:${next.ownerId}`,
      value: `${Date.now()}:${next.revision}`,
    });
    return next;
  });
}
export async function exportWorkspace(
  profile: Profile,
): Promise<WorkspaceExport> {
  const [runs, records, bookmarks, projectRuns] = await Promise.all([
    db.runs.where("ownerId").equals(profile.id).toArray(),
    db.records.where("ownerId").equals(profile.id).toArray(),
    db.bookmarks.where("ownerId").equals(profile.id).toArray(),
    db.projectRuns.where("ownerId").equals(profile.id).toArray(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    runs,
    records,
    bookmarks,
    projectRuns,
  };
}
export async function importWorkspace(
  raw: unknown,
  profile: Profile,
  queueSync = true,
) {
  const parsed = exportSchema.parse(raw);
  const aliases = new Map<string, string>();
  if (parsed.profile.id !== profile.id)
    await Promise.all(
      [...parsed.runs, ...parsed.records, ...(parsed.projectRuns || [])].map(
        async (item) => {
          const bytes = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(
              `${profile.id}:${parsed.profile.id}:${item.id}`,
            ),
          );
          aliases.set(
            item.id,
            `m-${Array.from(new Uint8Array(bytes))
              .map((byte) => byte.toString(16).padStart(2, "0"))
              .join("")
              .slice(0, 40)}`,
          );
        },
      ),
    );
  await db.transaction(
    "rw",
    [db.runs, db.records, db.bookmarks, db.profiles, db.meta, db.projectRuns],
    async () => {
      for (const incoming of parsed.projectRuns || []) {
        const id = aliases.get(incoming.id) || incoming.id;
        const current = await db.projectRuns.get(id);
        if (current && current.ownerId !== profile.id)
          throw new WriteConflict();
        if (
          current &&
          current.decisions.some(
            (d, i) =>
              incoming.decisions[i] &&
              incoming.decisions[i].choiceId !== d.choiceId,
          )
        )
          throw new WriteConflict();
        if (
          current &&
          current.revision === incoming.revision &&
          current.updatedAt !== incoming.updatedAt
        ) {
          const signature = (r: ProjectRun) =>
            JSON.stringify({
              phase: r.phase,
              status: r.status,
              chapter: r.chapter,
              draft: {
                ...r.draft,
                rationale: r.includeNotes ? r.draft.rationale : "",
              },
            });
          if (signature(current) !== signature(incoming))
            throw new WriteConflict();
        }
        if (current && current.revision >= incoming.revision) continue;
        if (
          !current ||
          (current.updatedAt < incoming.updatedAt &&
            current.decisions.length <= incoming.decisions.length)
        ) {
          const notes =
            current && !incoming.includeNotes
              ? {
                  draft: {
                    ...incoming.draft,
                    rationale: current.draft.rationale,
                  },
                  decisions: incoming.decisions.map((d, i) => ({
                    ...d,
                    rationale: current.decisions[i]?.rationale || d.rationale,
                  })),
                }
              : {};
          await db.projectRuns.put({
            ...incoming,
            ...notes,
            id,
            ownerId: profile.id,
            parentRunId: incoming.parentRunId
              ? aliases.get(incoming.parentRunId) || incoming.parentRunId
              : undefined,
          });
        }
      }
      for (const incoming of parsed.runs) {
        const id = aliases.get(incoming.id) || incoming.id;
        const current = await db.runs.get(id);
        if (
          !current ||
          (current.ownerId === profile.id &&
            current.updatedAt < incoming.updatedAt)
        )
          await db.runs.put({ ...incoming, id, ownerId: profile.id });
      }
      for (const incoming of parsed.records) {
        const id = aliases.get(incoming.id) || incoming.id;
        const current = await db.records.get(id);
        if (
          !current ||
          (current.ownerId === profile.id &&
            current.updatedAt < incoming.updatedAt)
        )
          await db.records.put({
            ...incoming,
            id,
            runId: incoming.runId
              ? aliases.get(incoming.runId) || incoming.runId
              : undefined,
            ownerId: profile.id,
          });
      }
      await db.bookmarks.bulkPut(
        parsed.bookmarks.map((b) => ({
          ...b,
          id: `${profile.id}:${b.questionId}`,
          ownerId: profile.id,
        })),
      );
      if (queueSync)
        await db.meta.put({
          key: `dirty:${profile.id}`,
          value: String(Date.now()),
        });
    },
  );
  return { runs: parsed.runs.length, records: parsed.records.length };
}
export async function clearLocalProfile(ownerId: string) {
  await db.transaction(
    "rw",
    [
      db.profiles,
      db.runs,
      db.records,
      db.bookmarks,
      db.snapshots,
      db.meta,
      db.projectRuns,
    ],
    async () => {
      await Promise.all([
        db.runs.where("ownerId").equals(ownerId).delete(),
        db.records.where("ownerId").equals(ownerId).delete(),
        db.bookmarks.where("ownerId").equals(ownerId).delete(),
        db.snapshots.where("ownerId").equals(ownerId).delete(),
        db.projectRuns.where("ownerId").equals(ownerId).delete(),
      ]);
      await db.profiles.delete(ownerId);
      await db.meta.delete(`dirty:${ownerId}`);
      await db.meta.where("key").startsWith(`activation:${ownerId}:`).delete();
      await db.meta.where("key").startsWith(`visual:${ownerId}:`).delete();
    },
  );
}
export async function markDirty(ownerId: string) {
  await db.meta.put({
    key: `dirty:${ownerId}`,
    value: `${Date.now()}:${Math.random()}`,
  });
}
export function downloadFile(
  filename: string,
  text: string,
  type = "text/plain",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const recordMarkdown = (record: DecisionRecord) =>
  `# ${record.title}\n\nSource: ${record.source}\n\n` +
  Object.entries(record.fields)
    .map(
      ([key, value]) =>
        `## ${key.replace(/([A-Z])/g, " $1")}\n\n${value || "—"}`,
    )
    .join("\n\n");
export const EMPTY_FIELDS = {
  problem: "",
  evidence: "",
  assumptions: "",
  options: "",
  tradeoffs: "",
  decision: "",
  metric: "",
  nextCheck: "",
};

export function readLandingCarry() {
  const read = (key: string) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  };
  const marker = read("pmf.carry");
  if (
    marker &&
    (!Number.isFinite(marker.ts) ||
      Date.now() - marker.ts > 24 * 60 * 60 * 1000)
  ) {
    localStorage.removeItem("pmf.carry");
    return { project: null, blueprint: null, interview: null, signal: null };
  }
  const project = read("pmforge.projects.v1");
  const blueprint = read("pmforge.blueprint.v1");
  const interview = read("pmforge.interview.v1");
  const signal = read("pmforge.signal.v1");
  return { project, blueprint, interview, signal };
}

/** Stage references, never duplicate or upload the preview answers. */
export function stageLandingCarry() {
  localStorage.removeItem("pmf.carry");
  const data = readLandingCarry();
  if (
    data.interview ||
    data.blueprint ||
    Object.values(data.project?.decisions || {}).some(Boolean)
  ) {
    localStorage.setItem(
      "pmf.carry",
      JSON.stringify({
        v: 1,
        ts: Date.now(),
        keys: [
          "pmforge.projects.v1",
          "pmforge.blueprint.v1",
          "pmforge.interview.v1",
        ],
      }),
    );
    window.dispatchEvent(new Event("pmforge:carry"));
  }
}
export function discardLandingCarry() {
  [
    "pmforge.projects.v1",
    "pmforge.blueprint.v1",
    "pmforge.interview.v1",
    "pmforge.signal.v1",
    "pmf.carry",
  ].forEach((key) => localStorage.removeItem(key));
}
export async function importLandingCarry(profile: Profile) {
  const data = readLandingCarry();
  const at = new Date().toISOString();
  let count = 0;
  const add = async (
    id: string,
    title: string,
    fields: typeof EMPTY_FIELDS,
  ) => {
    if (!(await db.records.get(id))) {
      await db.records.put({
        id,
        ownerId: profile.id,
        title,
        source: "Demo",
        fields,
        createdAt: at,
        updatedAt: at,
      });
      count++;
    }
  };
  const { projectScenarios, pressureChoices } = await import("@/lib/content");
  if (data.project?.decisions)
    for (const [scenarioId, value] of Object.entries(data.project.decisions))
      if (value) {
        const scenario = projectScenarios.find(
          (item) => item.id === scenarioId,
        );
        await add(
          `demo-project-${profile.id}-${scenarioId}`,
          `${scenario?.name || scenarioId} · landing decision`,
          {
            ...EMPTY_FIELDS,
            problem: scenario?.brief || "Landing-page project preview",
            evidence: scenario?.pressure.evidence.join("\n") || "",
            decision:
              pressureChoices.find((choice) => choice.id === value)?.label ||
              String(value),
          },
        );
      }
  if (data.blueprint) {
    const fields = data.blueprint.fields || data.blueprint;
    const selected = Object.fromEntries(
      Object.keys(EMPTY_FIELDS).map((key) => [
        key,
        typeof fields[key] === "string" ? fields[key].slice(0, 20000) : "",
      ]),
    ) as typeof EMPTY_FIELDS;
    if (Object.values(selected).some(Boolean))
      await add(
        `demo-blueprint-${profile.id}`,
        "My landing-page blueprint",
        selected,
      );
  }
  if (data.interview)
    await add(`demo-interview-${profile.id}`, "Landing interview rehearsal", {
      ...EMPTY_FIELDS,
      problem: "Demo rehearsal · excluded from official scenario coverage",
      decision: `Local demo rubric: ${data.interview.overall ?? "unscored"}/100. ${data.interview.band || ""}`,
      evidence:
        typeof data.interview.answer === "string"
          ? data.interview.answer
          : "This earlier demo saved a score, not its answer or audio.",
    });
  discardLandingCarry();
  await markDirty(profile.id);
  return count;
}
