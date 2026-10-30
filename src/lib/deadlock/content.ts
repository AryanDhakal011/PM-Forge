import { z } from "zod";
import projectJSON from "../../../content/projects/deadlock/project.json";
import boardJSON from "../../../content/projects/deadlock/board.json";
import objectsJSON from "../../../content/projects/deadlock/objects.json";
import datasetsJSON from "../../../content/projects/deadlock/datasets.json";
import linesJSON from "../../../content/projects/deadlock/lines.json";
import endingsJSON from "../../../content/projects/deadlock/endings.json";
import castJSON from "../../../content/projects/deadlock/cast.json";
import forgeJSON from "../../../content/projects/deadlock/forge.json";
import runJSON from "../../../content/projects/deadlock/run.json";
import debriefJSON from "../../../content/projects/deadlock/debrief.json";
import audioJSON from "../../../content/projects/deadlock/audio-manifest.json";
import experienceJSON from "../../../content/projects/deadlock/experience-v2.json";
import type { Evidence, Dataset, Lane, Resolution } from "./types";
const id = z.string().min(1);
export const project = z
  .object({
    id: z.literal("deadlock"),
    version: z.literal("1.0"),
    title: id,
    tagline: id,
    company: id,
    product: id,
    chapters: z.array(id).length(3),
    initial: z.object({
      rob: z.number(),
      sw: z.number(),
      runway: z.number(),
      ready: z.number(),
      align: z.number(),
      cred: z.number(),
      ap: z.number(),
      focus: z.number(),
    }),
    simulated: z.literal(true),
  })
  .parse(projectJSON);
export const objects = z
  .array(
    z.object({
      id: z.enum(["E1", "E2", "E3", "E4", "E5"]),
      zone: z.enum(["bay", "table", "pit"]),
      title: id,
      kind: id,
      label: id,
      card: id,
      reaction: z.array(id),
      slips: z.array(id).optional(),
      letter: z.array(id).optional(),
    }),
  )
  .length(5)
  .parse(objectsJSON);
export const datasets = z
  .array(
    z.object({
      id: z.enum(["D1", "D2", "D3", "D4"]),
      title: id,
      callout: id,
      bars: z.array(
        z.object({ label: id, value: z.number(), note: z.string().optional() }),
      ),
      unit: id,
      lines: z.array(id),
    }),
  )
  .length(4)
  .parse(datasetsJSON);
export const lines = z
  .array(
    z.object({
      id,
      speaker: id,
      text: id,
      condition: z.string().nullable(),
      source: id,
      audio: z.string().nullable(),
    }),
  )
  .parse([
    ...linesJSON,
    ...experienceJSON.lines.map((l) => ({
      ...l,
      condition: null,
      source: "corrected handoff v2",
      audio: null,
    })),
  ]);
export const experience = experienceJSON;
export const cast = z
  .array(z.object({ id, name: id, role: id, voice: id, color: id }))
  .parse(castJSON);
export const board = z
  .object({
    lanes: z
      .array(
        z.object({
          id: z.enum(["speed", "recovery", "learning"]),
          name: id,
          robotics: id,
          software: id,
          rWeeks: z.number(),
          sWeeks: z.number(),
        }),
      )
      .length(3),
    sockets: z.array(
      z.object({ id: z.enum(["R", "S", "B", "D"]), label: id, ap: z.number() }),
    ),
    foundation: id,
    matrix: z.record(
      z.string(),
      z.record(z.string(), z.array(z.enum(["R", "S", "B", "D"]))),
    ),
    effects: z.record(
      z.string(),
      z.object({
        rob: z.number(),
        sw: z.number(),
        ready: z.number(),
        align: z.number(),
        runway: z.number(),
        ap: z.number(),
      }),
    ),
    assumptions: z.array(z.object({ id, owner: id, text: id, brokenBy: id })),
  })
  .parse(boardJSON);
export const endings = z
  .array(z.object({ id, lines: z.array(id) }))
  .parse(endingsJSON);
export const forge = z
  .object({
    speed: z.array(
      z.object({ value: z.number(), label: id, weeks: z.number() }),
    ),
    recovery: z.array(z.object({ value: id, label: id, weeks: z.number() })),
    learning: z.array(z.object({ value: id, label: id, weeks: z.number() })),
  })
  .parse(forgeJSON);
export const runBeats = z
  .array(
    z.object({
      id: z.number(),
      title: id,
      caption: id,
      line: id,
      allowIntervention: z.boolean(),
    }),
  )
  .length(5)
  .parse(runJSON);
export const debrief = z
  .object({ copy: id, archetypes: z.record(z.string(), id) })
  .parse(debriefJSON);
export const audioManifest = z
  .object({
    version: id,
    status: id,
    model: z.string().nullable(),
    generatedAt: z.string().nullable(),
    lines: z.record(
      z.string(),
      z.object({
        file: z.string().nullable(),
        voice: z.string().nullable(),
        status: id,
        speaker: z.string().optional(),
        caption: z.string().optional(),
        expression: z.string().optional(),
        emotion: z.string().optional(),
        duration: z.number().optional(),
        envelope: z.array(z.number()).optional(),
      }),
    ),
    sfx: id,
  })
  .parse(audioJSON);
export const lanes: Lane[] = ["speed", "recovery", "learning"];
export const evidenceIds: Evidence[] = ["E1", "E2", "E3", "E4", "E5"];
export const datasetIds: Dataset[] = ["D1", "D2", "D3", "D4"];
export const resolutions: Resolution[] = ["R", "S", "B", "D"];
export function line(id: string, thing = "The requirement") {
  const found = lines.find((l) => l.id === id);
  if (!found) throw Error(`Unknown authored line: ${id}`);
  return {
    ...found,
    text:
      audioManifest.lines[id]?.caption || found.text.replace("{thing}", thing),
    expression:
      experienceJSON.lines.find((l) => l.id === id)?.expression || "neutral",
  };
}
