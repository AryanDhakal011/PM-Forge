import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  openingSequence,
  guideGroups,
  guideCard,
  chooseVariant,
  remainingActions,
  currentCost,
  type VariantHistory,
} from "../src/lib/ghost-metric/presentation";
import { initial, reduce, type State } from "../src/lib/ghost-metric/engine";
import { conversation, lines } from "../src/lib/ghost-metric/dialogue";
test("briefing introduces four owners, the role, all resources and the suspicion before drawers", () => {
  const opening = openingSequence();
  assert.deepEqual(
    new Set(opening.map((l) => l.speaker)),
    new Set(["Elena", "Ravi", "Marcus", "Joyce"]),
  );
  const text = opening.map((l) => l.text).join(" ");
  for (const phrase of [
    "Platform Growth PM",
    "three days",
    "Twelve audit hours",
    "presentation prep",
    "Credibility",
    "Billing and AMC",
  ])
    assert.ok(text.includes(phrase), phrase);
  assert.ok(!text.includes("probably nothing"));
  assert.ok(conversation("invitation")[0].text.includes("probably nothing"));
});
test("every first-use guide has recorded spoken teaching and three clear reference labels", () => {
  const manifest = JSON.parse(
    readFileSync("content/projects/ghost-metric/audio-manifest.json", "utf8"),
  );
  for (const [key, group] of Object.entries(guideGroups)) {
    const card = guideCard(key)!;
    assert.ok(card.goal && card.do && card.watch, key);
    const rows = conversation(group);
    assert.ok(rows.length >= 1 && rows.length <= 2, group);
    for (const row of rows) {
      assert.equal(manifest.lines[row.id]?.caption, row.text);
      assert.ok(existsSync("public" + manifest.lines[row.id].file));
    }
    for (const suffix of ["V2", "V3"])
      assert.ok(
        conversation(group + suffix).length,
        group + " lacks " + suffix,
      );
  }
});
test("paraphrases never repeat either of the previous two variants, and remain deterministic", () => {
  for (const group of [
    ...Object.values(guideGroups),
    "fixed",
    "wrongJoin",
    "estimated",
  ]) {
    const history: VariantHistory = {},
      recent: string[] = [];
    for (let n = 0; n < 15; n++) {
      const id = chooseVariant(group, history)[0].id;
      assert.ok(!recent.includes(id), group);
      recent.push(id);
      if (recent.length > 2) recent.shift();
      assert.ok(history[group].length <= 2);
    }
  }
  assert.deepEqual(chooseVariant("fixed", {}), chooseVariant("fixed", {}));
});
test("malformed variant preferences do not break a guide", () => {
  assert.ok(
    chooseVariant("fixed", { fixed: null } as unknown as VariantHistory).length,
  );
  assert.deepEqual(chooseVariant("unknown", {}), []);
});
test("remaining-action text reflects affordable drawers, sequencing and exhausted fix hours", () => {
  let s = reduce(reduce(initial(), { type: "OPEN" }), {
    type: "CLASSIFY",
    counts: false,
  });
  assert.match(remainingActions(s), /up to 5 more drawers/);
  s = reduce(s, { type: "DRAWER", id: "gateway" });
  assert.match(remainingActions(s), /up to 4 more drawers/);
  assert.match(remainingActions({ ...s, AH: 0 }), /hours are spent/);
  assert.match(
    remainingActions({ ...s, scene: "stakeholders" }),
    /choose who hears/,
  );
  assert.match(
    remainingActions({
      ...s,
      scene: "redteam",
      fixHours: 2,
      loopholes: ["dedupe", "quality"],
    }),
    /2 fix hours.*2 known/,
  );
  assert.match(currentCost(s), /join 1h/);
});
test("all regional Ravi clips use the recast; captions match every referenced file", () => {
  const manifest = JSON.parse(
    readFileSync("content/projects/ghost-metric/audio-manifest.json", "utf8"),
  );
  for (const line of lines) {
    const clip = manifest.lines[line.id];
    assert.equal(clip.caption, line.text);
    assert.ok(existsSync("public" + clip.file));
    if (line.speaker === "Ravi")
      assert.equal(clip.voice, "en-IN-PrabhatNeural");
  }
  const wav = readFileSync("public/ghost-metric/audio/lab-ambient.wav");
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.toString("ascii", 8, 12), "WAVE");
  assert.ok(wav.length > 100000);
});
