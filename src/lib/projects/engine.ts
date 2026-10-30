import { getProject } from "./content";
import type { Project, ProjectRun, ProjectState } from "./types";
export const blankProjectDraft = () => ({
  choiceId: "",
  rationale: "",
  evidence: [] as string[],
  ranking: [] as string[],
});
export function createProjectRun(
  project: Project,
  ownerId: string,
): ProjectRun {
  const at = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ownerId,
    projectId: project.id,
    version: 1,
    revision: 0,
    chapter: 1,
    phase: "entrance",
    status: "active",
    state: Object.fromEntries(project.variables.map((v) => [v.id, v.initial])),
    flags: [],
    decisions: [],
    draft: blankProjectDraft(),
    includeNotes: false,
    entranceSeen: false,
    startedAt: at,
    updatedAt: at,
  };
}
export function projectDecisionIssue(run: ProjectRun): string | null {
  if (
    run.status !== "active" ||
    run.phase !== "decision" ||
    run.decisions.length !== run.chapter - 1
  )
    return "This chapter is not open for a new decision.";
  const p = getProject(run.projectId);
  if (!p) return "This campaign is unavailable.";
  const chapter = p.chapters[run.chapter - 1];
  const choice = chapter.choices.find((c) => c.id === run.draft.choiceId);
  if (!choice) return "Choose a direction before locking the chapter.";
  if (!run.draft.evidence.some((id) => ["0", "1", "2"].includes(id)))
    return "Inspect at least one evidence source before committing.";
  if (
    chapter.pattern === "rank" &&
    (run.draft.ranking.length !== chapter.evidence.length ||
      new Set(run.draft.ranking).size !== chapter.evidence.length ||
      run.draft.ranking.some((id) => !["0", "1", "2"].includes(id)))
  )
    return "Rank the evidence you will act on first.";
  return null;
}
export function lockProjectDecision(run: ProjectRun): ProjectRun {
  const issue = projectDecisionIssue(run);
  if (issue) throw Error(issue);
  const p = getProject(run.projectId)!;
  const choice = p.chapters[run.chapter - 1].choices.find(
    (c) => c.id === run.draft.choiceId,
  )!;
  const deltas = { ...choice.delta };
  const matched: number[] = [];
  const reactions = [choice.reaction];
  const constraints = [choice.constraint];
  let kind = choice.kind;
  p.rules.forEach((rule, index) => {
    if (
      rule.chapter === run.chapter &&
      run.flags.includes(rule.flag) &&
      (!rule.choice || rule.choice === choice.id) &&
      (!rule.variable || run.state[rule.variable] < (rule.below || 0))
    ) {
      matched.push(index);
      Object.entries(rule.delta).forEach(([key, value]) => {
        deltas[key] = (deltas[key] || 0) + value;
      });
      reactions.push(rule.reaction);
      constraints.push(rule.constraint);
      kind = rule.kind;
    }
  });
  const state: ProjectState = Object.fromEntries(
    p.variables.map((v) => [
      v.id,
      Math.max(0, Math.min(v.max, run.state[v.id] + (deltas[v.id] || 0))),
    ]),
  );
  const actual = Object.fromEntries(
    p.variables.map((v) => [v.id, state[v.id] - run.state[v.id]]),
  );
  const at = new Date().toISOString();
  return {
    ...run,
    state,
    flags: [...run.flags, choice.id],
    phase: "consequence",
    draft: blankProjectDraft(),
    updatedAt: at,
    decisions: [
      ...run.decisions,
      {
        chapter: run.chapter,
        choiceId: choice.id,
        label: choice.label,
        before: { ...run.state },
        after: { ...state },
        delta: actual,
        reaction: reactions.join(" "),
        kind,
        constraint: constraints.join(" "),
        ruleIds: matched,
        rationale: run.draft.rationale,
        evidence: [...run.draft.evidence],
        ranking: [...run.draft.ranking],
        at,
      },
    ],
  };
}
export function nextProjectChapter(run: ProjectRun): ProjectRun {
  if (
    run.status !== "active" ||
    run.phase !== "consequence" ||
    run.decisions.length !== run.chapter
  )
    throw Error("Lock the current chapter before moving forward.");
  return run.chapter === 3
    ? {
        ...run,
        phase: "debrief",
        status: "complete",
        completedAt: new Date().toISOString(),
      }
    : { ...run, chapter: run.chapter + 1, phase: "decision" };
}
export function projectArchetype(run: ProjectRun) {
  const p = getProject(run.projectId)!;
  if (p.id === "last-mile")
    return {
      label: "Three-way tension",
      definition:
        "Courier safety, restaurant loyalty and customer trust remain separate responsibilities; no single winner cancels the others.",
    };
  const votes = new Map<string, number>();
  run.decisions.forEach((d) => {
    const c = p.chapters[d.chapter - 1].choices.find(
      (c) => c.id === d.choiceId,
    )!;
    votes.set(c.archetype, (votes.get(c.archetype) || 0) + 1);
  });
  const last = run.decisions.at(-1);
  const tie = last
    ? p.chapters[last.chapter - 1].choices.find((c) => c.id === last.choiceId)!
        .archetype
    : p.archetypes[0].label;
  const label =
    [...votes].sort(
      (a, b) => b[1] - a[1] || Number(b[0] === tie) - Number(a[0] === tie),
    )[0]?.[0] || tie;
  return p.archetypes.find((a) => a.label === label)!;
}
export function replayProject(run: ProjectRun, chapter: number): ProjectRun {
  if (
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > 3 ||
    !run.decisions.some((d) => d.chapter === chapter)
  )
    throw Error("Choose a completed chapter to branch from.");
  const p = getProject(run.projectId)!;
  let fork = createProjectRun(p, run.ownerId);
  fork = {
    ...fork,
    entranceSeen: true,
    phase: "decision",
    parentRunId: run.id,
    branchChapter: chapter,
  };
  for (const d of run.decisions.filter((d) => d.chapter < chapter)) {
    fork.draft = {
      choiceId: d.choiceId,
      rationale: d.rationale,
      evidence: d.evidence,
      ranking: d.ranking,
    };
    fork = nextProjectChapter(lockProjectDecision(fork));
  }
  const original = run.decisions.find((d) => d.chapter === chapter)!;
  const alternative = p.chapters[chapter - 1].choices.find(
    (c) => c.id !== original.choiceId,
  )!;
  fork.draft = {
    choiceId: alternative.id,
    rationale: "",
    evidence: [...original.evidence],
    ranking: [...original.ranking],
  };
  return fork;
}
export function validProjectTrail(run: ProjectRun): boolean {
  try {
    const p = getProject(run.projectId);
    if (!p || run.version !== 1 || run.decisions.length > 3) return false;
    let check = createProjectRun(p, run.ownerId);
    check.phase = "decision";
    for (const d of run.decisions) {
      if (d.chapter !== check.chapter) return false;
      check.draft = {
        choiceId: d.choiceId,
        rationale: d.rationale,
        evidence: d.evidence,
        ranking: d.ranking,
      };
      check = lockProjectDecision(check);
      const locked = check.decisions.at(-1)!;
      for (const key of [
        "before",
        "after",
        "delta",
        "ruleIds",
        "reaction",
        "constraint",
        "kind",
        "label",
      ] as const)
        if (JSON.stringify(locked[key]) !== JSON.stringify(d[key]))
          return false;
      if (
        d.chapter < run.decisions.length ||
        (run.phase === "decision" && d.chapter < 3)
      )
        check = nextProjectChapter(check);
    }
    return (
      JSON.stringify(check.state) === JSON.stringify(run.state) &&
      JSON.stringify(check.flags) === JSON.stringify(run.flags) &&
      run.chapter >= 1 &&
      run.chapter <= 3 &&
      (run.phase === "debrief"
        ? run.decisions.length === 3 && run.status === "complete"
        : run.status !== "complete" &&
          run.chapter ===
            (run.phase === "consequence"
              ? run.decisions.length
              : run.decisions.length + 1))
    );
  } catch {
    return false;
  }
}
export function projectLogMarkdown(run: ProjectRun) {
  const p = getProject(run.projectId)!;
  return (
    `# ${p.title}\n\nSimulated campaign · authored content v1\n\n${projectArchetype(run).label}\n\n` +
    run.decisions
      .map(
        (d) =>
          `## Chapter ${d.chapter}: ${p.chapters[d.chapter - 1].title}\n\nDecision: ${d.label}\n\n${d.reaction}\n\nState: ${Object.entries(
            d.delta,
          )
            .map(([key, value]) => `${key} ${value >= 0 ? "+" : ""}${value}`)
            .join(
              ", ",
            )}\n\nLater constraint: ${d.constraint}\n\nRationale: ${d.rationale || "Not recorded"}`,
      )
      .join("\n\n")
  );
}
export function projectPracticeTarget(run: ProjectRun) {
  const p = getProject(run.projectId)!;
  const exposed = [...p.variables].sort(
    (a, b) =>
      ((b.bad ? 1 : -1) * (run.state[b.id] - b.initial)) / b.max -
      ((a.bad ? 1 : -1) * (run.state[a.id] - a.initial)) / a.max,
  )[0];
  const key = exposed.id;
  const category = /runway|budget|burn|financial/.test(key)
    ? "estimation"
    : /trust|loyalty|support|alignment|consensus|resentment/.test(key)
      ? "behavioral"
      : /stability|reliability|friction|fleet/.test(key)
        ? "ai-technical"
        : /audit|investigation/.test(key)
          ? "root-cause"
          : /media|sentiment|stock|rating/.test(key)
            ? "execution-metrics"
            : p.category;
  return {
    category,
    reason: `Revisit the tradeoff in ${exposed.label.toLowerCase()}. It is the most exposed change relative to your starting state, not a scored weakness.`,
  };
}
