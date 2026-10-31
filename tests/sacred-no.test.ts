import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  initial,
  reduce,
  replay,
  projection,
  lintContent,
  content,
  type Action,
  type Draft,
  type State,
} from "../src/lib/sacred-no/engine";
const base: Draft = {
  position: "no",
  evidence: ["load", "dashboard"],
  alternative: "data",
  ask: "tess",
  deadline: "board",
  tone: "direct",
};
function journey(
  options: {
    evidence?: string[];
    draft?: Partial<Draft>;
    hours?: number;
    queue?: boolean;
    deals?: string[];
    segments?: string[];
    position?: "no" | "guarded" | "defer";
    tone?: "direct" | "warm" | "hedged";
    rehearse?: boolean;
  } = {},
) {
  let s = initial();
  const events: { action: Action; at: string }[] = [];
  const act = (action: Action) => {
    events.push({ action, at: "2026-10-31T00:00:00.000Z" });
    s = reduce(s, action);
  };
  act({ type: "REPLY", reply: "ask" });
  for (const id of options.evidence ?? ["load", "dashboard"])
    act({ type: "INSPECT", id });
  act({ type: "NEXT" });
  act({ type: "ALLOCATE", hours: options.hours ?? 6 });
  if (options.rehearse)
    for (const lens of ["board", "alternative", "revenue"])
      act({ type: "REHEARSE", lens });
  act({ type: "NEXT" });
  act({
    type: "CALL",
    draft: {
      ...base,
      ...options.draft,
      evidence: options.draft?.evidence ?? options.evidence ?? base.evidence,
    },
  });
  const afterCall = structuredClone(s);
  act({ type: "PRIYA", queue: options.queue ?? true });
  for (const id of options.deals ?? [])
    act({ type: "DEAL", id, tone: options.tone ?? "warm" });
  act({ type: "NEXT" });
  act({ type: "ROLLOUT", segments: options.segments ?? ["power"] });
  act({
    type: "LOCK",
    position: options.position ?? "no",
    evidence: s.inspected[0] || "",
    uninformed: !s.inspected.length,
  });
  act({ type: "DEMO" });
  act({ type: "FINAL", move: "own" });
  return { s, events, afterCall };
}
test("P1: cave at once is remembered, full-risk commitment produces a traceable failure", () => {
  const { s, afterCall } = journey({
    draft: { position: "ship" },
    deals: ["risk"],
    queue: false,
    position: "guarded",
    segments: content.segments.map((s) => s.id),
  });
  assert.equal(afterCall.effect, "cave");
  assert.equal(s.archetype, "The Echo");
  assert.equal(s.outcome, "Crash");
  assert.ok(
    s.receipts
      .find((r) => r.scene === "call")
      ?.words.includes("launch Live Drops"),
  );
});
test("P2: crafted refusal with a testable data alternative earns the golden board route", () => {
  const { s } = journey();
  assert.equal(s.golden, true);
  assert.equal(s.outcome, "Backed");
  assert.equal(s.archetype, "The Alchemist");
  assert.equal(s.demo, "data");
});
test("P3: refusal with no alternative costs CEO trust, without arbitrary failure", () => {
  const { s, afterCall } = journey({ draft: { alternative: "none" } });
  assert.ok(afterCall.CT < 55);
  assert.equal(afterCall.lastLine, "CALL-BARE");
  assert.equal(s.demo, "deferred");
  assert.notEqual(s.outcome, "Crash");
});
test("P4: guarded narrow release can hold without claiming universal production readiness", () => {
  const { s } = journey({
    draft: { position: "guarded", alternative: "beta" },
    position: "guarded",
    segments: ["power"],
    hours: 8,
  });
  assert.equal(s.demo, "stable");
  assert.equal(s.outcome, "Tolerated");
  assert.equal(s.golden, false);
});
test("P5: weak hedged refusal can be received as yes, repeated hedging raises jitter", () => {
  const { s, afterCall } = journey({
    evidence: ["tickets"],
    draft: { tone: "hedged", alternative: "beta" },
    deals: ["beta", "credits"],
    tone: "hedged",
  });
  assert.equal(afterCall.caved, true);
  assert.ok(s.JIT >= 4);
  assert.equal(s.archetype, "The Echo");
});
test("P6: explicit deferral reaches the board without manufacturing a live crash", () => {
  const { s } = journey({
    draft: { position: "defer", alternative: "none" },
    position: "defer",
    segments: [],
  });
  assert.equal(s.demo, "deferred");
  assert.notEqual(s.outcome, "Crash");
});
test("P7: two trades create real debts that appear in board receipts", () => {
  const { s } = journey({
    deals: ["beta", "credits"],
    draft: { alternative: "sandbox" },
  });
  assert.deepEqual(s.deals, ["beta", "credits"]);
  assert.equal(s.archetype, "The Dealmaker");
  assert.equal(s.receipts.filter((r) => r.scene === "deals").length, 2);
  assert.equal(
    s.fuses.filter((f) => f.firesAt === "board" && f.fired).length,
    4,
  );
});
test("P8: skipping evidence is possible, but is explicitly an uninformed handoff", () => {
  const { s } = journey({
    evidence: [],
    draft: { evidence: [], position: "ship", alternative: "none" },
    queue: false,
  });
  assert.equal(s.inspected.length, 0);
  assert.equal(s.demo, "payments");
  assert.ok(
    s.receipts
      .find((r) => r.scene === "lock")
      ?.words.includes("without evidence"),
  );
});
test("P9: research cannot exceed the visible budget; the run retains enough time to finish", () => {
  let s = reduce(initial(), { type: "REPLY", reply: "ask" });
  for (const id of ["load", "incident", "payments", "dashboard"])
    s = reduce(s, { type: "INSPECT", id });
  assert.equal(s.research, 110);
  assert.throws(
    () => reduce(s, { type: "INSPECT", id: "tickets" }),
    /research window/,
  );
  const { s: finished } = journey({
    evidence: ["load", "incident", "payments", "dashboard"],
    draft: { evidence: ["load", "payments"] },
    rehearse: true,
    deals: ["beta", "credits"],
  });
  assert.equal(finished.scene, "debrief");
});
test("P10: unsupported bare refusal opens the back-channel; trust threshold is reachable", () => {
  const { afterCall, s } = journey({
    evidence: [],
    draft: { position: "no", alternative: "none", evidence: [] },
  });
  assert.equal(afterCall.backchannel, true);
  assert.ok(afterCall.CT < 45);
  assert.equal(s.scene, "debrief");
});
test("Marlo partial failure names the commitment and remains isolated", () => {
  const { s } = journey({
    hours: 2,
    deals: ["marlo"],
    position: "guarded",
    segments: [],
  });
  assert.equal(s.demo, "marlo");
  assert.equal(s.outcome, "Crash");
  assert.match(
    s.receipts.find((r) => r.scene === "board")!.because,
    /Marlo deal/,
  );
});
test("kill switch contains overload without pretending it increases capacity", () => {
  const { s } = journey({
    hours: 6,
    position: "guarded",
    segments: content.segments.map((s) => s.id),
  });
  assert.equal(s.demo, "degraded");
  const noSwitch = { ...s, killSwitch: false };
  assert.equal(projection(s).cap, projection(noSwitch).cap);
});
test("replay is deterministic, receipts point only to real earlier decisions, original logs are immutable", () => {
  const { s, events } = journey({ deals: ["beta"] });
  const original = JSON.stringify(events);
  assert.deepEqual(replay(events), s);
  for (const r of s.receipts) {
    assert.ok(r.eventIndex <= events.length);
    if (r.source)
      assert.ok(
        s.receipts.find(
          (prior) => prior.id === r.source && prior.eventIndex < r.eventIndex,
        ),
      );
  }
  const branch = events.slice(
    0,
    events.findIndex((e) => e.action.type === "CALL"),
  );
  const before = replay(branch);
  reduce(before, { type: "CALL", draft: { ...base, alternative: "sandbox" } });
  assert.equal(JSON.stringify(events), original);
});
test("content linter and produced voice pack cover every short line and cast member", () => {
  assert.equal(lintContent(), true);
  const manifest = JSON.parse(
    readFileSync("content/projects/sacred-no/audio-manifest.json", "utf8"),
  );
  assert.equal(Object.keys(manifest.lines).length, content.lines.length);
  for (const l of content.lines) {
    const clip = manifest.lines[l.id];
    assert.equal(clip.caption, l.text);
    assert.equal(clip.speaker, l.speaker);
    assert.ok(existsSync("public" + clip.file));
  }
  assert.ok(existsSync("public/sacred-no/cast-v1.webp"));
});
test("invalid scene, unseen evidence, incompatible promises and forged actions are rejected", () => {
  assert.throws(() => reduce(initial(), { type: "DEMO" }));
  assert.throws(() => reduce(initial(), { type: "FAKE" } as unknown as Action));
  const { events } = journey();
  const call = events.findIndex((e) => e.action.type === "CALL");
  assert.throws(
    () =>
      reduce(replay(events.slice(0, call)), {
        type: "CALL",
        draft: { ...base, evidence: ["payments"] },
      }),
    /collected/,
  );
  const deals = events.findIndex(
    (e) =>
      e.action.type === "NEXT" &&
      replay(events.slice(0, events.indexOf(e))).scene === "deals",
  );
  let s = replay(events.slice(0, deals));
  s = reduce(s, { type: "DEAL", id: "apology", tone: "direct" });
  assert.throws(
    () => reduce(s, { type: "DEAL", id: "risk", tone: "direct" }),
    /conflicts/,
  );
});

test("all safeguard hours is not a free optimum: the feature still needs build time", () => {
  const { s } = journey({
    hours: 10,
    draft: { position: "guarded", alternative: "beta" },
    position: "guarded",
  });
  assert.equal(s.demo, "unready");
  assert.equal(s.plan, "defer");
  assert.match(
    s.receipts.find((r) => r.scene === "board")!.because,
    /engineer-hours/,
  );
});
