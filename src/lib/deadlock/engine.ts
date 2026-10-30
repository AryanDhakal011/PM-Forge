import { z } from "zod";
import {
  board,
  project,
  lanes,
  resolutions,
  evidenceIds,
  datasetIds,
} from "./content";
import type {
  Action,
  Archetype,
  Badges,
  Dataset,
  DeadlockEvent,
  DeadlockState,
  Dial,
  Ending,
  Evidence,
  Lane,
  LaneChoice,
  Metrics,
  Resolution,
  Room,
  SavedRun,
  Trace,
} from "./types";
const laneSchema = z.enum(["speed", "recovery", "learning"]),
  evSchema = z.enum(["E1", "E2", "E3", "E4", "E5"]),
  dsSchema = z.enum(["D1", "D2", "D3", "D4"]);
export const dialSchema = z.object({
  s: z.union([z.literal(0.5), z.literal(0.8), z.literal(1), z.literal(1.2)]),
  r: z.enum(["manual", "assisted", "auto"]),
  l: z.enum(["always", "uncertain", "never"]),
});
export const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("START"),
    mode: z.enum(["sound", "silent", "listen"]),
  }),
  z.object({
    type: z.literal("ACK_SCENE"),
    scene: z.enum([
      "entry",
      "intro",
      "floor",
      "table",
      "consequence1",
      "opening2",
      "data",
      "forge",
      "consequence2",
      "run",
      "ending",
      "debrief",
    ]),
  }),
  z.object({ type: z.literal("INSPECT"), card: evSchema }),
  z.object({
    type: z.literal("SOCKET"),
    lane: laneSchema,
    res: z.enum(["R", "S", "B", "D"]),
    previewMs: z.number().min(0).max(3600000),
  }),
  z.object({ type: z.literal("BEGIN_INSPECT"), card: evSchema }),
  z.object({
    type: z.literal("ATTACH"),
    lane: laneSchema,
    card: evSchema.optional(),
  }),
  z.object({ type: z.literal("LOCK_PLAN") }),
  z.object({
    type: z.literal("SHOW"),
    dataset: dsSchema,
    previewMs: z.number().min(0).max(3600000),
  }),
  z.object({ type: z.literal("CALL_DEV") }),
  z.object({ type: z.literal("REMOVE_VETO"), side: z.enum(["R", "S"]) }),
  z.object({ type: z.literal("DIAL"), value: dialSchema }),
  z.object({
    type: z.literal("ATTACH_DIAL"),
    dial: laneSchema,
    card: z.union([evSchema, dsSchema]).optional(),
  }),
  z.object({
    type: z.literal("PROPOSE"),
    previewMs: z.number().min(0).max(3600000),
  }),
  z.object({ type: z.literal("PUSH") }),
  z.object({ type: z.literal("REVISE") }),
  z.object({
    type: z.literal("RUN_DECISION"),
    eventNo: z.number().int().min(1).max(5),
    action: z.enum(["let", "pause", "slow", "takeover"]),
  }),
]);
export const eventSchema = z.intersection(
  actionSchema,
  z.object({ seq: z.number().int().nonnegative(), t: z.string().datetime() }),
);
export const savedRunSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().min(1),
  contentVersion: z.literal("1.0"),
  events: z.array(eventSchema).max(5000),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  parentId: z.string().uuid().optional(),
  forkSeq: z.number().int().nonnegative().optional(),
  note: z.string().max(500).optional(),
  revision: z.number().int().nonnegative(),
  echoes: z
    .array(z.object({ seq: z.number(), assumption: z.string() }))
    .max(3)
    .optional(),
});
export const metricKeys = [
  "rob",
  "sw",
  "runway",
  "ready",
  "align",
  "cred",
  "ap",
] as const;
export const metrics = (s: Metrics): Metrics =>
  Object.fromEntries(metricKeys.map((k) => [k, s[k]])) as Metrics;
export const ledgerKeys = [
  ...metricKeys,
  "wow",
  "supervision",
  "incidents",
  "tokens",
] as const;
const ledger = (s: DeadlockState) => ({
  ...metrics(s),
  wow: s.run.wow,
  supervision: s.run.supervision,
  incidents: s.run.incidents,
  tokens: s.run.tokens,
});
const round = (n: number) => Math.floor(n + 0.5);
function normalize(s: DeadlockState) {
  for (const k of ["rob", "sw", "ready", "align", "cred"] as const)
    s[k] = Math.max(0, Math.min(100, round(s[k])));
  s.runway = Math.max(0, round(s.runway));
  s.ap = Math.max(0, round(s.ap));
  s.flags = [...new Set(s.flags)];
  return s;
}
const requireRule = (condition: unknown, message: string) => {
  if (!condition) throw Error(message);
};
export const has = (s: DeadlockState, f: string) => s.flags.includes(f);
const flag = (s: DeadlockState, f: string) => {
  if (!has(s, f)) s.flags.push(f);
};
export const count = (s: DeadlockState, r: Resolution) =>
  lanes.filter((l) => s.lanes[l].res === r).length;
export function initialState(): DeadlockState {
  return {
    ...project.initial,
    scene: "entry",
    inspected: [],
    lanes: { speed: {}, recovery: {}, learning: {} },
    room: "MIXED",
    shown: [],
    dials: { s: 0.5, r: "manual", l: "always" },
    defenses: {},
    proposals: 0,
    flags: [],
    run: {
      wow: 40,
      supervision: 0,
      incidents: 0,
      tokens: 3,
      eventNo: 1,
      interventions: 0,
      log: [],
    },
    seq: 0,
    trace: [],
  };
}
export function evidenceRelation(
  card: Evidence | undefined,
  lane: Lane,
  res: Resolution,
): "SUPPORT" | "CONTRADICT" | "NEUTRAL" | "NONE" {
  if (!card) return "NONE";
  const supports = board.matrix[card][lane];
  if (supports.includes(res)) return "SUPPORT";
  if (
    (res === "R" && supports.includes("S")) ||
    (res === "S" && supports.includes("R"))
  )
    return "CONTRADICT";
  return "NEUTRAL";
}
export function roomFor(choices: Record<Lane, LaneChoice>): Room {
  const n = (r: Resolution) => lanes.filter((l) => choices[l].res === r).length;
  return n("B") >= 2
    ? "ALIGNED_BURN"
    : n("R") >= 2
      ? "ROBOTICS_WIN"
      : n("S") >= 2
        ? "SOFTWARE_WIN"
        : n("D") >= 2
          ? "STALLED"
          : "MIXED";
}
export function bothHeard(s: DeadlockState) {
  return (
    (s.inspected.includes("E1") && s.inspected.includes("E2")) ||
    ((s.inspected.includes("E3") || s.inspected.includes("E5")) &&
      (s.inspected.includes("E1") || s.inspected.includes("E2")))
  );
}
export function tableState(
  choices: Record<Lane, LaneChoice>,
): Metrics & { flags: string[] } {
  const s: Metrics & { flags: string[] } = {
    ...metrics(project.initial),
    flags: [],
  };
  for (const lane of lanes) {
    const c = choices[lane];
    if (!c.res) continue;
    const effect = { ...board.effects[c.res] };
    const relation = evidenceRelation(c.evidence, lane, c.res);
    const loser = c.res === "R" ? "sw" : c.res === "S" ? "rob" : null;
    if (relation === "SUPPORT") {
      if (loser) effect[loser] = Math.floor(effect[loser] / 2);
      s.cred += 4;
    } else if (relation === "CONTRADICT") {
      if (loser) effect[loser] = Math.ceil(effect[loser] * 1.5);
      s.cred -= 8;
      s.flags.push(`contradicted_${lane}`);
    } else if (relation === "NEUTRAL") {
      s.cred -= 1;
      s.flags.push(`weakLink_${lane}`);
    } else {
      s.cred -= 2;
      s.flags.push(`unsupported_${lane}`);
    }
    for (const k of ["rob", "sw", "ready", "align", "runway", "ap"] as const)
      s[k] += effect[k];
    s.flags.push(
      `${c.res === "R" ? "winR" : c.res === "S" ? "winS" : c.res === "B" ? "bridge" : "defer"}_${lane}`,
    );
    for (const k of ["rob", "sw", "ready", "align", "cred"] as const)
      s[k] = Math.max(0, Math.min(100, round(s[k])));
  }
  requireRule(s.ap >= 0, "Needs 2 AP. Undo another bridge first.");
  return s;
}
export function previewSocket(s: DeadlockState, lane: Lane, res: Resolution) {
  const choices = { ...s.lanes, [lane]: { ...s.lanes[lane], res } };
  return tableState(choices);
}
export function forgeCost(d: Dial) {
  return (
    (d.s >= 1 ? 1 : 0) +
    { manual: 0, assisted: 1, auto: 2 }[d.r] +
    { always: 0, uncertain: 1, never: -1 }[d.l]
  );
}
export function acceptance(s: DeadlockState) {
  const d = s.dials,
    absent = has(s, "dev_absent") && !has(s, "dev_recalled");
  const r =
    d.s < 0.8
      ? "F-REJ-DEV-1"
      : d.r === "manual"
        ? "F-REJ-DEV-2"
        : d.l === "always"
          ? "F-REJ-DEV-3"
          : null;
  const w = !(d.s <= 0.8 || (d.s === 1 && s.shown.includes("D3")))
    ? "F-REJ-INES-1"
    : d.r === "auto" && !has(s, "bridge_recovery") && !s.shown.includes("D4")
      ? "F-REJ-INES-2"
      : d.l === "never"
        ? "F-REJ-INES-4"
        : d.l === "uncertain" && !s.shown.includes("D2")
          ? "F-REJ-INES-3"
          : null;
  return {
    robotics: absent ? null : !r,
    software: !w,
    reasons: [...(r && !absent ? [r] : []), ...(w ? [w] : [])],
  };
}
export function knownFacts(s: DeadlockState, lane: Lane) {
  const d = s.dials;
  if (lane === "speed")
    return {
      primary: s.shown.includes("D1")
        ? `${{ "0.5": 94, "0.8": 96, "1": 98, "1.2": 100 }[String(d.s) as "1"]}% throughput`
        : "? throughput",
      secondary: s.shown.includes("D3")
        ? d.s === 0.5
          ? "0.10 m stopping distance"
          : d.s === 1
            ? "0.22 m · curtain"
            : d.s === 1.2
              ? "0.46 m · FAIL"
              : "? · 0.8 m/s was not tested"
        : "? stopping distance",
    };
  if (lane === "recovery")
    return {
      primary: s.shown.includes("D4")
        ? d.r === "manual"
          ? "Manual clear"
          : d.r === "assisted"
            ? "88% · 9 s"
            : "93% cleared"
        : "? clear rate",
      secondary: s.shown.includes("D4")
        ? d.r === "auto"
          ? "0 unexpected with interlock; 2/30 without"
          : "0 unexpected moves"
        : "? unexpected moves",
    };
  return {
    primary: s.shown.includes("D2")
      ? `${{ always: 96, uncertain: 94, never: 81 }[d.l]}% accuracy`
      : "? accuracy",
    secondary: s.shown.includes("D2")
      ? `${{ always: 31, uncertain: 9, never: 0 }[d.l]}% prompts`
      : "? prompts",
  };
}
export function riskAt(s: DeadlockState, eventNo: number) {
  return eventNo === 2
    ? s.dials.s === 1.2 ||
        (s.dials.s === 1 && !s.shown.includes("D3") && !has(s, "bridge_speed"))
    : eventNo === 3
      ? s.dials.r === "auto" &&
        !has(s, "bridge_recovery") &&
        !s.shown.includes("D4")
      : eventNo === 4
        ? s.dials.l === "never"
        : false;
}
export function endingFor(s: DeadlockState): Ending {
  if (s.ready < 60 || s.runway < 2) return "QUIET ROOM";
  if (s.run.incidents) return "FRACTURE";
  if (
    s.run.wow >= 75 &&
    s.run.supervision <= 2 &&
    s.cred >= 55 &&
    s.rob <= 45 &&
    s.sw <= 45 &&
    !has(s, "pushed") &&
    !has(s, "imposed") &&
    has(s, "golden_cue")
  )
    return "SHARED GROUND";
  if (s.run.wow >= 65 && s.run.supervision >= 3) return "STANDING GUARD";
  if (s.run.wow < 65 && s.run.supervision >= 3) return "BABYSITTER";
  return "STEADY HANDS";
}
export function archetypeFor(s: DeadlockState): Archetype {
  const e = s.ending || endingFor(s),
    success = ["SHARED GROUND", "STEADY HANDS", "STANDING GUARD"].includes(e);
  if (
    count(s, "B") >= 2 &&
    s.shown.includes("D2") &&
    has(s, "agreed") &&
    success
  )
    return "MEDIATOR";
  if (count(s, "R") + count(s, "S") >= 2 && success) return "DECIDER";
  if ((s.dials.s === 1.2 || s.dials.r === "auto") && e === "STANDING GUARD")
    return "SHOWRUNNER";
  if (e === "FRACTURE") return "GAMBLER";
  if (["QUIET ROOM", "BABYSITTER"].includes(e) || count(s, "D") >= 2)
    return "BYSTANDER";
  return "PRAGMATIST";
}
function finishForge(
  s: DeadlockState,
  outcome: "agreed" | "pushed" | "imposed",
) {
  flag(s, outcome);
  if (outcome === "agreed") {
    s.align += 12;
    s.rob -= 8;
    s.sw -= 8;
    s.cred += 6;
  }
  if (outcome === "pushed") {
    if (s.proposal?.robotics === false) s.rob += 10;
    if (!s.proposal?.software) s.sw += 10;
    s.align -= 6;
    s.cred -= 6;
    s.ap -= 2;
  }
  if (outcome === "imposed") {
    s.dials = { s: 0.5, r: "manual", l: "always" };
    s.align -= 8;
    s.rob += 6;
    s.sw += 6;
    s.cred -= 10;
  }
  if (has(s, "dev_absent") && !has(s, "dev_recalled")) s.rob += 6;
  for (const lane of lanes) {
    const card = s.defenses[lane];
    const relevant =
      card &&
      s.shown.includes(card as Dataset) &&
      (lane === "speed"
        ? ["D1", "D3"]
        : lane === "recovery"
          ? ["D4"]
          : ["D2"]
      ).includes(card);
    s.cred += relevant ? 3 : card ? -1 : -2;
  }
  s.ready +=
    10 +
    { "0.5": 0, "0.8": 2, "1": 4, "1.2": 5 }[String(s.dials.s) as "1"] +
    { manual: 0, assisted: 4, auto: 8 }[s.dials.r] +
    { always: 0, uncertain: 4, never: 2 }[s.dials.l];
  s.runway -= forgeCost(s.dials);
  normalize(s);
  if (
    has(s, "shared_blind_spot") &&
    outcome === "agreed" &&
    s.rob <= 45 &&
    s.sw <= 45
  )
    flag(s, "golden_cue");
  s.scene = "consequence2";
}
const blankBadges = (): Badges => ({
  evidence: null,
  tradeoff: null,
  heard: null,
  adapted: null,
});
const assumptionId = (lane: Lane, res: Resolution | undefined) =>
  res === "R"
    ? { speed: "AR1", recovery: "AR3", learning: "AR2" }[lane]
    : res === "S"
      ? { speed: "AS1", recovery: "AS2", learning: "AS3" }[lane]
      : undefined;
export function reduceEvent(
  previous: DeadlockState,
  event: DeadlockEvent,
): DeadlockState {
  eventSchema.parse(event);
  requireRule(
    event.seq === previous.seq,
    "The event sequence changed. Reload the saved run.",
  );
  const s = structuredClone(previous),
    before = ledger(s);
  const e = event;
  let title = "",
    why = "",
    constraint = "",
    assumption: string | undefined;
  let badges = blankBadges();
  const at = (...scenes: DeadlockState["scene"][]) =>
    requireRule(
      scenes.includes(s.scene),
      "This control is not available in the current scene.",
    );
  switch (e.type) {
    case "START":
      at("entry");
      s.scene = "intro";
      break;
    case "ACK_SCENE": {
      requireRule(e.scene === s.scene, "This scene has already moved on.");
      const next: Partial<
        Record<DeadlockState["scene"], DeadlockState["scene"]>
      > = {
        intro: "floor",
        floor: "table",
        consequence1: "opening2",
        opening2: "data",
        data: "forge",
        consequence2: "run",
        ending: "debrief",
      };
      requireRule(
        next[s.scene],
        "Finish the decision before leaving this scene.",
      );
      s.scene = next[s.scene]!;
      if (e.scene === "data") {
        const heard =
          s.shown.some((d) => ["D1", "D2", "D4"].includes(d)) &&
          s.shown.some((d) => ["D2", "D3", "D4"].includes(d));
        for (const trace of s.trace)
          if (trace.cause.startsWith("player:SHOW:"))
            trace.badges.heard = heard;
        if (has(s, "dev_absent") && !has(s, "dev_recalled")) {
          s.dials.r = "manual";
          s.dials.l = "always";
        }
        if (has(s, "veto_R")) s.dials.r = "auto";
        if (has(s, "veto_S")) s.dials.s = 0.5;
      }
      if (e.scene === "consequence2" && (s.ready < 60 || s.runway < 2)) {
        s.ending = "QUIET ROOM";
        s.archetype = archetypeFor(s);
        s.runway = Math.max(0, s.runway - 4);
        s.scene = "ending";
        title = "Demo postponed · Quiet Room";
        why =
          "The unready build postpones the demo. Four more weeks of runway are spent.";
        constraint =
          "The trace points back to the decisions that reduced readiness.";
      }
      break;
    }
    case "BEGIN_INSPECT":
      at("floor");
      requireRule(!s.inspected.includes(e.card), "Already in the Case file.");
      if (s.inspecting === e.card) break;
      requireRule(!s.inspecting, "Finish the object you already opened.");
      requireRule(s.focus > 0, "All three Focus bolts have been spent.");
      s.focus--;
      s.inspecting = e.card;
      break;
    case "INSPECT":
      at("floor");
      requireRule(
        !s.inspected.includes(e.card),
        "This evidence is already in the Case file.",
      );
      if (s.inspecting !== e.card) {
        requireRule(
          !s.inspecting && s.focus > 0,
          "All three Focus bolts have been spent.",
        );
        s.focus--;
      }
      s.inspected.push(e.card);
      s.inspecting = undefined;
      break;
    case "SOCKET":
    case "ATTACH": {
      at("table");
      if (e.type === "SOCKET") {
        s.lanes[e.lane].res = e.res;
        s.lanes[e.lane].previewMs = e.previewMs;
      } else {
        requireRule(
          !e.card || s.inspected.includes(e.card),
          "Only inspected evidence can be attached.",
        );
        s.lanes[e.lane].evidence = e.card;
      }
      Object.assign(s, tableState(s.lanes));
      const c = s.lanes[e.lane];
      title = `${e.lane.toUpperCase()} → ${c.res || "evidence clamp"}${c.evidence ? ` · ${c.evidence}` : ""}`;
      assumption = assumptionId(e.lane, c.res);
      const relation = c.res
        ? evidenceRelation(c.evidence, e.lane, c.res)
        : "NONE";
      why = `${relation} · ${c.res ? board.sockets.find((x) => x.id === c.res)?.label : "Evidence attached before resolution"}`;
      constraint =
        c.res === "B"
          ? "Two AP and one week committed to a shared requirement."
          : c.res === "R"
            ? "Software carries the disagreement into the next room."
            : c.res === "S"
              ? "Robotics carries the disagreement into the next room."
              : "The unresolved requirement lowers readiness.";
      badges = {
        evidence: relation === "SUPPORT",
        tradeoff: (c.previewMs || 0) >= 800,
        heard: bothHeard(s),
        adapted: null,
      };
      break;
    }
    case "LOCK_PLAN":
      at("table");
      requireRule(
        lanes.every((l) => s.lanes[l].res),
        "Resolve all three lanes before locking the plan.",
      );
      s.room = roomFor(s.lanes);
      s.ap = 4 + Math.min(2, s.ap) - (s.room === "STALLED" ? 1 : 0);
      if (s.room === "STALLED") s.runway -= 2;
      s.scene = "consequence1";
      title = `Plan locked · ${s.room}`;
      why =
        "Chapter 1 room precedence: bridges, Robotics wins, Software wins, defers, mixed.";
      constraint =
        s.room === "ROBOTICS_WIN"
          ? "Nadia watches the first two datasets for override evidence."
          : s.room === "SOFTWARE_WIN"
            ? "Dev walks out unless the first slide is D1 or D2."
            : s.room === "STALLED"
              ? "Finance removes two weeks and one meeting AP."
              : "The next meeting inherits this room.";
      break;
    case "SHOW": {
      at("data");
      if (s.shown.includes(e.dataset)) break;
      const cost = s.inspected.includes("E4") && s.shown.length === 0 ? 0 : 1;
      requireRule(
        s.ap >= cost,
        "No alignment points remain for another folder.",
      );
      s.ap -= cost;
      s.shown.push(e.dataset);
      flag(s, `shown_${e.dataset}`);
      const h = s.inspected.includes("E3") ? 0.5 : 1;
      if (e.dataset === "D1") {
        s.rob += 6 * h;
        s.align -= 3 * h;
      }
      if (e.dataset === "D2") {
        s.rob += 4 * h;
        s.sw += 4 * h;
        s.align += 8;
        flag(s, "shared_blind_spot");
      }
      if (e.dataset === "D3") {
        s.sw += 3 * h - 3;
        s.align -= 3 * h;
      }
      if (e.dataset === "D4") {
        s.rob += 4 * h;
        s.sw += 4 * h - 3;
        s.align -= 2;
      }
      if (
        s.room === "SOFTWARE_WIN" &&
        s.shown.length === 1 &&
        !(["D1", "D2"] as Dataset[]).includes(e.dataset)
      )
        flag(s, "dev_absent");
      if (
        s.room === "ROBOTICS_WIN" &&
        s.shown.length === 2 &&
        !s.shown.slice(0, 2).some((d) => d === "D3" || d === "D4")
      )
        flag(s, "auditor_flag");
      const exR = s.shown.filter((x) => ["D1", "D2", "D4"].includes(x)).length,
        exS = s.shown.filter((x) => ["D2", "D3", "D4"].includes(x)).length;
      if (exR - exS >= 2 && !has(s, "veto_removed_R")) flag(s, "veto_R");
      if (exS - exR >= 2 && !has(s, "veto_removed_S")) flag(s, "veto_S");
      title = `Both teams saw ${e.dataset}`;
      why = `${cost} AP. ${s.inspected.includes("E3") ? "E3 halves exposure penalties." : "Assumptions exposed in public."}`;
      constraint = has(s, "auditor_flag")
        ? "Nadia recorded no override evidence in the first two slides."
        : has(s, "dev_absent")
          ? "Dev left. Recall costs 2 AP."
          : "The projected data becomes known on the Forge and run readouts.";
      badges = {
        evidence: board.assumptions.some(
          (a) =>
            a.brokenBy === e.dataset &&
            !previous.shown.includes(a.brokenBy as Dataset),
        ),
        tradeoff: e.previewMs >= 800,
        heard: exR > 0 && exS > 0,
        adapted: null,
      };
      break;
    }
    case "CALL_DEV":
      at("data", "forge");
      requireRule(
        has(s, "dev_absent") && !has(s, "dev_recalled"),
        "Dev is already in the room.",
      );
      requireRule(s.ap >= 2, "Calling Dev back costs 2 AP.");
      s.ap -= 2;
      s.rob -= 8;
      flag(s, "dev_recalled");
      title = "Called Dev back";
      why = "2 AP buys his return; Robotics resentment falls by 8.";
      break;
    case "REMOVE_VETO":
      at("forge");
      requireRule(
        has(s, `veto_${e.side}`) && s.ap >= 1,
        "No removable veto or no AP.",
      );
      s.ap--;
      s.flags = s.flags.filter((x) => x !== `veto_${e.side}`);
      flag(s, `veto_removed_${e.side}`);
      break;
    case "DIAL":
      at("forge");
      requireRule(
        !s.proposal,
        "Revise the rejected proposal before changing the dials.",
      );
      if (has(s, "dev_absent") && !has(s, "dev_recalled"))
        requireRule(
          e.value.r === "manual" && e.value.l === "always",
          "Recall Dev to unlock recovery and learning.",
        );
      if (has(s, "veto_R"))
        requireRule(
          e.value.r === "auto",
          "Robotics veto: recovery stays auto.",
        );
      if (has(s, "veto_S"))
        requireRule(e.value.s === 0.5, "Software veto: speed stays at 0.5.");
      s.dials = { ...e.value };
      break;
    case "ATTACH_DIAL":
      at("forge");
      requireRule(!s.proposal, "Revise before changing the defense clamps.");
      requireRule(
        !e.card ||
          s.inspected.includes(e.card as Evidence) ||
          s.shown.includes(e.card as Dataset),
        "Only opened evidence is available.",
      );
      s.defenses[e.dial] = e.card;
      break;
    case "PROPOSE": {
      at("forge");
      requireRule(
        !s.proposal && s.proposals < 2,
        "Revise or resolve the existing proposal.",
      );
      requireRule(
        s.runway - forgeCost(s.dials) >= 2,
        "Reserve two weeks for the run.",
      );
      s.proposals++;
      s.proposal = { ...acceptance(s), previewMs: e.previewMs };
      title = `Proposal ${s.proposals} · ${s.dials.s} / ${s.dials.r} / ${s.dials.l}`;
      why = s.proposal.reasons.length
        ? s.proposal.reasons.join(" · ")
        : "Both present leads accepted the build.";
      const relevant = lanes.every((l) => {
        const c = s.defenses[l];
        return (
          !!c &&
          s.shown.includes(c as Dataset) &&
          (l === "speed"
            ? ["D1", "D3"]
            : l === "recovery"
              ? ["D4"]
              : ["D2"]
          ).includes(c)
        );
      });
      badges = {
        evidence: relevant,
        tradeoff: e.previewMs >= 800,
        heard: s.proposal.robotics === true && s.proposal.software,
        adapted: has(s, "revised") ? true : null,
      };
      if (s.proposal.robotics !== false && s.proposal.software)
        finishForge(s, "agreed");
      constraint =
        s.scene === "consequence2"
          ? "The committed build sets readiness and reserves runway."
          : "Revise for free or spend 2 AP to push through one rejection.";
      break;
    }
    case "PUSH":
      at("forge");
      {
        const proposalTrace = s.trace.findLast((t) =>
          t.title.startsWith("Proposal "),
        );
        if (proposalTrace) proposalTrace.badges.adapted = false;
      }
      requireRule(
        s.proposal &&
          Number(s.proposal.robotics === false) +
            Number(!s.proposal.software) ===
            1 &&
          s.ap >= 2,
        "Push needs exactly one rejection and 2 AP.",
      );
      finishForge(s, "pushed");
      title = "Pushed through";
      why =
        "Rejecting side +10 resentment; alignment −6; credibility −6; 2 AP.";
      constraint = "The walk-in loses 3 Wow.";
      break;
    case "REVISE":
      at("forge");
      {
        const proposalTrace = s.trace.findLast((t) =>
          t.title.startsWith("Proposal "),
        );
        if (proposalTrace) proposalTrace.badges.adapted = true;
      }
      requireRule(s.proposal, "There is no rejected proposal to revise.");
      flag(s, "revised");
      if (s.proposals >= 2) {
        finishForge(s, "imposed");
        title = "Mara imposed the lean build";
        why =
          "Two proposals were exhausted. Speed 0.5, manual recovery, always confirm.";
        constraint =
          "Readiness inherits the lean build; the walk-in loses 4 Wow.";
      } else s.proposal = undefined;
      break;
    case "RUN_DECISION": {
      at("run");
      requireRule(
        e.eventNo === s.run.eventNo,
        "The run has moved to another event.",
      );
      requireRule(
        e.action === "let" ||
          ([2, 3, 4].includes(e.eventNo) && s.run.tokens > 0),
        "No intervention is available for this event.",
      );
      const intervene = e.action !== "let",
        risk = riskAt(s, e.eventNo);
      if (intervene) {
        s.run.tokens--;
        s.run.interventions++;
        s.run.supervision++;
        s.run.wow -= e.action === "pause" ? 4 : e.action === "slow" ? 6 : 10;
        flag(s, `intervened_E${e.eventNo}`);
      }
      const incident = risk && e.eventNo !== 4 && !intervene;
      if (e.eventNo === 1)
        s.run.wow += { "0.5": 4, "0.8": 7, "1": 9, "1.2": 10 }[
          String(s.dials.s) as "1"
        ];
      if (incident) {
        s.run.incidents++;
        s.run.wow -= 20;
        flag(s, `incident_E${e.eventNo}`);
      }
      if (e.eventNo === 3 && !incident && !intervene) {
        if (s.dials.r === "manual") s.run.supervision++;
        else s.run.wow += s.dials.r === "assisted" ? 10 : 16;
      }
      if (e.eventNo === 4 && !intervene) {
        if (s.dials.l === "always") {
          s.run.supervision++;
          s.run.wow += 4;
        } else
          s.run.wow +=
            s.dials.l === "uncertain" ? (s.shown.includes("D2") ? 16 : 8) : -10;
      }
      if (e.eventNo === 5) {
        s.run.supervision +=
          Number(s.dials.r === "auto") +
          Number(s.dials.s === 1.2) +
          s.run.interventions;
        s.run.wow += Math.min(6, Math.max(0, round((s.align - 50) / 5)));
        s.run.wow -=
          Number(has(s, "auditor_flag")) * 5 +
          Number(has(s, "pushed")) * 3 +
          Number(has(s, "imposed")) * 4;
        s.ending = endingFor(s);
        s.archetype = archetypeFor(s);
        s.scene = "ending";
      }
      s.run.log.push({
        event: e.eventNo,
        action: e.action,
        incident,
        wow: s.run.wow,
      });
      s.run.eventNo++;
      title = `Run event ${e.eventNo} · ${e.action.toUpperCase()}`;
      const known =
        e.eventNo === 2
          ? s.shown.includes("D3")
          : e.eventNo === 3
            ? s.shown.includes("D4")
            : e.eventNo === 4
              ? s.shown.includes("D2")
              : true;
      why = incident
        ? "An unprevented incident costs 20 Wow."
        : intervene
          ? "The intervention prevented this event's incident or failure; a token and supervision were spent."
          : e.eventNo === 4 && s.dials.l === "never"
            ? "Never-confirm learning dropped the object: −10 Wow."
            : "The build ran according to its recorded settings.";
      constraint =
        e.eventNo === 5
          ? `Ending: ${s.ending}.`
          : !known
            ? "This was a visible unknown: the relevant folder was not shown."
            : "The gallery saw the outcome.";
      badges = {
        evidence: known,
        tradeoff: true,
        heard: null,
        adapted: risk ? intervene || known : null,
      };
      break;
    }
  }
  normalize(s);
  if (title)
    s.trace.push({
      seq: e.seq,
      chapter: ["floor", "table", "consequence1"].includes(previous.scene)
        ? 1
        : ["opening2", "data", "forge", "consequence2"].includes(previous.scene)
          ? 2
          : 3,
      title,
      assumption,
      before,
      after: ledger(s),
      cause: `player:${e.type}:${e.seq}`,
      why,
      constraint,
      badges,
    });
  s.seq++;
  return s;
}
export function replay(events: DeadlockEvent[]): DeadlockState {
  return events.reduce(reduceEvent, initialState());
}
export function append(
  run: SavedRun,
  action: Action,
  t = new Date().toISOString(),
): SavedRun {
  const state = replay(run.events),
    event = { ...action, seq: state.seq, t } as DeadlockEvent;
  reduceEvent(state, event);
  return {
    ...run,
    events: [...run.events, event],
    updatedAt: t,
    revision: run.revision + 1,
  };
}
export function createRun(ownerId: string): SavedRun {
  const at = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ownerId,
    contentVersion: "1.0",
    events: [],
    createdAt: at,
    updatedAt: at,
    revision: 0,
  };
}
export function forkRun(run: SavedRun, seq: number, ownerId: string): SavedRun {
  requireRule(
    run.ownerId === ownerId,
    "This run belongs to another workspace.",
  );
  requireRule(
    Number.isInteger(seq) && seq >= 0 && seq < run.events.length,
    "That decision is not in the log.",
  );
  const branch = createRun(ownerId);
  return {
    ...branch,
    parentId: run.id,
    forkSeq: seq,
    events: structuredClone(run.events.slice(0, seq)),
  };
}
export function withEchoes(run: SavedRun): SavedRun {
  const s = replay(run.events);
  return {
    ...run,
    echoes: s.trace
      .filter((t) => t.assumption)
      .slice(0, 3)
      .map((t) => ({ seq: t.seq, assumption: t.assumption! })),
  };
}
export type Lever = {
  seq: number;
  label: string;
  ending: Ending;
  shift: number;
  action: Action;
};
export function findLevers(run: SavedRun): Lever[] {
  const final = replay(run.events);
  if (!final.ending) return [];
  const found: Lever[] = [];
  for (const event of run.events) {
    let alternatives: Action[] = [];
    if (event.type === "SOCKET")
      alternatives = resolutions
        .filter((r) => r !== event.res)
        .map((res) => ({
          type: "SOCKET",
          lane: event.lane,
          res,
          previewMs: 800,
        }));
    if (event.type === "SHOW")
      alternatives = datasetIds
        .filter((dataset) => dataset !== event.dataset)
        .map((dataset) => ({ type: "SHOW", dataset, previewMs: 800 }));
    if (event.type === "RUN_DECISION")
      alternatives = (["let", "pause", "slow", "takeover"] as const)
        .filter((a) => a !== event.action)
        .map((action) => ({
          type: "RUN_DECISION",
          eventNo: event.eventNo,
          action,
        }));
    if (event.type === "DIAL")
      for (const speed of [0.5, 0.8, 1, 1.2] as const)
        for (const recovery of ["manual", "assisted", "auto"] as const)
          for (const learning of ["always", "uncertain", "never"] as const) {
            if (
              event.value.s !== speed ||
              event.value.r !== recovery ||
              event.value.l !== learning
            )
              alternatives.push({
                type: "DIAL",
                value: { s: speed, r: recovery, l: learning },
              });
          }
    for (const action of alternatives) {
      try {
        let changed = initialState();
        for (const original of run.events)
          changed = reduceEvent(
            changed,
            original.seq === event.seq
              ? ({
                  ...action,
                  seq: original.seq,
                  t: original.t,
                } as DeadlockEvent)
              : original,
          );
        if (!changed.ending) continue;
        const shift = Math.max(
          Math.abs(changed.run.wow - final.run.wow),
          ...["rob", "sw", "ready", "align", "cred"].map((k) =>
            Math.abs(changed[k as keyof Metrics] - final[k as keyof Metrics]),
          ),
        );
        if (changed.ending !== final.ending || shift >= 15)
          found.push({
            seq: event.seq,
            label:
              action.type === "SOCKET"
                ? `${action.lane} → ${action.res}`
                : action.type === "SHOW"
                  ? `Project ${action.dataset}`
                  : action.type === "RUN_DECISION"
                    ? `Event ${action.eventNo} → ${action.action}`
                    : action.type === "DIAL"
                      ? `${action.value.s} / ${action.value.r} / ${action.value.l}`
                      : "Replay",
            ending: changed.ending,
            shift,
            action,
          });
      } catch {
        /* A changed decision can invalidate later choices. Do not promise an unverified ending. */
      }
    }
  }
  return found
    .sort(
      (a, b) =>
        Number(b.ending !== final.ending) - Number(a.ending !== final.ending) ||
        b.shift - a.shift,
    )
    .filter((l, i, a) => a.findIndex((x) => x.seq === l.seq) === i)
    .slice(0, 3);
}
