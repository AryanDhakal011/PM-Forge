export type CriterionId =
  | "problem"
  | "evidence"
  | "prioritization"
  | "impact"
  | "measurement"
  | "risks"
  | "clarity";

export type Criterion = {
  id: CriterionId;
  label: string;
  shortLabel: string;
  score: number;
  feedback: string;
  prompt: string;
};

export type Evaluation = {
  overall: number;
  band: "Starting point" | "Developing" | "Strong" | "Interview-ready";
  criteria: Criterion[];
  strength: string;
  missing: Criterion;
  improvement: string;
  outline: string[];
  words: number;
  method: "local-rubric";
};

type CriterionDefinition = {
  id: CriterionId;
  label: string;
  shortLabel: string;
  keywords: RegExp;
  feedback: { low: string; mid: string; high: string };
  prompt: string;
};

const CRITERIA: CriterionDefinition[] = [
  {
    id: "problem",
    label: "Problem framing",
    shortLabel: "Framing",
    keywords:
      /\b(problem|user|customer|segment|cohort|funnel|drop|increase|decrease|why|hypothesis|investigate|scope|behaviour|behavior|mobile|android|checkout|payment|activation|onboarding)\b/gi,
    feedback: {
      low: "Name the user, the behaviour that changed, and the boundary of the problem before proposing a fix.",
      mid: "The problem is visible, but the boundary could be sharper. Say who is affected and where the drop concentrates.",
      high: "You framed a bounded, user-specific problem and made the investigation concrete.",
    },
    prompt: "What exactly changed, for whom, and where in the journey?",
  },
  {
    id: "evidence",
    label: "Evidence & assumptions",
    shortLabel: "Evidence",
    keywords:
      /\b(data|metric|analytics|evidence|error|release|support|ticket|interview|session|conversion|funnel|segment|android|ios|payment|provider|telemetry|log|correlat|baseline|sample)\b/gi,
    feedback: {
      low: "Separate what you know from what you are assuming. Name the evidence you would inspect first.",
      mid: "You reference evidence, but the assumption underneath it is still implicit. Say what would prove you wrong.",
      high: "You separated measured evidence from assumptions and named the check that would change your mind.",
    },
    prompt: "Which evidence is measured, and which part is still an assumption?",
  },
  {
    id: "prioritization",
    label: "Prioritization & trade-offs",
    shortLabel: "Trade-offs",
    keywords:
      /\b(first|prioriti[sz]e|trade[- ]?off|instead|rather|scope|delay|ship|workaround|escalate|cost|risk|impact|sequence|decision|constraint|resources|sprint)\b/gi,
    feedback: {
      low: "Make a call. Say what you would do first and what you are deliberately not doing.",
      mid: "There is a direction, but the trade-off is not priced. State what the team gives up.",
      high: "You made a clear call and named the cost of that choice.",
    },
    prompt: "What are you choosing not to do, and why is that acceptable?",
  },
  {
    id: "impact",
    label: "User & business impact",
    shortLabel: "Impact",
    keywords:
      /\b(user|customer|revenue|business|retention|churn|conversion|growth|activation|trust|support|cost|refund|market|account|value)\b/gi,
    feedback: {
      low: "Connect the decision to a user outcome and a business outcome. Both matter.",
      mid: "You name an outcome, but the size or the mechanism is unclear.",
      high: "You connected the fix to both user behaviour and a commercial outcome.",
    },
    prompt: "What user outcome moves, and what business metric follows it?",
  },
  {
    id: "measurement",
    label: "Success metric",
    shortLabel: "Metric",
    keywords:
      /\b(metric|measure|success|kpi|baseline|guardrail|target|threshold|rate|percent|%|monitor|experiment|a\/b|test|cohort|week|day)\b/gi,
    feedback: {
      low: "Define how you will know it worked. Include a baseline and a time window.",
      mid: "A metric is present, but the target or guardrail is missing.",
      high: "You defined a primary metric, a baseline, and a guardrail.",
    },
    prompt: "What is the number, the baseline, and the guardrail you refuse to hurt?",
  },
  {
    id: "risks",
    label: "Risks & next steps",
    shortLabel: "Risks",
    keywords:
      /\b(risk|assumption|uncertain|mitigat|rollback|fallback|next|review|monitor|depend|unknown|edge case|failure|escalat|owner|check)\b/gi,
    feedback: {
      low: "Name the biggest remaining risk and the next checkpoint.",
      mid: "You acknowledge risk, but do not say how you would contain it.",
      high: "You named the remaining risk, the mitigation, and when you would revisit it.",
    },
    prompt: "What could still go wrong, and when will you look again?",
  },
  {
    id: "clarity",
    label: "Clarity of rationale",
    shortLabel: "Clarity",
    keywords:
      /\b(because|so|therefore|first|then|however|but|while|if|then)\b/gi,
    feedback: {
      low: "Shorten the answer into a clear chain: context, evidence, decision, next step.",
      mid: "The reasoning is there. Order it so a sceptical stakeholder can follow it once.",
      high: "The answer is ordered and easy to challenge, which is exactly what an interview needs.",
    },
    prompt: "Can a sceptical stakeholder repeat your reasoning back to you?",
  },
];

export const rubricSummary = CRITERIA.map((criterion) => ({
  id: criterion.id,
  label: criterion.label,
  shortLabel: criterion.shortLabel,
  prompt: criterion.prompt,
}));

export const rubricBands = [
  { min: 78, label: "Interview-ready", detail: "Specific, ordered, and defensible." },
  { min: 60, label: "Strong", detail: "Good shape; one or two checks missing." },
  { min: 40, label: "Developing", detail: "Direction is there; evidence or trade-offs are thin." },
  { min: 0, label: "Starting point", detail: "Start with a bounded problem and a first check." },
];

function countMatches(text: string, pattern: RegExp) {
  const matches = text.match(pattern);
  return matches ? new Set(matches.map((m) => m.toLowerCase())).size : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pickSentence(text: string, pattern: RegExp) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => sentence.trim().length > 12);
  return sentences.find((sentence) => pattern.test(sentence)) ?? sentences[0] ?? "";
}

export function evaluateInterview(raw: string): Evaluation {
  const text = raw.trim().replace(/\s+/g, " ");
  const words = text ? text.split(/\s+/).length : 0;
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const averageSentence = sentences.length ? words / sentences.length : words;

  const criteria: Criterion[] = CRITERIA.map((criterion) => {
    const hits = countMatches(text, new RegExp(criterion.keywords.source, "gi"));
    const wordFactor = clamp(words / 90, 0, 1.6);
    let score = Math.round(hits * 0.9 + wordFactor);

    if (criterion.id === "clarity") {
      score = Math.round(
        clamp(
          (averageSentence >= 8 && averageSentence <= 30 ? 2 : 1) +
            (hits > 2 ? 1 : 0) +
            (words >= 60 ? 1 : 0),
          0,
          4,
        ),
      );
    }

    score = clamp(score, 0, 4);
    const level = score >= 3 ? "high" : score >= 2 ? "mid" : "low";

    return {
      id: criterion.id,
      label: criterion.label,
      shortLabel: criterion.shortLabel,
      score,
      feedback: criterion.feedback[level],
      prompt: criterion.prompt,
    };
  });

  const total = criteria.reduce((sum, item) => sum + item.score, 0);
  const overall = Math.round((total / (criteria.length * 4)) * 100);

  const strengthSentence = pickSentence(
    text,
    /\b(evidence|metric|data|segment|mobile|because|first|decision|users?)\b/i,
  );

  const missing = [...criteria].sort((a, b) => a.score - b.score)[0];

  const improvements: Record<CriterionId, string> = {
    problem:
      "Open with one sentence that bounds the problem: the segment, the behaviour, and the time window. Then investigate inside that boundary.",
    evidence:
      "Before proposing a fix, say which evidence is measured and which is a hypothesis. Add the specific check that would falsify your read.",
    prioritization:
      "Make an explicit call and price the alternative. An interviewer is listening for what you choose not to do.",
    impact:
      "Attach the decision to a user behaviour and a business metric. Explain the mechanism between them.",
    measurement:
      "Give a primary metric, a baseline, a target, a time window, and a guardrail. That turns an opinion into a test.",
    risks:
      "Close with the largest remaining risk, the mitigation, and a named review point.",
    clarity:
      "Use four beats: context, evidence, decision, next check. Keep the sentences short enough to challenge.",
  };

  const band: Evaluation["band"] =
    overall >= 78
      ? "Interview-ready"
      : overall >= 60
        ? "Strong"
        : overall >= 40
          ? "Developing"
          : "Starting point";

  const firstSentence = sentences[0]?.trim() ?? "State the problem and the evidence you would inspect first.";

  return {
    overall,
    band,
    criteria,
    strength: strengthSentence || firstSentence,
    missing,
    improvement: improvements[missing.id],
    outline: [
      `Problem: ${firstSentence || "Name the segment, behaviour, and time window."}`,
      "Evidence: measured signal, assumption, first check.",
      "Decision: the call, the trade-off, what you are not doing.",
      "Impact: user outcome, business metric, success threshold.",
      "Risk: the remaining unknown and the next review point.",
    ],
    words,
    method: "local-rubric",
  };
}
