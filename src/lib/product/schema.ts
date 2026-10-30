import { z } from "zod";
import { projectRunSchema } from "../projects/schema";
const text = z.string().max(20000);
const short = z.string().max(300);
const questionId = z
  .string()
  .regex(/^(EST|RCA|STR|EXE|AIT|BEH|PS)-[EMH]-[1-3]$/);
const date = z.iso.datetime();
const category = z.enum(["easy", "medium", "hard"]);
export const profileSchema = z
  .object({
    id: short,
    name: z.string().max(60),
    role: short,
    level: category,
    timeline: short,
    onboardingComplete: z.boolean(),
    identity: z.enum(["guest", "member"]),
    updatedAt: date,
  })
  .strict();
const stage = z.enum([
  "primer",
  "fundamentals",
  "clarify",
  "investigate",
  "workbench",
  "event",
  "synthesis",
  "feedback",
  "replay",
  "reflection",
  "expert",
  "complete",
]);
export const runSchema = z
  .object({
    id: short,
    ownerId: short,
    questionId,
    contentVersion: z.number().int().positive(),
    seed: z.number().int().min(0).max(2),
    revision: z.number().int().nonnegative(),
    stage,
    status: z.enum(["active", "paused", "complete"]),
    startedAt: date,
    updatedAt: date,
    completedAt: date.optional(),
    evidenceIds: z.array(short).max(30),
    decisions: z
      .array(z.object({ stage, action: short, value: text, at: date }).strict())
      .max(300),
    locked: z.array(short).max(20),
    objectivePinned: z.boolean(),
    choiceId: short,
    rank: z.array(text).max(12),
    segment: short,
    dials: z.record(short, z.number().finite()),
    unitConfirmed: z.boolean(),
    metrics: z
      .object({ primary: short, guardrail: short, test: short })
      .strict(),
    architecture: z.array(short).max(10),
    story: z
      .object({
        stakes: text,
        actions: z.array(text).max(10),
        result: text,
        learning: text,
        later: text,
        observable: z.boolean(),
        ownership: z.boolean(),
      })
      .strict(),
    eventResponse: short,
    synthesis: z
      .object({
        decision: short,
        evidenceId: short,
        tradeoff: short,
        notDoing: short,
        metric: short,
        guardrail: short,
        stopRule: short,
        note: text,
      })
      .strict(),
    reflection: z.record(short, z.number().int().min(1).max(4)),
    reflectionNote: text,
    fundamentals: z.record(short, short),
    pausedFrom: stage.optional(),
    elapsedSeconds: z.number().finite().min(0),
    pressureSeconds: z.number().finite().min(0).nullable(),
    eventIndex: z.number().int().min(0).max(3),
    guided: z.boolean().optional(),
    sessionId: short.optional(),
    reflectionStartedAt: date.optional(),
    reflectionCompletedAt: date.optional(),
    reflectionTimedOut: z.boolean().optional(),
    spoken: z
      .object({
        seconds: z.number().int().min(0).max(90),
        structure: z.boolean(),
        clarity: z.boolean(),
        skipped: z.boolean(),
      })
      .strict()
      .optional(),
  })
  .strict();
export const recordFieldsSchema = z
  .object({
    problem: text,
    evidence: text,
    assumptions: text,
    options: text,
    tradeoffs: text,
    decision: text,
    metric: text,
    nextCheck: text,
  })
  .strict();
export const recordSchema = z
  .object({
    id: short,
    ownerId: short,
    title: z.string().max(140),
    source: z.enum(["run", "manual", "Demo"]),
    runId: short.optional(),
    fields: recordFieldsSchema,
    createdAt: date,
    updatedAt: date,
  })
  .strict();
export const bookmarkSchema = z
  .object({ id: short, ownerId: short, questionId: short, updatedAt: date })
  .strict();
export const exportSchema = z
  .object({
    version: z.literal(1),
    exportedAt: date,
    profile: profileSchema,
    runs: z.array(runSchema).max(1000),
    records: z.array(recordSchema).max(1000),
    bookmarks: z.array(bookmarkSchema).max(200),
    projectRuns: z.array(projectRunSchema).max(200).optional(),
  })
  .strict();
