import { categoryOf, evidenceBudget, getQuestion, RCA_CUTS } from "./content";
import { getDials, sanityRatio } from "./estimation";
import type { Question, Run, RunStage } from "./types";
import { readinessBand } from "./readiness";

export const guidedStages: RunStage[] = [
  "primer",
  "workbench",
  "event",
  "synthesis",
  "feedback",
  "reflection",
  "expert",
  "complete",
];
export const stagesFor = (run: Run) => (run.guided ? guidedStages : STAGES);

export const STAGES: RunStage[] = [
  "primer",
  "fundamentals",
  "clarify",
  "investigate",
  "workbench",
  "event",
  "synthesis",
  "feedback",
  "replay",
  "reflection",
  "expert",
  "complete",
];
export const stageLabel: Record<RunStage, string> = {
  primer: "Preflight",
  fundamentals: "Warm-up",
  clarify: "Pin the goal",
  investigate: "Evidence desk",
  workbench: "Your workbench",
  event: "Interviewer pushback",
  synthesis: "Make the call",
  feedback: "Your feedback",
  replay: "Decision replay",
  reflection: "Calibrate",
  expert: "Expert reasoning",
  complete: "Next move",
};
export const blankSynthesis = () => ({
  decision: "",
  evidenceId: "",
  tradeoff: "",
  notDoing: "",
  metric: "",
  guardrail: "",
  stopRule: "",
  note: "",
});
export const eventTypes = (q: Question) =>
  q.level === "hard"
    ? ["pivot", "probe", "probe", "pushback"]
    : q.level === "medium"
      ? ["probe", "pushback"]
      : ["pushback"];
export function createRun(q: Question, ownerId: string, seed = 0): Run {
  const at = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ownerId,
    questionId: q.id,
    contentVersion: q.version,
    seed: seed % 3,
    revision: 0,
    stage: "primer",
    status: "active",
    startedAt: at,
    updatedAt: at,
    evidenceIds: q.evidence.filter((e) => !e.cost).map((e) => e.id),
    decisions: [],
    locked: [],
    objectivePinned: false,
    choiceId: "",
    rank: (RCA_CUTS[q.id]?.hypotheses || q.choices.map((c) => c.label))
      .slice()
      .reverse(),
    segment: "",
    dials: Object.fromEntries(getDials(q.id).map((d) => [d.id, d.value])),
    unitConfirmed: false,
    metrics: { primary: "", guardrail: "", test: "" },
    architecture: [],
    story: {
      stakes: "",
      actions: ["", "", ""],
      result: "",
      learning: "",
      later: "",
      observable: false,
      ownership: false,
    },
    eventResponse: "",
    eventIndex: 0,
    synthesis: blankSynthesis(),
    reflection: {},
    reflectionNote: "",
    fundamentals: {},
    elapsedSeconds: 0,
    pressureSeconds: null,
    spoken: { seconds: 0, structure: false, clarity: false, skipped: false },
  };
}
export const spentEvidence = (run: Run, q: Question) =>
  q.evidence
    .filter((e) => run.evidenceIds.includes(e.id))
    .reduce((sum, e) => sum + e.cost, 0);
export const remainingEvidence = (run: Run, q: Question) =>
  evidenceBudget(q.level) - spentEvidence(run, q);
export function requestEvidence(run: Run, id: string): Run {
  const q = getQuestion(run.questionId)!;
  const card = q.evidence.find((e) => e.id === id);
  if (
    !card ||
    !run.objectivePinned ||
    run.evidenceIds.includes(id) ||
    remainingEvidence(run, q) < card.cost ||
    run.locked.includes("synthesis")
  )
    return run;
  return {
    ...run,
    evidenceIds: [...run.evidenceIds, id],
    decisions: [
      ...run.decisions,
      {
        stage: run.stage,
        action: "Evidence requested",
        value: id,
        at: new Date().toISOString(),
      },
    ],
  };
}
export function stageIssue(run: Run): string | null {
  const q = getQuestion(run.questionId)!;
  switch (run.stage) {
    case "fundamentals":
      return Object.keys(run.fundamentals).length < 3
        ? "Choose a response for each warm-up question."
        : null;
    case "clarify":
      return !run.objectivePinned
        ? "Pin the objective before proposing a solution."
        : null;
    case "workbench":
      if (!run.choiceId) return "Choose the path you want to defend.";
      if (q.category === "root-cause" && !run.segment)
        return "Choose a segment to compare.";
      if (q.category === "estimation" && !run.unitConfirmed)
        return "Confirm the output unit of your estimate.";
      if (
        ["execution-metrics", "product-sense"].includes(q.category) &&
        (!run.metrics.primary || !run.metrics.guardrail || !run.metrics.test)
      )
        return "Complete the primary metric, guardrail, and test design.";
      if (q.category === "ai-technical" && run.architecture.length < 2)
        return "Connect at least two components to the system.";
      if (q.category === "strategy" && !run.segment)
        return "Choose the initial market scope you want to defend.";
      if (q.category === "product-sense" && !run.architecture.length)
        return "Set one idea aside before committing to the first version.";
      if (
        q.category === "product-sense" &&
        run.architecture.includes(run.choiceId)
      )
        return "Choose a direction you have not set aside, or reconsider the cut.";
      return null;
    case "event":
      return !run.eventResponse
        ? "Choose how you will respond to the interviewer."
        : null;
    case "synthesis":
      if (
        !run.spoken ||
        (!run.spoken.skipped &&
          (run.spoken.seconds < 90 ||
            !run.spoken.structure ||
            !run.spoken.clarity))
      )
        return "Finish the 90-second spoken rep and self-check, or choose the text/accessibility path.";
      return Object.entries(run.synthesis).some(
        ([key, value]) => key !== "note" && !value,
      )
        ? "Complete each decision card, including evidence and a stop rule."
        : null;
    case "reflection":
      return !Object.keys(run.reflection).length &&
        !(
          run.reflectionStartedAt &&
          Date.now() - Date.parse(run.reflectionStartedAt) >= 120_000
        )
        ? "Give a self-grade, or take up to two minutes to reflect."
        : null;
    default:
      return null;
  }
}
export function advance(run: Run): Run {
  if (stageIssue(run)) return run;
  const q = getQuestion(run.questionId)!;
  const stages = stagesFor(run);
  let next = stages[stages.indexOf(run.stage) + 1] || "complete";
  if (next === "fundamentals" && q.level !== "easy") next = "clarify";
  const at = new Date().toISOString();
  if (run.stage === "event" && run.eventIndex < eventTypes(q).length - 1)
    return {
      ...run,
      eventIndex: run.eventIndex + 1,
      eventResponse: "",
      decisions: [
        ...run.decisions,
        {
          stage: "event",
          action: `Locked ${eventTypes(q)[run.eventIndex]}`,
          value: run.eventResponse,
          at,
        },
      ],
    };
  const complete = next === "feedback" || run.status === "complete";
  return {
    ...run,
    stage: next,
    objectivePinned:
      run.objectivePinned || (!!run.guided && run.stage === "primer"),
    reflectionStartedAt: next === "reflection" ? at : run.reflectionStartedAt,
    reflectionCompletedAt:
      run.stage === "reflection" && Object.keys(run.reflection).length
        ? at
        : run.reflectionCompletedAt,
    reflectionTimedOut:
      run.stage === "reflection"
        ? !Object.keys(run.reflection).length
        : run.reflectionTimedOut,
    status: complete ? "complete" : "active",
    completedAt: complete ? run.completedAt || at : undefined,
    locked: [...new Set([...run.locked, run.stage])],
    decisions: [
      ...run.decisions,
      {
        stage: run.stage,
        action: `Locked ${stageLabel[run.stage]}`,
        value:
          run.stage === "workbench"
            ? run.choiceId
            : run.stage === "event"
              ? run.eventResponse
              : run.stage === "synthesis"
                ? run.synthesis.decision
                : "Continue",
        at,
      },
    ],
  };
}
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
export function scoreRun(run: Run, q: Question = getQuestion(run.questionId)!) {
  const choice = q.choices.find((c) => c.id === run.choiceId);
  const adjusted =
    run.eventResponse === "adjust" ||
    run.decisions.some((d) => d.stage === "event" && d.value === "adjust");
  const finalChoice = q.choices.find(
    (candidate) => candidate.id === run.synthesis.decision,
  );
  const quality = Math.min(
    adjusted ? 90 : (choice?.quality ?? 0),
    finalChoice?.quality ?? 100,
  );
  const evidence = q.evidence.filter(
    (e) => run.evidenceIds.includes(e.id) && e.discriminating,
  );
  const needed = Math.min(
    3,
    Math.max(1, q.evidence.filter((e) => e.discriminating).length),
  );
  const validation = clamp((evidence.length / needed) * 100);
  const pin = run.objectivePinned ? 100 : 0;
  const synthesis = run.synthesis;
  const linked = evidence.some((e) => e.id === synthesis.evidenceId) ? 100 : 0;
  const guardrail =
    synthesis.guardrail && synthesis.guardrail !== "none"
      ? (run.seed === 1 && synthesis.guardrail !== "trust") ||
        (run.seed === 2 && synthesis.guardrail !== "retention")
        ? 35
        : 100
      : 0;
  const tradeoff = synthesis.tradeoff && synthesis.notDoing ? 100 : 0;
  const outcomeMetric =
    run.metrics.primary === "outcome" || synthesis.metric === "outcome"
      ? 100
      : run.metrics.primary === "revenue"
        ? 65
        : 25;
  const test =
    run.metrics.test === "controlled"
      ? 100
      : run.metrics.test === "staged"
        ? 90
        : 30;
  let values: Record<string, number> = {};
  switch (q.category) {
    case "root-cause": {
      const hypotheses = RCA_CUTS[q.id]?.hypotheses;
      const ranked = hypotheses
        ? run.rank[0] === hypotheses[0]
          ? 100
          : run.rank[1] === hypotheses[0]
            ? 70
            : 35
        : quality;
      const first = run.evidenceIds.find((id) =>
        q.evidence.some((e) => e.id === id && e.cost > 0),
      );
      const efficient =
        first && q.evidence.find((e) => e.id === first)?.discriminating
          ? 100
          : 70;
      values = {
        segmentation:
          run.segment === "target" ? validation : run.segment ? 35 : 0,
        ranking: ranked,
        efficiency: validation * 0.65 + efficient * 0.35,
        logic: quality * 0.6 + linked * 0.25 + guardrail * 0.15,
      };
      break;
    }
    case "estimation":
      values = {
        structure: quality * 0.65 + pin * 0.15 + validation * 0.2,
        sanity:
          sanityRatio(run) * 80 + (run.eventResponse !== "insist" ? 20 : 0),
        calculation: run.unitConfirmed ? 100 : 0,
        communication: tradeoff * 0.6 + (synthesis.stopRule ? 40 : 0),
      };
      break;
    case "strategy":
      values = {
        goal: pin * 0.5 + quality * 0.5,
        focus:
          quality * 0.5 + tradeoff * 0.3 + (run.segment === "broad" ? 10 : 20),
        evidence: validation * 0.6 + linked * 0.4,
        feasibility: quality * 0.6 + guardrail * 0.4,
      };
      break;
    case "execution-metrics":
      values = {
        validation,
        precision: outcomeMetric,
        guardrail:
          guardrail * 0.7 + (run.metrics.guardrail !== "none" ? 30 : 0),
        next: test * 0.6 + (synthesis.stopRule ? 40 : 0),
      };
      break;
    case "ai-technical":
      values = {
        alignment: quality * 0.6 + pin * 0.4,
        tradeoff: quality * 0.5 + tradeoff * 0.5,
        feasibility:
          run.architecture.includes("monitor") &&
          run.architecture.includes("guardrail")
            ? 100
            : 60,
        validation:
          validation * 0.4 + guardrail * 0.3 + (synthesis.stopRule ? 30 : 0),
      };
      break;
    case "behavioral": {
      const s = run.story;
      const actions = s.actions.filter((a) => /^I\s+\w+/i.test(a.trim()));
      values = {
        ownership: Math.min(75, actions.length * 25) + (s.ownership ? 25 : 0),
        results: s.result.trim() ? (s.observable ? 100 : 55) : 0,
        learning: s.learning.trim() ? (s.later.trim() ? 100 : 55) : 0,
        situation: s.stakes.trim() ? 100 : 0,
      };
      break;
    }
    case "product-sense":
      values = {
        framing: pin * 0.45 + quality * 0.55,
        insight: validation * 0.65 + linked * 0.35,
        priority:
          quality * 0.5 + tradeoff * 0.25 + (run.architecture.length ? 25 : 0),
        solution: quality * 0.5 + outcomeMetric * 0.5,
        tradeoff,
      };
      break;
  }
  const writtenActions = run.story.actions.filter((action) => action.trim());
  const behavioralTrap =
    q.category === "behavioral" &&
    writtenActions.length > 0 &&
    writtenActions.every((action) => !/^I\s+/i.test(action.trim()));
  const unresolvedTrap =
    (!!choice?.trap && !adjusted) || !!finalChoice?.trap || behavioralTrap;
  const dimensions = q.dimensions.map((d) => ({
    ...d,
    score: unresolvedTrap
      ? Math.min(50, clamp(values[d.id] || 0))
      : clamp(values[d.id] || 0),
  }));
  const total = clamp(
    dimensions.reduce((sum, d) => sum + (d.score * d.weight) / 100, 0),
  );
  const lowest = dimensions.reduce((a, b) => (a.score <= b.score ? a : b));
  const band = readinessBand(total);
  const self = Object.keys(run.reflection).length
    ? q.dimensions.reduce(
        (sum, d) => sum + ((run.reflection[d.id] || 1) * 25 * d.weight) / 100,
        0,
      )
    : null;
  return {
    total,
    band,
    dimensions,
    lowest,
    trap: unresolvedTrap ? "fell" : choice?.trap ? "recovered" : "bypassed",
    calibration: self === null ? null : Math.round(self - total),
    structureBased: q.category === "behavioral",
    pivotStage: finalChoice?.trap ? "synthesis" : "workbench",
  };
}
export const fundamentalQuestions = [
  {
    id: "unit",
    question: "Before acting on a movement, which check is most useful?",
    options: [
      "Confirm the definition, population, and time window",
      "Choose the fastest fix",
      "Match what the last company did",
    ],
  },
  {
    id: "evidence",
    question: "What makes a useful piece of evidence?",
    options: [
      "It separates competing explanations",
      "It supports the first idea",
      "It is the largest number on the dashboard",
    ],
  },
  {
    id: "tradeoff",
    question: "What belongs in a defensible recommendation?",
    options: [
      "A trade-off and a condition for changing course",
      "Only the best-case outcome",
      "A list of every possible feature",
    ],
  },
];
export const METRICS = [
  { id: "outcome", label: "A defined user outcome in the affected cohort" },
  { id: "revenue", label: "Revenue per eligible customer" },
  { id: "activity", label: "Total activity across all users" },
];
export const GUARDRAILS = [
  { id: "trust", label: "Errors, complaints, and user trust" },
  { id: "retention", label: "Cohort retention and repeat success" },
  { id: "none", label: "No guardrail; optimise only the headline" },
];
export const TESTS = [
  {
    id: "controlled",
    label: "Matched control or holdout with a decision threshold",
  },
  { id: "staged", label: "Staged rollout with monitoring and a rollback rule" },
  { id: "before-after", label: "Compare the next day with the previous day" },
];
