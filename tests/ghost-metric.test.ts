import test from "node:test";
import assert from "node:assert/strict";
import {
  initial,
  reduce,
  replay,
  band,
  capacity,
  truth,
  metricPreview,
  defaultMetric,
  exploits,
  type State,
  type Action,
  type Metric,
  type Framing,
} from "../src/lib/ghost-metric/engine";
import {
  drawers,
  layers,
  type DrawerId,
} from "../src/lib/ghost-metric/content";
import { conversation, lines } from "../src/lib/ghost-metric/dialogue";
const clean: Metric = {
  unit: "completions",
  dedupe: true,
  streams: false,
  exclusions: "account",
  segment: "all",
  window: "rolling",
  guardrails: "both",
};
function act(s: State, ...actions: Action[]) {
  return actions.reduce(reduce, s);
}
function audit(all = true) {
  let s = act(initial(), { type: "OPEN" }, { type: "CLASSIFY", counts: false });
  if (all)
    s = act(
      s,
      { type: "DRAWER", id: "gateway" },
      { type: "JOIN", left: "gateway", right: "gateway", key: "request_id" },
      { type: "DRAWER", id: "sdk" },
      { type: "DRAWER", id: "tags" },
      { type: "JOIN", left: "tags", right: "accounts", key: "account_id" },
    );
  return s;
}
function prepared(
  s: State,
  mode: "now" | "verify" | "quiet" = "now",
  range = { point: 88, low: 80, high: 95 },
) {
  s = act(
    s,
    { type: "FINISH_AUDIT" },
    { type: "ESTIMATE", ...range },
    { type: "CARRY", mode, verifyId: "sdk" },
  );
  if (s.scene === "promise")
    s = reduce(s, { type: "PROMISE", wording: "confident" });
  return s;
}
function delivery(
  s: State,
  framing: Framing = "privateFirst",
  tellMarcus = true,
) {
  s = reduce(s, {
    type: "TELL",
    person: framing === "evolution" ? "Elena" : "Ravi",
  });
  if (tellMarcus) s = reduce(s, { type: "TELL", person: "Marcus" });
  s = act(
    s,
    { type: "FRAMING", framing },
    { type: "HEADLINE", id: "limits" },
    { type: "EVIDENCE", ids: s.opened.slice(0, capacity(s)) },
    { type: "ASK", id: "baseline" },
  );
  return s;
}
function finish(s: State, spec = clean, fix = true) {
  s = reduce(s, { type: "METRIC", spec });
  if (fix) {
    for (const id of [...s.loopholes])
      if (id === "segments" || s.fixHours > 0)
        s = reduce(s, { type: "FIX", id });
  }
  s = reduce(s, { type: "FINISH_REDTEAM" });
  if (s.scene === "secondSource")
    s = reduce(s, { type: "SECOND_SOURCE", source: "independent" });
  return act(
    s,
    { type: "ROLLOUT", support: true },
    { type: "BOARD", move: "own" },
  );
}
test("authored anatomy adds to the headline without confusing growth and total share", () => {
  assert.equal(
    layers.reduce((sum, l) => sum + l.mass, 0),
    7.5,
  );
  assert.equal(truth.real + truth.ghost, truth.growth);
  assert.equal(((truth.current - truth.baseline) / truth.baseline) * 100, 340);
  assert.equal(Math.round(truth.share), 88);
  assert.notEqual(truth.share, (truth.ghost / truth.current) * 100);
});
test("P1 all causes, direct: truth lands with a skeptical owner and a second-source scene", () => {
  const s = finish(delivery(prepared(audit()), "direct"));
  assert.equal(s.scene, "debrief");
  assert.equal(s.archetype, "The Truth-teller");
  assert.equal(s.secondSource, true);
  assert.equal(s.proved.length, 4);
});
test("P2 all causes, evolution: correction has a measurable delay and mandate is reachable", () => {
  const s = finish(delivery(prepared(audit()), "evolution"));
  assert.ok(s.DL >= 6);
  assert.equal(s.rollout, "Immediate mandate");
  assert.ok(s.TE < 65);
});
test("P3 private-first without briefing Marcus produces a leak and a specific trust cost", () => {
  const s = delivery(prepared(audit()), "privateFirst", false);
  assert.equal(s.leak, true);
  assert.equal(s.CROt, 42);
  assert.match(s.receipts.find((r) => r.id === "G_FRAME")!.because, /Slack/);
});
test("briefing Marcus before the chapter exits prevents the leak", () => {
  const s = delivery(prepared(audit()), "privateFirst");
  assert.equal(s.leak, false);
  assert.equal(s.CROt, 50);
});
test("P4 little evidence plus a confident promise returns in the crisis", () => {
  const s = finish(delivery(prepared(audit(false), "quiet")));
  assert.equal(s.outcome, "Crisis");
  assert.equal(s.archetype, "The Optimist");
  assert.ok(s.receipts.some((r) => r.id === "G_PROMISE"));
});
test("P5 skipping all audit leaves a wide band and a consequential silence path", () => {
  const s = prepared(audit(false), "quiet");
  assert.equal(band(s).low, 0);
  assert.equal(band(s).high, 95);
  assert.equal(s.AH, 12);
  assert.equal(s.promise, "confident");
});
test("P6 overconfidence changes credibility but never reveals the hidden calibration before debrief", () => {
  const s = prepared(audit(), "now", { point: 30, low: 20, high: 40 });
  assert.equal(s.calibration, "overconfident");
  assert.equal(s.CR, 37);
  assert.ok(!s.receipts.find((r) => r.id === "G_EST")!.because.includes("88"));
  assert.equal(s.lastConversation, "now");
});
test("P7 a good-looking metric with leakage keeps those loopholes in the board result", () => {
  const s = finish(
    delivery(prepared(audit())),
    { ...clean, exclusions: "tag" },
    false,
  );
  assert.ok(s.loopholes.includes("exclusions"));
  assert.equal(s.outcome, "Stalemate");
});
test("P8 knowingly hiding a quantified ghost records the choice and heavier credibility loss", () => {
  const s = prepared(audit(), "quiet");
  assert.equal(s.hidden, true);
  assert.equal(s.CR, 38);
  assert.match(s.receipts.find((r) => r.id === "G_CARRY")!.because, /withheld/);
});
test("P9 verification uses prep once, consumes delay, and cannot be repeated for free", () => {
  const s = prepared(audit(false), "verify");
  assert.equal(s.PH, 10);
  assert.equal(s.DL, 1);
  assert.ok(s.proved.includes("streaming"));
  assert.equal(s.CR, 52);
  assert.throws(() => reduce(s, { type: "CARRY", mode: "verify" }));
  const tight = prepared(audit());
  assert.throws(() =>
    reduce({ ...tight, scene: "carry" }, { type: "CARRY", mode: "verify" }),
  );
});
test("P10 a data room adds three days and lowers CEO trust without inventing a cause", () => {
  const s = delivery(prepared(audit(false)), "dataRoom");
  assert.equal(s.DL, 3);
  assert.equal(s.CEOt, 51);
  assert.deepEqual(s.proved, []);
  assert.equal(s.lastConversation, "delay");
});
test("Surgeon is reachable at the actual 11-hour minimum and requires the clean controls", () => {
  const s = finish(delivery(prepared(audit())));
  assert.equal(12 - s.AH, 11);
  assert.equal(s.archetype, "The Surgeon");
  assert.equal(s.loopholes.length, 0);
  assert.ok(s.CTOt >= 60);
});
test("drawers cannot overspend, reopen, or reveal retry/partner mass without their joins", () => {
  let s = act(
    audit(false),
    { type: "DRAWER", id: "gateway" },
    { type: "DRAWER", id: "sdk" },
    { type: "DRAWER", id: "tags" },
    { type: "DRAWER", id: "cohorts" },
  );
  assert.equal(s.AH, 1);
  assert.deepEqual(s.proved, ["streaming", "internal"]);
  assert.throws(() => reduce(s, { type: "DRAWER", id: "billing" }));
  assert.throws(() => reduce(s, { type: "DRAWER", id: "gateway" }));
  assert.equal(band(s).mass, 3.8);
});
test("a wrong join spends an hour, explains why, and never confirms a cause", () => {
  const s = act(
    audit(false),
    { type: "DRAWER", id: "gateway" },
    { type: "JOIN", left: "gateway", right: "gateway", key: "customer_id" },
  );
  assert.equal(s.AH, 8);
  assert.equal(band(s).mass, 0);
  assert.match(s.feedback, /different|same entity/);
});
test("the uncertainty band always contains the ground truth for every affordable audit and join order", () => {
  let count = 0;
  function walk(s: State, depth: number) {
    const b = band(s);
    assert.ok(b.low <= truth.share + 1e-8 && b.high >= truth.share - 1e-8);
    count++;
    if (depth === 0) return;
    for (const d of drawers)
      if (!s.opened.includes(d.id) && s.AH >= d.cost)
        walk(reduce(s, { type: "DRAWER", id: d.id }), depth - 1);
    for (const a of [
      { type: "JOIN", left: "gateway", right: "gateway", key: "request_id" },
      { type: "JOIN", left: "tags", right: "accounts", key: "account_id" },
    ] as Action[]) {
      try {
        const next = reduce(s, a);
        walk(next, depth - 1);
      } catch {}
    }
  }
  walk(audit(false), 5);
  assert.ok(count > 1000);
});
test("a clean all-customer metric shows +40%; cohorts use their own denominators", () => {
  assert.equal(metricPreview(clean).growth, 40);
  assert.equal(metricPreview({ ...clean, segment: "enterprise" }).growth, 50);
  assert.equal(
    Math.round(metricPreview({ ...clean, segment: "paying" }).growth!),
    45,
  );
  assert.equal(metricPreview({ ...clean, unit: "tokens" }).growth, null);
  assert.equal(metricPreview({ ...clean, unit: "revenue" }).growth, null);
});
test("red-team fixes spend a maximum of three hours; cohort transparency is free", () => {
  let s = reduce(delivery(prepared(audit())), {
    type: "METRIC",
    spec: defaultMetric,
  });
  for (const id of ["segments", "dedupe", "streams", "exclusions"] as const)
    s = reduce(s, { type: "FIX", id });
  assert.equal(s.fixHours, 0);
  assert.deepEqual(s.loopholes, ["quality"]);
  assert.throws(() => reduce(s, { type: "FIX", id: "quality" }));
  assert.equal(s.spec?.segment, "all");
});
test("slides cannot cite unopened sources or exceed the scramble capacity", () => {
  let s = prepared(audit());
  s = act(
    s,
    { type: "TELL", person: "Ravi" },
    { type: "FRAMING", framing: "privateFirst" },
    { type: "HEADLINE", id: "limits" },
  );
  assert.equal(capacity(s), 1);
  assert.throws(() => reduce(s, { type: "EVIDENCE", ids: ["gateway", "sdk"] }));
  assert.throws(() => reduce(s, { type: "EVIDENCE", ids: ["billing"] }));
});
test("range validation rejects NaN, reversed ranges, and out-of-range points", () => {
  const s = reduce(audit(), { type: "FINISH_AUDIT" });
  for (const range of [
    { point: NaN, low: 0, high: 100 },
    { point: 50, low: 60, high: 90 },
    { point: 101, low: 0, high: 100 },
  ])
    assert.throws(() => reduce(s, { type: "ESTIMATE", ...range }));
});
test("unknown action fields, flags, metric choices and scene jumps are rejected", () => {
  for (const a of [
    { type: "OPEN", undefinedFlag: true },
    { type: "FRAMING", framing: "fake" },
    { type: "METRIC", spec: { ...clean, unknownFlag: true } },
    { type: "BOARD", move: "own" },
  ])
    assert.throws(() => reduce(initial(), a as Action));
});
test("replay is deterministic and a fork never mutates its source event array", () => {
  const events = [
    { action: { type: "OPEN" } as Action, at: "2026-10-31T00:00:00.000Z" },
    {
      action: { type: "CLASSIFY", counts: false } as Action,
      at: "2026-10-31T00:00:01.000Z",
    },
  ];
  const before = JSON.stringify(events);
  assert.deepEqual(replay(events), replay(events));
  const fork = replay(events.slice(0, 1));
  assert.equal(fork.scene, "unit");
  assert.equal(JSON.stringify(events), before);
});
test("every emitted conversation exists and no hidden cause is named by an unquantified private conversation", () => {
  const s = delivery(prepared(audit(false)));
  assert.ok(conversation("privateNoProof").length);
  assert.ok(
    !conversation("privateNoProof").some((l) =>
      /repeats|million|Orbitly/.test(l.text),
    ),
  );
  for (const framing of [
    "direct",
    "evolution",
    "privateFirst",
    "dataRoom",
  ] as const) {
    let state = prepared(audit());
    state = delivery(state, framing);
    assert.ok(conversation(state.lastConversation).length);
  }
  assert.ok(lines.length >= 90);
  assert.equal(new Set(lines.map((l) => l.id)).size, lines.length);
  assert.ok(lines.every((l) => l.text.split(/\s+/).length <= 14));
});
