import { readFileSync, writeFileSync } from "node:fs";
import { append, createRun } from "../src/lib/deadlock/engine";
import { policyRun } from "./deadlock-policies";
import type { Action, Resolution, SavedRun } from "../src/lib/deadlock/types";
const at = "2026-10-30T00:00:00.000Z";
const fixtures: Record<string, SavedRun> = {};
for (const [room, choices] of Object.entries({
  ALIGNED_BURN: ["B", "B", "R"],
  ROBOTICS_WIN: ["R", "R", "S"],
  SOFTWARE_WIN: ["S", "S", "R"],
  STALLED: ["D", "D", "R"],
  MIXED: ["R", "S", "D"],
})) {
  let run = { ...createRun("fixture-owner"), createdAt: at, updatedAt: at };
  const actions: Action[] = [
    { type: "START", mode: "silent" },
    { type: "ACK_SCENE", scene: "intro" },
    { type: "ACK_SCENE", scene: "floor" },
    ...(["speed", "recovery", "learning"] as const).map((lane, i) => ({
      type: "SOCKET" as const,
      lane,
      res: choices[i] as Resolution,
      previewMs: 900,
    })),
    { type: "LOCK_PLAN" },
    { type: "ACK_SCENE", scene: "consequence1" },
  ];
  for (const a of actions) run = append(run, a, at);
  fixtures["room-" + room] = run;
}
const informed = policyRun("INFORMED");
for (const scene of ["floor", "table", "forge", "run"] as const) {
  const e = informed.events.find(
    (e) =>
      e.type === "ACK_SCENE" &&
      e.scene ===
        { floor: "intro", table: "floor", forge: "data", run: "consequence2" }[
          scene
        ],
  );
  if (e)
    fixtures[scene] = {
      ...createRun("fixture-owner"),
      createdAt: at,
      updatedAt: at,
      events: informed.events.slice(0, e.seq + 1),
    };
}
fixtures.debrief = {
  ...createRun("fixture-owner"),
  createdAt: at,
  updatedAt: at,
  events: [
    ...informed.events,
    { type: "ACK_SCENE", scene: "ending", seq: informed.events.length, t: at },
  ],
};
fixtures["extra-floor"] = {
  ...createRun("fixture-owner"),
  createdAt: at,
  updatedAt: at,
  events: informed.events.slice(0, 2),
};

const finalEvent = informed.events.find(
  (e) => e.type === "RUN_DECISION" && e.eventNo === 4,
);
if (finalEvent)
  fixtures["run-final"] = {
    ...createRun("fixture-owner"),
    createdAt: at,
    updatedAt: at,
    events: informed.events.slice(0, finalEvent.seq + 1),
  };
fixtures.ending = {
  ...createRun("fixture-owner"),
  createdAt: at,
  updatedAt: at,
  events: informed.events,
};
const samples = JSON.parse(
  readFileSync("docs/deadlock-verification/simulation.json", "utf8"),
);
for (const [ending, seed] of Object.entries(samples.exampleSeeds)) {
  const sample = policyRun("RANDOM", Number(seed));
  fixtures["ending-" + ending.replaceAll(" ", "-")] = {
    ...createRun("fixture-owner"),
    createdAt: at,
    updatedAt: at,
    events: sample.events,
  };
}
writeFileSync(
  "docs/deadlock-verification/fixtures.json",
  JSON.stringify(fixtures, null, 2) + "\n",
);
