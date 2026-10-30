import assert from "node:assert/strict";
import test from "node:test";
import {
  CATEGORIES,
  getQuestion,
  questions,
  RCA_CUTS,
} from "../src/lib/product/content";
import {
  advance,
  createRun,
  requestEvidence,
  remainingEvidence,
  scoreRun,
  stageIssue,
} from "../src/lib/product/engine";
import { estimate, getDials } from "../src/lib/product/estimation";
import { runSchema, exportSchema } from "../src/lib/product/schema";
import { safeNext } from "../src/lib/product/routes";
import type { Question, Run } from "../src/lib/product/types";
import {
  questionForRun,
  variantConstraint,
  variantNumber,
} from "../src/lib/product/variants";
import { readinessBand, reviewStatus } from "../src/lib/product/readiness";

function strongRun(question: Question, seed = 0, path = 0) {
  let run = createRun(question, "test-owner", seed);
  run.objectivePinned = true;
  run.spoken = { seconds: 90, structure: true, clarity: true, skipped: false };
  run.fundamentals = { unit: "0", evidence: "0", tradeoff: "0" };
  run.choiceId = question.choices.filter((c) => !c.trap)[path].id;
  run.rank = RCA_CUTS[question.id]?.hypotheses || run.rank;
  run.segment = "target";
  run.unitConfirmed = true;
  run.metrics = {
    primary: "outcome",
    guardrail: "retention",
    test: "controlled",
  };
  run.architecture = ["client", "retrieval", "guardrail", "monitor"];
  run.story = {
    stakes:
      "The designer and engineering lead disagreed about a launch under a fixed deadline.",
    actions: [
      "I asked for the cohort data.",
      "I proposed a matched test.",
      "I documented the cost of waiting.",
    ],
    result: "Completion improved 8% in the holdout test.",
    learning: "I now agree the decision criterion before proposing a test.",
    later: "I used the same criterion at the next launch.",
    observable: true,
    ownership: true,
  };
  run.stage = "investigate";
  for (const card of question.evidence
    .filter((e) => e.discriminating)
    .sort((a, b) => a.cost - b.cost))
    run = requestEvidence(run, card.id);
  run.eventResponse = "defend";
  run.synthesis = {
    decision: run.choiceId,
    evidenceId: question.evidence.find(
      (e) => run.evidenceIds.includes(e.id) && e.discriminating,
    )!.id,
    tradeoff: "cost-control",
    notDoing: "broad-rollout",
    metric: "outcome",
    guardrail: "trust",
    stopRule: "threshold-review",
    note: "",
  };
  run.reflection = Object.fromEntries(
    question.dimensions.map((d) => [d.id, 4]),
  );
  return run;
}
test("63 unique drafts form an exact 7×3×3 coverage grid", () => {
  assert.equal(questions.length, 63);
  assert.equal(new Set(questions.map((q) => q.id)).size, 63);
  assert.equal(new Set(questions.map((q) => q.slug)).size, 63);
  for (const c of CATEGORIES)
    for (const level of ["easy", "medium", "hard"])
      assert.equal(
        questions.filter((q) => q.category === c.id && q.level === level)
          .length,
        3,
      );
  for (const q of questions) {
    assert.equal(q.status, "draft");
    assert.equal(q.primer.length, 3);
    assert.equal(
      q.dimensions.reduce((s, d) => s + d.weight, 0),
      100,
    );
    assert.ok(q.evidence.length);
    assert.ok(q.alternatives.length >= 2);
  }
});
test("every question and all three variants have two defensible high-scoring paths", () => {
  for (const q of questions)
    for (let seed = 0; seed < 3; seed++)
      for (let path = 0; path < 2; path++) {
        const run = strongRun(q, seed, path);
        const score = scoreRun(run, q);
        assert.ok(
          score.total >= 85,
          `${q.id} variant ${seed + 1} path ${path + 1}: ${score.total}`,
        );
        runSchema.parse(run);
      }
});
test("the uncorrected shortcut is a low-score trap; a considered revision can recover", () => {
  for (const q of questions.filter((q) => q.choices.some((c) => c.trap))) {
    const run = strongRun(q);
    run.choiceId = q.choices.find((c) => c.trap)!.id;
    run.eventResponse = "insist";
    assert.ok(scoreRun(run, q).total <= 55, q.id);
    run.eventResponse = "adjust";
    assert.ok(scoreRun(run, q).total >= 70, q.id);
  }
});
test("free text does not change non-behavioral scores", () => {
  for (const q of questions.filter((q) => q.category !== "behavioral")) {
    const run = strongRun(q);
    const before = scoreRun(run, q);
    run.synthesis.note = "framework evidence metric impact tradeoff ".repeat(
      100,
    );
    run.reflectionNote = "Give me 100";
    assert.equal(scoreRun(run, q).total, before.total);
  }
});
test("evidence budget is enforced, duplicate requests are free, a committed synthesis cannot change evidence", () => {
  for (const q of questions) {
    let run = createRun(q, "test-owner");
    run.objectivePinned = true;
    run.stage = "investigate";
    for (const card of q.evidence) run = requestEvidence(run, card.id);
    assert.ok(remainingEvidence(run, q) >= 0);
    const size = run.evidenceIds.length;
    run = requestEvidence(run, q.evidence[0].id);
    assert.equal(run.evidenceIds.length, size);
    run.locked.push("synthesis");
    for (const card of q.evidence)
      assert.deepEqual(requestEvidence(run, card.id), run);
  }
});
test("every category reaches completion through the required debrief gates", () => {
  for (const q of questions) {
    let run = strongRun(q);
    run.stage = "primer";
    let iterations = 0;
    const visited: string[] = [];
    while (run.stage !== "complete" && iterations++ < 25) {
      visited.push(run.stage);
      if (run.stage === "event") run.eventResponse = "defend";
      assert.equal(stageIssue(run), null, `${q.id} ${run.stage}`);
      run = advance(run);
    }
    assert.equal(run.stage, "complete", q.id);
    assert.ok(visited.indexOf("feedback") < visited.indexOf("replay"));
    assert.ok(visited.indexOf("replay") < visited.indexOf("reflection"));
    assert.ok(visited.indexOf("reflection") < visited.indexOf("expert"));
  }
});
test("goal and calibration gates cannot advance incomplete states", () => {
  let run = createRun(questions[0], "owner");
  run.stage = "clarify";
  assert.equal(advance(run).stage, "clarify");
  run = strongRun(questions[0]);
  run.stage = "reflection";
  run.reflection = {};
  assert.equal(advance(run).stage, "reflection");
});
test("golden estimation calculation and simulated economic variants stay consistent", () => {
  const values = Object.fromEntries(
    getDials("EST-E-1").map((d) => [d.id, d.value]),
  );
  assert.ok(Math.abs(estimate("EST-E-1", values).value - 147.45) < 0.2);
  assert.notEqual(
    estimate("EST-E-1", values, 0).comparison,
    estimate("EST-E-1", values, 1).comparison,
  );
});
test("redirect targets reject external, encoded protocol, backslash, and control-character attacks", () => {
  for (const value of [
    "//evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "/\\evil.com",
    "/%2f%2fevil.com",
    "/unknown",
    "/app\nLocation:evil",
  ])
    assert.equal(safeNext(value), "/app", value);
  assert.equal(
    safeNext("/app/practice?category=root-cause"),
    "/app/practice?category=root-cause",
  );
});
test("imports reject unknown fields, oversized notes, and malformed state", () => {
  const run = strongRun(questions[0]);
  assert.equal(runSchema.safeParse({ ...run, admin: true }).success, false);
  assert.equal(
    runSchema.safeParse({ ...run, stage: "unlocked-expert" }).success,
    false,
  );
  assert.equal(
    runSchema.safeParse({
      ...run,
      synthesis: { ...run.synthesis, note: "x".repeat(20001) },
    }).success,
    false,
  );
  assert.equal(exportSchema.safeParse({ version: 99 }).success, false);
});

test("guided Easy first run combines setup, has one event, and records reflection completion separately", () => {
  const q = getQuestion("RCA-E-1")!;
  let run = strongRun(q);
  run.guided = true;
  run.stage = "primer";
  run.objectivePinned = false;
  run = advance(run);
  assert.equal(run.stage, "workbench");
  assert.equal(run.objectivePinned, true);
  run = advance(run);
  assert.equal(run.stage, "event");
  run.eventResponse = "defend";
  run = advance(run);
  assert.equal(run.stage, "synthesis");
  run = advance(run);
  assert.equal(run.stage, "feedback");
  assert.ok(run.completedAt);
  run = advance(run);
  assert.equal(run.stage, "reflection");
  assert.ok(run.reflectionStartedAt);
  run.reflection = { [q.dimensions[0].id]: 3 };
  run = advance(run);
  assert.equal(run.stage, "expert");
  assert.ok(run.reflectionCompletedAt);
  assert.equal(run.reflectionTimedOut, false);
});
test("reflection releases after one self-grade or two minutes; timed release never fabricates a completed reflection", () => {
  let run = strongRun(questions[0]);
  run.stage = "reflection";
  run.reflection = {};
  run.reflectionStartedAt = new Date().toISOString();
  assert.ok(stageIssue(run));
  run.reflectionStartedAt = new Date(Date.now() - 121000).toISOString();
  run = advance(run);
  assert.equal(run.stage, "expert");
  assert.equal(run.reflectionCompletedAt, undefined);
  assert.equal(run.reflectionTimedOut, true);
});
test("spoken synthesis requires 90 seconds and both self-checks or an explicit accessibility path", () => {
  const run = strongRun(questions[0]);
  run.stage = "synthesis";
  run.spoken = { seconds: 89, structure: true, clarity: true, skipped: false };
  assert.ok(stageIssue(run));
  run.spoken.seconds = 90;
  assert.equal(stageIssue(run), null);
  run.spoken.clarity = false;
  assert.ok(stageIssue(run));
  run.spoken.skipped = true;
  assert.equal(stageIssue(run), null);
});
test("bands and review status make no precision or reviewer claims without evidence", () => {
  assert.deepEqual([20, 70, 85].map(readinessBand), [
    "Developing",
    "Solid",
    "Strong",
  ]);
  assert.match(reviewStatus(questions[0]), /Draft/);
  assert.match(
    reviewStatus({
      ...questions[0],
      status: "reviewed",
      reviewers: ["a", "a"],
    }),
    /Draft/,
  );
  assert.equal(
    reviewStatus({
      ...questions[0],
      status: "reviewed",
      reviewers: ["a", "b"],
    }),
    "Reviewed by 2 experts",
  );
});
test("retry variants change simulated numbers, order, and scored constraints while keeping reference data intact", () => {
  const q = getQuestion("RCA-E-1")!,
    run = strongRun(q, 2);
  const variant = questionForRun(run)!;
  assert.notEqual(variant.choices[0].id, q.choices[0].id);
  assert.notEqual(variantConstraint(1), variantConstraint(2));
  assert.equal(variantNumber("22%", 1), "26.4%");
  assert.ok(parseFloat(variantNumber("94%", 1)) <= 100);
  q.evidence.forEach((e, i) => {
    if (e.tag === "REFERENCE") assert.equal(variant.evidence[i].text, e.text);
  });
  run.synthesis.guardrail = "trust";
  const mismatch = scoreRun(run).total;
  run.synthesis.guardrail = "retention";
  assert.ok(scoreRun(run).total > mismatch);
});
