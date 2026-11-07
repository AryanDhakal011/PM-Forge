import test from "node:test";
import assert from "node:assert/strict";
import { newRun, restoreRun, ready, nextRun, forecast, forkRun, remember, conclusion, type Run, type Policy } from "../src/lib/trojan-horse/simulation";
import { allLines, people, steps } from "../src/lib/trojan-horse/content";
test("opening reconciles the ledger and a finite baseline runway", () => {
  const f = forecast(newRun()); assert.equal(f.payout, 410_000); assert.equal(f.burn, 510_000); assert.equal(f.cash, 6_200_000); assert.ok(Math.abs(f.runway - 12.15686) < .001);
});
test("each payout control changes the actual forecast", () => {
  const r = newRun(), base = forecast(r).burn;
  for (const patch of [{ reward: 5 }, { multiplier: 1 }, { cap: 2 }, { delay: 14 }]) assert.ok(forecast({ ...r, ...patch }).burn < base);
  assert.ok(forecast({ ...r, cap: 8 }).burn > base);
});
test("required tasks cannot be skipped by the transition function", () => {
  for (const step of [2, 4, 5, 6, 9, 11, 14, 17]) { const r = { ...newRun(), step }; assert.equal(ready(r), false); assert.equal(nextRun(r).step, step); }
});
test("the segment pool sums to one hundred and preserves ordinary payouts", () => {
  const r: Run = { ...newRun(), step: 12, placements: { fraud: "cut", gamers: "cut", guilds: "cut" } };
  const f = forecast(r); assert.equal(f.payout, 120_000); assert.equal(f.burn, 325_000); // $100k overhead + $120k ordinary payouts + $105k lost Guild revenue.
});
test("keeping valuable Guilds differs financially and relationally from cutting them", () => {
  const r: Run = { ...newRun(), step: 12, grace: 30, placements: { fraud: "cut", gamers: "sunset", guilds: "formalize" } };
  assert.ok(forecast(r).partner > forecast({ ...r, placements: { ...r.placements, guilds: "cut" } }).partner);
  assert.ok(forecast(r).burn < forecast({ ...r, placements: { ...r.placements, guilds: "cut" } }).burn);
});
test("notice and gradual rollout both carry cash costs", () => {
  const r: Run = { ...newRun(), step: 14, placements: { fraud: "cut", gamers: "sunset", guilds: "formalize" } };
  assert.ok(forecast({ ...r, grace: 30 }).burn > forecast({ ...r, grace: 0 }).burn);
  assert.ok(forecast({ ...r, rollout: 28 }).burn > forecast({ ...r, rollout: 0 }).burn);
});
test("cash charges one initial week, then four policy weeks after the Guild call", () => {
  const r = newRun(); assert.equal(forecast({ ...r, step: 8 }).cash, 6_200_000 - 510_000);
  assert.equal(forecast({ ...r, step: 10 }).cash, 6_200_000 - 3 * 510_000);
  assert.equal(forecast({ ...r, step: 15 }).cash, 6_200_000 - 7 * 510_000);
});
test("a promise returns as a real contradiction and owning it softens the consequence", () => {
  const r: Run = { ...newRun(), step: 15, message: 0, rollout: 14, response: "deny" };
  assert.equal(forecast(r).contradiction, true); assert.ok(forecast({ ...r, response: "own" }).trust > forecast(r).trust);
  assert.equal(forecast({ ...r, message: 2, grace: 30 }).contradiction, false);
});
test("a hostile, immediate rollout produces revolt; excessive spending can require a bridge", () => {
  const r: Run = { ...newRun(), step: 16, reward: 20, multiplier: 4, tone: "Blame users", rollout: 0, reason: "Call every loop fraud", message: 2, grace: 0 };
  const f = forecast(r); assert.equal(f.revolt, true); assert.equal(f.bridge, true); assert.match(conclusion(r), /eight percent dilution/);
});
test("a segmented, honest path can reach the Gardener without emergency funding", () => {
  const r: Run = { ...newRun(), step: 18, reward: 8, multiplier: 1, placements: { fraud: "cut", gamers: "sunset", guilds: "formalize" }, grace: 30, message: 2, response: "own", rollout: 14, final: "partners" };
  const f = forecast(r); assert.equal(f.gardener, true); assert.equal(f.bridge, false); assert.ok(f.partner > 80);
});
test("every combination of segment policy has finite, bounded outcomes", () => {
  for (const a of ["cut", "keep", "formalize", "sunset"] as Policy[]) for (const b of ["cut", "keep", "formalize", "sunset"] as Policy[]) for (const c of ["cut", "keep", "formalize", "sunset"] as Policy[]) {
    const f = forecast({ ...newRun(), step: 18, placements: { fraud: a, gamers: b, guilds: c } });
    for (const k of ["cash", "burn", "runway", "rating", "trust", "partner"] as const) assert.ok(Number.isFinite(f[k]), `${k} ${a}/${b}/${c}`);
    assert.ok(f.trust >= 0 && f.trust <= 100); assert.ok(f.rating >= 1 && f.rating <= 5);
  }
});
test("a hindsight fork preserves the original and clears later decisions", () => {
  const r = remember({ ...newRun(), step: 18, reflected: true, reflection: "A finished reflection.", final: "partners", response: "own" }, "Public promise", "Promise", "Customer expectation");
  const copy = JSON.stringify(r), fork = forkRun(r, 11); assert.equal(JSON.stringify(r), copy); assert.notEqual(fork.id, r.id); assert.equal(fork.parent, r.id); assert.equal(fork.response, ""); assert.equal(fork.final, ""); assert.equal(fork.reflected, false); assert.equal(fork.trace.length, 0);
});
test("invalid storage is rejected and valid resume retains the whole decision state", () => {
  for (const s of [null, "{}", "null", "not json", JSON.stringify({ ...newRun(), step: 200 })]) assert.equal(restoreRun(s), null);
  const r: Run = { ...newRun(), step: 11, reports: [2, 4, 5], lenses: ["Devices", "Purchases", "Location"], reply: "Check", placements: { fraud: "cut", gamers: "sunset", guilds: "formalize" } };
  assert.deepEqual(restoreRun(JSON.stringify(r)), r);
});
test("all chapters have a defined objective and unique authored audio lines", () => {
  assert.equal(steps.length, 19); assert.equal(new Set(allLines.map(l => l.id)).size, allLines.length);
  assert.ok(allLines.every(l => people[l.speaker] && l.text.length > 12)); assert.ok(steps.every(s => s.goal && s.action));
});
