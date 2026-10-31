import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runConclusion, teamResponse } from "../src/lib/deadlock/conclusion";
import { replay } from "../src/lib/deadlock/engine";
import { experience, lines, audioManifest } from "../src/lib/deadlock/content";
import { selectReaction } from "../src/lib/deadlock/dialogue";
import { policyRun } from "../scripts/deadlock-policies";
test("brief conclusions describe actual incidents, interventions and a bounded causal trail", () => {
  for (const name of ["INFORMED", "LEAN", "BOLD", "AVOIDANT"] as const) {
    const run = policyRun(name, 23),
      s = replay(run.events),
      r = runConclusion(s);
    assert.ok(r.title && r.summary);
    assert.ok(r.moments.length <= 3);
    if (s.run.incidents) assert.match(r.summary, /incident/);
    if (s.ending === "QUIET ROOM") assert.match(r.summary, /postponed/);
    assert.equal(run.events.length, policyRun(name, 23).events.length);
  }
});
test("team reaction is attributable to the locked plan, not later changes in resentment", () => {
  const s = replay(policyRun("INFORMED", 23).events),
    before = teamResponse(s);
  s.rob = 100;
  s.sw = 0;
  assert.deepEqual(teamResponse(s), before);
});
test("missing evidence has relevant nonrepeating prompts rather than a single repeated question", () => {
  for (const pool of Object.values(experience.evidencePrompts)) {
    assert.equal(pool.length, 2);
    assert.notEqual(
      selectReaction(pool, pool[0], () => 0),
      pool[0],
    );
  }
  assert.ok(!lines.some((l) => l.text === "Based on what?"));
});
test("approved Mara casting remains; refined voices carry honest offline direction metadata", () => {
  assert.equal(audioManifest.lines["INT-01"].voice, "af_heart");
  assert.equal(audioManifest.lines["LETTER-01"].voice, "af_bella");
  assert.equal(audioManifest.lines["EN-S1"].voice, "am_fenrir");
  assert.equal(audioManifest.lines["INT-03"].voice, "am_puck");
  for (const entry of Object.values(audioManifest.lines)) {
    assert.ok(entry.emotionTag);
    assert.ok(entry.delivery);
    assert.ok(!entry.caption?.includes("Point two two"));
  }
});
test("portraits have no speaking or blinking overlay and playback has no animation frame loop", () => {
  const stage = readFileSync("src/components/deadlock/Stage.tsx", "utf8"),
    runtime = readFileSync("src/components/deadlock/runtime.tsx", "utf8");
  assert.ok(!stage.includes("s.mouth"));
  assert.ok(!stage.includes("s.eyelid"));
  const audio = runtime.slice(runtime.indexOf("export function useAudio"));
  assert.ok(!audio.includes("requestAnimationFrame"));
  assert.ok(audio.includes("entry.signature"));
});
