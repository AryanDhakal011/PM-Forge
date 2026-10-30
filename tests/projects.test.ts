import test from "node:test";
import assert from "node:assert/strict";
import { projects, getProject } from "../src/lib/projects/content";
import {
  createProjectRun,
  lockProjectDecision,
  nextProjectChapter,
  replayProject,
  validProjectTrail,
  projectArchetype,
  projectLogMarkdown,
  projectDecisionIssue,
} from "../src/lib/projects/engine";
import { projectRunSchema } from "../src/lib/projects/schema";
import { safeNext } from "../src/lib/product/routes";
import type { Project, ProjectRun } from "../src/lib/projects/types";
import { stakeholderSignal } from "../src/lib/projects/presentation";
test("rising resentment reduces stakeholder capacity while rising trust increases it", () => {
  const pressure = { bad: true, max: 100 },
    trust = { bad: false, max: 100 };
  assert.ok(
    stakeholderSignal(pressure, 90).opacity <
      stakeholderSignal(pressure, 20).opacity,
  );
  assert.match(stakeholderSignal(pressure, 90).label, /Guarded/);
  assert.ok(
    stakeholderSignal(trust, 90).opacity > stakeholderSignal(trust, 20).opacity,
  );
  assert.match(stakeholderSignal(trust, 90).label, /Engaged/);
});
function decision(run: ProjectRun, id: string) {
  return lockProjectDecision({
    ...run,
    draft: {
      choiceId: id,
      rationale: "Test rationale",
      evidence: ["0", "1", "2"],
      ranking: ["0", "1", "2"],
    },
  });
}
test("commit readiness is shared by UI and engine and rejects invented evidence or incomplete ranking", () => {
  const p = getProject("feature-factory")!;
  let run = createProjectRun(p, "owner");
  run.phase = "decision";
  run.draft.choiceId = "c1-a";
  run.draft.evidence = ["invented"];
  assert.match(projectDecisionIssue(run)!, /evidence/);
  assert.throws(() => lockProjectDecision(run));
  run.draft.evidence = ["0"];
  run = nextProjectChapter(lockProjectDecision(run));
  run.draft.choiceId = "c2-a";
  run.draft.evidence = ["0"];
  run.draft.ranking = ["0", "1", "invented"];
  assert.match(projectDecisionIssue(run)!, /Rank/);
  assert.throws(() => lockProjectDecision(run));
  run.draft.ranking = ["0", "1", "2"];
  assert.equal(projectDecisionIssue(run), null);
});
function paths(p: Project) {
  return p.chapters[0].choices.flatMap((a) =>
    p.chapters[1].choices.flatMap((b) =>
      p.chapters[2].choices.map((c) => [a.id, b.id, c.id]),
    ),
  );
}
function simulate(p: Project, ids: string[]) {
  let run = createProjectRun(p, "owner");
  run.phase = "decision";
  run.entranceSeen = true;
  for (const id of ids) run = nextProjectChapter(decision(run, id));
  return run;
}
test("twelve unique three-chapter campaigns have explicit bounded state, authored evidence and distinct tradeoffs", () => {
  assert.equal(projects.length, 12);
  assert.equal(new Set(projects.map((p) => p.id)).size, 12);
  for (const p of projects) {
    assert.equal(p.chapters.length, 3);
    assert.ok(p.variables.length >= 4 && p.variables.length <= 7);
    assert.equal(
      new Set(p.variables.map((v) => v.id)).size,
      p.variables.length,
    );
    for (const ch of p.chapters) {
      assert.equal(ch.evidence.length, 3);
      assert.ok(ch.choices.length >= 2);
      assert.equal(
        new Set(ch.choices.map((c) => JSON.stringify(c.delta))).size,
        ch.choices.length,
      );
      for (const c of ch.choices) {
        assert.ok(c.cost && c.reaction && c.constraint);
        assert.deepEqual(
          Object.keys(c.delta),
          p.variables.map((v) => v.id),
        );
      }
    }
  }
});
for (const p of projects)
  test(`${p.title}: all ${paths(p).length} authored paths reach a coherent deterministic debrief and replay every branch`, () => {
    for (const ids of paths(p)) {
      const run = simulate(p, ids),
        again = simulate(p, ids);
      assert.equal(run.phase, "debrief");
      assert.equal(run.decisions.length, 3);
      assert.deepEqual(run.state, again.state);
      assert.equal(validProjectTrail(run), true);
      projectRunSchema.parse(run);
      assert.deepEqual(projectArchetype(run), projectArchetype(again));
      assert.match(projectLogMarkdown(run), /Later constraint/);
      p.variables.forEach((v) =>
        assert.ok(run.state[v.id] >= 0 && run.state[v.id] <= v.max),
      );
      for (let chapter = 1; chapter <= 3; chapter++) {
        const source = JSON.stringify(run),
          fork = replayProject(run, chapter);
        assert.notEqual(fork.id, run.id);
        assert.equal(fork.parentRunId, run.id);
        assert.equal(fork.decisions.length, chapter - 1);
        assert.deepEqual(
          fork.state,
          chapter === 1
            ? Object.fromEntries(p.variables.map((v) => [v.id, v.initial]))
            : run.decisions[chapter - 2].after,
        );
        assert.notEqual(
          fork.draft.choiceId,
          run.decisions[chapter - 1].choiceId,
        );
        assert.equal(JSON.stringify(run), source);
        assert.equal(validProjectTrail(fork), true);
        projectRunSchema.parse(fork);
      }
    }
  });
for (const p of projects)
  test(`${p.title}: paused, duplicate-lock and tampered-trail edge paths cannot silently mutate commitments`, () => {
    let run = createProjectRun(p, "owner");
    run.phase = "decision";
    assert.throws(() => lockProjectDecision({ ...run, status: "paused" }));
    assert.throws(() => lockProjectDecision(run));
    run = decision(run, p.chapters[0].choices[0].id);
    assert.throws(() => lockProjectDecision(run));
    assert.throws(() => nextProjectChapter({ ...run, status: "paused" }));
    const corrupt = structuredClone(run);
    corrupt.state[p.variables[0].id] =
      (corrupt.state[p.variables[0].id] + 1) % 100;
    assert.equal(projectRunSchema.safeParse(corrupt).success, false);
    const altered = structuredClone(run);
    altered.decisions[0].reaction = "Invented plot";
    assert.equal(projectRunSchema.safeParse(altered).success, false);
  });
test("Sacred No: accepting then exposing the live feature produces the exact carried crash; a guarded demo avoids that rule", () => {
  const p = getProject("sacred-no")!;
  const risky = simulate(p, ["c1-a", "c2-a", "c3-a"]),
    guarded = simulate(p, ["c1-a", "c2-b", "c3-b"]);
  assert.deepEqual(risky.decisions[0].delta, {
    founder_trust: 14,
    product_stability: -27,
    runway_weeks: -2,
    board_confidence: 9,
    political_capital: -8,
  });
  assert.ok(risky.decisions[2].ruleIds.includes(1));
  assert.match(risky.decisions[2].reaction, /fails during the demo/);
  assert.equal(guarded.decisions[2].ruleIds.includes(1), false);
  assert.ok(guarded.state.product_stability > risky.state.product_stability);
});
test("every named archetype is reachable by a real authored path", () => {
  for (const p of projects.filter((p) => p.id !== "last-mile")) {
    const seen = new Set(
      paths(p).map((ids) => projectArchetype(simulate(p, ids)).label),
    );
    assert.deepEqual(seen, new Set(p.archetypes.map((a) => a.label)), p.id);
  }
});
test("project deep links remain local and malformed chapter paths cannot become redirects", () => {
  for (const p of [
    "/app/projects",
    "/app/projects/sacred-no",
    "/app/projects/sacred-no/c/2",
    "/app/projects/sacred-no/run/abc-123",
    "/app/projects/debrief/abc-123",
  ])
    assert.equal(safeNext(p), p);
  assert.equal(safeNext("/app/projects/sacred-no/c/99"), "/app");
  assert.equal(safeNext("//evil.example/app/projects"), "/app");
});
