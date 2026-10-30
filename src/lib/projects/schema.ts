import { z } from "zod";
import { validProjectTrail } from "./engine";
const short = z.string().max(300),
  text = z.string().max(20000),
  state = z.record(short, z.number().finite().min(0).max(100));
const draft = z
  .object({
    choiceId: short,
    rationale: text,
    evidence: z.array(z.enum(["0", "1", "2"])).max(3),
    ranking: z.array(z.enum(["0", "1", "2"])).max(3),
  })
  .strict();
export const projectRunSchema = z
  .object({
    id: short,
    ownerId: short,
    projectId: short,
    version: z.literal(1),
    revision: z.number().int().nonnegative(),
    chapter: z.number().int().min(1).max(3),
    phase: z.enum(["entrance", "decision", "consequence", "debrief"]),
    status: z.enum(["active", "paused", "complete"]),
    state,
    flags: z.array(short).max(3),
    decisions: z
      .array(
        z
          .object({
            chapter: z.number().int().min(1).max(3),
            choiceId: short,
            label: text,
            before: state,
            after: state,
            delta: z.record(short, z.number().finite().min(-100).max(100)),
            reaction: text,
            kind: z.enum(["fracture", "dim", "surge", "recover", "fog"]),
            constraint: text,
            ruleIds: z.array(z.number().int().nonnegative()).max(10),
            rationale: text,
            evidence: z.array(z.enum(["0", "1", "2"])).max(3),
            ranking: z.array(z.enum(["0", "1", "2"])).max(3),
            at: z.iso.datetime(),
          })
          .strict(),
      )
      .max(3),
    draft,
    includeNotes: z.boolean(),
    entranceSeen: z.boolean(),
    startedAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().optional(),
    parentRunId: short.optional(),
    branchChapter: z.number().int().min(1).max(3).optional(),
  })
  .strict()
  .refine(
    validProjectTrail,
    "Project history does not match the authored state rules.",
  );
