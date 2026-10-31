import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  initialState,
  stepInCost,
  append,
  createRun,
  replay,
  forkRun,
} from "../src/lib/deadlock/engine";
import {
  experience,
  lines,
  line,
  audioManifest,
} from "../src/lib/deadlock/content";
import { chapterReviews } from "../src/lib/deadlock/reviews";
import { selectReaction } from "../src/lib/deadlock/dialogue";
test("reaction variation never repeats or returns an empty singleton pool", () => {
  for (const pool of [
    ...Object.values(experience.match),
    ...Object.values(experience.mismatch),
  ])
    for (const previous of pool) {
      const chosen = selectReaction(pool, previous, () => 0);
      assert.notEqual(chosen, previous);
      assert.ok(line(chosen));
    }
});
test("v2 voice coverage: every authored caption has an existing MP3 and amplitude envelope", () => {
  for (const l of lines) {
    const audio = audioManifest.lines[l.id];
    assert.equal(audio.status, "rendered", l.id);
    assert.equal(line(l.id).text, audio.caption, l.id);
    assert.equal(
      l.text.replace("{thing}", "The setting"),
      audio.caption,
      l.id + " authored script must match its recording",
    );
    assert.ok(audio.file && existsSync("public" + audio.file), l.id);
    assert.ok(audio.duration! > 0, l.id);
    assert.ok(
      audio.envelope!.some((n) => n > 0.1),
      l.id,
    );
  }
  assert.equal(
    new Set(
      ["Mara", "Dev", "Ines"].map(
        (s) =>
          Object.values(audioManifest.lines).find((l) => l.speaker === s)
            ?.voice,
      ),
    ).size,
    3,
  );
  assert.deepEqual(
    [...new Set(experience.lines.map((l) => l.expression))].sort(),
    ["annoyed", "approving", "neutral", "thinking"],
  );
});
test("corrected slowing/pausing costs are versioned; old saved runs and their forks keep original costs", () => {
  const legacy = append(createRun("test"), { type: "START", mode: "silent" }),
    modern = append(createRun("test"), {
      type: "START",
      mode: "silent",
      experienceVersion: 2,
    });
  assert.equal(stepInCost(replay(legacy.events), "pause"), 4);
  assert.equal(stepInCost(replay(legacy.events), "slow"), 6);
  assert.equal(stepInCost(replay(modern.events), "pause"), 6);
  assert.equal(stepInCost(replay(modern.events), "slow"), 4);
  const progressed = append(modern, { type: "ACK_SCENE", scene: "intro" });
  assert.equal(
    replay(forkRun(progressed, 1, "test").events).experienceVersion,
    2,
  );
});
test("guides and ordered review cards explain actions with no numeric ability score", () => {
  for (const g of Object.values(experience.guides)) {
    assert.ok(g.goal && g.doThis && g.watch);
    assert.ok(line(g.line));
  }
  const reviews = chapterReviews(initialState());
  assert.equal(reviews.length, 3);
  assert.deepEqual(
    reviews.map((r) => r.chapter),
    [1, 2, 3],
  );
  for (const r of reviews) {
    assert.ok(r.did && r.happened && r.try);
    assert.ok(["Strong", "Mixed", "Weak"].includes(r.verdict));
  }
  const cinematic = readFileSync(
    "src/components/deadlock/Cinematic.tsx",
    "utf8",
  );
  assert.ok(!cinematic.includes("useClock"));
  const runtime = readFileSync("src/components/deadlock/runtime.tsx", "utf8");
  assert.ok(!runtime.includes("speechSynthesis"));
  assert.ok(!runtime.includes("SpeechSynthesisUtterance"));
});
