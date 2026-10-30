import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  acceptance,
  append,
  createRun,
  evidenceRelation,
  findLevers,
  forkRun,
  initialState,
  previewSocket,
  replay,
  riskAt,
  roomFor,
  tableState,
} from "../src/lib/deadlock/engine";
import {
  board,
  lines,
  objects,
  datasets,
  endings,
  audioManifest,
  lanes,
  resolutions,
} from "../src/lib/deadlock/content";
import { reactionFor } from "../src/lib/deadlock/reactions";
import { policyRun } from "../scripts/deadlock-policies";
import type {
  Dataset,
  Dial,
  Evidence,
  Lane,
  Resolution,
  SavedRun,
} from "../src/lib/deadlock/types";
test("authored content is validated, references exist, and prose budgets hold", () => {
  const ids = new Set(lines.map((l) => l.id));
  assert.equal(ids.size, lines.length);
  for (const id of [
    ...objects.flatMap((o) => o.reaction),
    ...datasets.flatMap((d) => d.lines),
    ...endings.flatMap((e) => e.lines),
  ])
    assert.ok(ids.has(id), id);
  for (const l of lines) {
    assert.ok(l.text.trim().split(/\s+/).length <= 40, l.id);
    assert.ok(audioManifest.lines[l.id]);
  }
  assert.ok(
    lines
      .filter((l) => l.id.startsWith("CO-") && l.id !== "CO-06")
      .reduce((n, l) => n + l.text.split(/\s+/).length, 0) <= 90,
  );
});
test("all 64 table combinations obey the supplied room precedence and bridge budget", () => {
  for (const speed of resolutions)
    for (const recovery of resolutions)
      for (const learning of resolutions) {
        const choices = {
          speed: { res: speed },
          recovery: { res: recovery },
          learning: { res: learning },
        };
        const counts = (r: Resolution) =>
          [speed, recovery, learning].filter((x) => x === r).length;
        const expected =
          counts("B") >= 2
            ? "ALIGNED_BURN"
            : counts("R") >= 2
              ? "ROBOTICS_WIN"
              : counts("S") >= 2
                ? "SOFTWARE_WIN"
                : counts("D") >= 2
                  ? "STALLED"
                  : "MIXED";
        assert.equal(roomFor(choices), expected);
        if (counts("B") === 3) assert.throws(() => tableState(choices));
        else assert.equal(tableState(choices).ap, 5 - counts("B") * 2);
      }
});
test("every evidence × lane × resolution follows the independent support matrix", () => {
  const matrix: Record<Evidence, Record<Lane, Resolution[]>> = {
    E1: { speed: ["S"], recovery: ["R"], learning: ["R"] },
    E2: { speed: ["S"], recovery: ["S"], learning: [] },
    E3: { speed: ["B"], recovery: ["B"], learning: ["B"] },
    E4: { speed: ["B", "D"], recovery: ["D"], learning: ["B", "D"] },
    E5: { speed: ["B"], recovery: ["B"], learning: ["B"] },
  };
  for (const card of Object.keys(matrix) as Evidence[])
    for (const lane of lanes)
      for (const res of resolutions) {
        const supports = matrix[card][lane];
        assert.equal(
          evidenceRelation(card, lane, res),
          supports.includes(res)
            ? "SUPPORT"
            : (res === "R" && supports.includes("S")) ||
                (res === "S" && supports.includes("R"))
              ? "CONTRADICT"
              : "NEUTRAL",
        );
      }
  const c = tableState({
    speed: { res: "R", evidence: "E1" },
    recovery: {},
    learning: {},
  });
  assert.equal(c.sw, 69);
  assert.equal(c.cred, 42);
});
test("ghost preview equals commit; undoing a bridge refunds points and runway", () => {
  let run = createRun("test");
  for (const a of [
    { type: "START", mode: "silent" },
    { type: "ACK_SCENE", scene: "intro" },
    { type: "INSPECT", card: "E3" },
    { type: "ACK_SCENE", scene: "floor" },
    { type: "ATTACH", lane: "speed", card: "E3" },
  ] as const)
    run = append(run, a);
  const before = replay(run.events),
    ghost = previewSocket(before, "speed", "B");
  run = append(run, {
    type: "SOCKET",
    lane: "speed",
    res: "B",
    previewMs: 1000,
  });
  let actual = replay(run.events);
  for (const k of [
    "rob",
    "sw",
    "ready",
    "align",
    "runway",
    "ap",
    "cred",
  ] as const)
    assert.equal(actual[k], ghost[k]);
  assert.equal(before.ap, 5);
  run = append(run, {
    type: "SOCKET",
    lane: "speed",
    res: "S",
    previewMs: 1000,
  });
  actual = replay(run.events);
  assert.equal(actual.ap, 5);
  assert.equal(actual.runway, 12);
});
test("inspection reserves one bolt, cancellation never permits browsing extra objects for free", () => {
  let run = createRun("test");
  for (const a of [
    { type: "START", mode: "silent" },
    { type: "ACK_SCENE", scene: "intro" },
    { type: "BEGIN_INSPECT", card: "E1" },
  ] as const)
    run = append(run, a);
  assert.equal(replay(run.events).focus, 2);
  assert.throws(() => append(run, { type: "BEGIN_INSPECT", card: "E2" }));
  run = append(run, { type: "INSPECT", card: "E1" });
  assert.equal(replay(run.events).focus, 2);
  assert.throws(() => append(run, { type: "INSPECT", card: "E1" }));
});
test("all 36 builds × shown subsets × bridge flags obey independent acceptance and incident formulas", () => {
  for (let mask = 0; mask < 16; mask++)
    for (const bridge of [false, true])
      for (const speed of [0.5, 0.8, 1, 1.2] as const)
        for (const recovery of ["manual", "assisted", "auto"] as const)
          for (const learning of ["always", "uncertain", "never"] as const) {
            const s = initialState();
            s.dials = { s: speed, r: recovery, l: learning };
            s.shown = (["D1", "D2", "D3", "D4"] as Dataset[]).filter(
              (_, i) => mask & (1 << i),
            );
            s.flags = bridge ? ["bridge_recovery", "bridge_speed"] : [];
            const a = acceptance(s);
            assert.equal(
              a.robotics,
              speed >= 0.8 && recovery !== "manual" && learning !== "always",
            );
            assert.equal(
              a.software,
              (speed <= 0.8 || (speed === 1 && s.shown.includes("D3"))) &&
                (recovery !== "auto" || bridge || s.shown.includes("D4")) &&
                (learning === "always" ||
                  (learning === "uncertain" && s.shown.includes("D2"))),
            );
            assert.equal(
              riskAt(s, 2),
              speed === 1.2 ||
                (speed === 1 && !s.shown.includes("D3") && !bridge),
            );
            assert.equal(
              riskAt(s, 3),
              recovery === "auto" && !bridge && !s.shown.includes("D4"),
            );
            assert.equal(riskAt(s, 4), learning === "never");
          }
});
test("named policies reach their authored endings, with no typing or runtime model dependency", () => {
  assert.equal(policyRun("INFORMED").state.ending, "SHARED GROUND");
  assert.equal(policyRun("LEAN").state.ending, "STEADY HANDS");
  assert.equal(policyRun("BOLD").state.ending, "STANDING GUARD");
  assert.equal(policyRun("AVOIDANT").state.ending, "QUIET ROOM");
});
test("same event log produces the same state in 10,000 seeded random runs", () => {
  for (let i = 1; i <= 10000; i++) {
    const { events, state } = policyRun("RANDOM", i);
    assert.deepEqual(replay(events), state);
    assert.deepEqual(replay(structuredClone(events)), state);
  }
});
test("fork preserves original immutable log and exact pre-decision evidence and Focus", () => {
  const { events } = policyRun("INFORMED");
  const run: SavedRun = { ...createRun("owner"), events };
  const snapshot = JSON.stringify(run);
  const seq = events.find((e) => e.type === "SOCKET")!.seq;
  const branch = forkRun(run, seq, "owner");
  assert.deepEqual(replay(branch.events), replay(events.slice(0, seq)));
  assert.equal(JSON.stringify(run), snapshot);
  assert.notEqual(run.id, branch.id);
  assert.throws(() => forkRun(run, seq, "other"));
});
test("counterfactual levers advertise only independently replayed results", () => {
  const { events } = policyRun("BOLD");
  const run: SavedRun = { ...createRun("owner"), events };
  for (const l of findLevers(run)) {
    const changed = events.map((e) =>
      e.seq === l.seq ? { ...l.action, seq: e.seq, t: e.t } : e,
    );
    assert.equal(replay(changed).ending, l.ending);
  }
});
test("reaction beats are earned by their player events; contradictory table lines disappear when the cause flips", () => {
  const s = initialState();
  s.scene = "table";
  s.lanes.speed = { res: "R" };
  const before = initialState();
  before.scene = "table";
  const event = {
    type: "SOCKET" as const,
    lane: "speed" as const,
    res: "R" as const,
    previewMs: 900,
    seq: 0,
    t: "2026-10-30T00:00:00.000Z",
  };
  assert.ok(reactionFor(event, before, s).some((l) => l.id === "T-R-DEV"));
  assert.ok(
    !reactionFor({ ...event, res: "S" }, before, {
      ...s,
      lanes: { ...s.lanes, speed: { res: "S" } },
    }).some((l) => l.id === "T-R-DEV"),
  );
  const sample = policyRun("INFORMED");
  for (const t of sample.state.trace) assert.match(t.cause, /^player:/);
});

test("an absent Dev cannot react or be described as agreeing until recalled", () => {
  const before = initialState();
  before.scene = "data";
  before.room = "SOFTWARE_WIN";
  before.flags = ["dev_absent"];
  before.shown = ["D3"];
  const after = structuredClone(before);
  after.shown.push("D2");
  const event = {
    type: "SHOW" as const,
    dataset: "D2" as const,
    previewMs: 900,
    seq: 0,
    t: "2026-10-30T00:00:00.000Z",
  };
  const absent = reactionFor(event, before, after);
  assert.ok(!absent.some((l) => l.id === "S-D2-DEV" || l.id === "S-D2-MARA"));
  assert.ok(absent.some((l) => l.id === "S-D2-INES"));
  after.flags.push("dev_recalled");
  assert.ok(
    reactionFor(event, before, after).some((l) => l.id === "S-D2-MARA"),
  );
});

test("run trace records token, Wow and supervision costs; badges respect their stated decision window", () => {
  const bold = policyRun("BOLD").state;
  const pause = bold.trace.find((t) => t.title === "Run event 2 · PAUSE")!;
  assert.equal(pause.before.tokens, 3);
  assert.equal(pause.after.tokens, 2);
  assert.equal(pause.after.wow - pause.before.wow, -4);
  assert.equal(pause.after.supervision - pause.before.supervision, 1);
  assert.equal(
    bold.trace.find((t) => t.title === "Both teams saw D1")?.badges.heard,
    true,
  );
  assert.equal(
    bold.trace.find((t) => t.title.startsWith("Proposal "))?.badges.adapted,
    false,
  );
  const informed = policyRun("INFORMED").state;
  assert.equal(
    informed.trace.find((t) => t.title.startsWith("Proposal "))?.badges.adapted,
    null,
  );
});
