import handoff from "@/content/interview-handoff.json";
import reviewRegistry from "@/content/review-registry.json";
import type { Category, Dimension, Evidence, Question } from "./types";

export const CATEGORIES: {
  id: Category;
  label: string;
  short: string;
  studio: string;
  description: string;
  color: string;
  dimensions: Dimension[];
}[] = [
  {
    id: "root-cause",
    label: "Root Cause Analysis",
    short: "RCA",
    studio: "Investigation room",
    description: "Find the signal. Test what actually changed.",
    color: "#C0503A",
    dimensions: [
      { id: "segmentation", label: "Segmentation", weight: 25 },
      { id: "ranking", label: "Hypothesis ranking", weight: 25 },
      { id: "efficiency", label: "Evidence efficiency", weight: 25 },
      { id: "logic", label: "Recommendation logic", weight: 25 },
    ],
  },
  {
    id: "product-sense",
    label: "Product Sense",
    short: "PS",
    studio: "Design studio",
    description: "Understand a real person. Make one thing matter.",
    color: "#D49A2E",
    dimensions: [
      { id: "framing", label: "Problem framing", weight: 30 },
      { id: "insight", label: "User insight", weight: 20 },
      { id: "priority", label: "Prioritisation", weight: 20 },
      { id: "solution", label: "Solution", weight: 20 },
      { id: "tradeoff", label: "Trade-off reasoning", weight: 10 },
    ],
  },
  {
    id: "strategy",
    label: "Market Strategy",
    short: "STR",
    studio: "Strategy room",
    description: "Choose where to play, and what to leave behind.",
    color: "#3F6E9A",
    dimensions: [
      { id: "goal", label: "Goal alignment", weight: 30 },
      { id: "focus", label: "Strategic focus", weight: 25 },
      { id: "evidence", label: "Evidence-based logic", weight: 25 },
      { id: "feasibility", label: "Feasibility", weight: 20 },
    ],
  },
  {
    id: "execution-metrics",
    label: "Execution & Metrics",
    short: "EXE",
    studio: "Operations desk",
    description: "Build a metric that tells the whole story.",
    color: "#6C8F4E",
    dimensions: [
      { id: "validation", label: "Evidence validation", weight: 30 },
      { id: "precision", label: "Primary-metric precision", weight: 25 },
      { id: "guardrail", label: "Guardrail balance", weight: 25 },
      { id: "next", label: "Measurable next step", weight: 20 },
    ],
  },
  {
    id: "estimation",
    label: "Estimation",
    short: "EST",
    studio: "Precision workshop",
    description: "Make the unknown measurable. Defend the assumptions.",
    color: "#8A6BA8",
    dimensions: [
      { id: "structure", label: "Structure", weight: 40 },
      { id: "sanity", label: "Sanity", weight: 30 },
      { id: "calculation", label: "Calculation consistency", weight: 20 },
      { id: "communication", label: "Communication", weight: 10 },
    ],
  },
  {
    id: "ai-technical",
    label: "AI & Technical",
    short: "AIT",
    studio: "Architecture lab",
    description: "Choose the simplest system that earns trust.",
    color: "#2E8C86",
    dimensions: [
      { id: "alignment", label: "User alignment", weight: 25 },
      { id: "tradeoff", label: "Trade-off logic", weight: 25 },
      { id: "feasibility", label: "Feasibility", weight: 20 },
      { id: "validation", label: "Validation strategy", weight: 30 },
    ],
  },
  {
    id: "behavioral",
    label: "Behavioral",
    short: "BEH",
    studio: "Leadership room",
    description: "Own your actions. Tell the difficult, honest version.",
    color: "#B5651D",
    dimensions: [
      { id: "ownership", label: "Specific actions & ownership", weight: 40 },
      { id: "results", label: "Results & evidence", weight: 25 },
      { id: "learning", label: "Learning", weight: 20 },
      { id: "situation", label: "Situation", weight: 15 },
    ],
  },
];
const codeCategory: Record<string, Category> = {
  EST: "estimation",
  RCA: "root-cause",
  STR: "strategy",
  EXE: "execution-metrics",
  AIT: "ai-technical",
  BEH: "behavioral",
  PS: "product-sense",
};
export const categoryOf = (id: Category) =>
  CATEGORIES.find((c) => c.id === id)!;
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function evidenceFor(text: string): Evidence[] {
  const markers = [
    ...text.matchAll(
      /E(\d+)\((\d+)\)|(?:[RS]\s+)?A(\d+)\s+(?:locked\s+(\d+):?\s*)?/g,
    ),
  ];
  if (!markers.length) {
    const parts = text.split(/;\s*/).filter(Boolean);
    return parts.map((part, index) => ({
      id: `E${index + 1}`,
      title: index === 0 ? "Scenario brief" : `Evidence ${index + 1}`,
      text: part,
      cost: index === 0 ? 0 : 1,
      discriminating: !/red herring|no difference/i.test(part),
      tag: /\(S\d+\)/.test(part) ? "REFERENCE" : "SIMULATED",
    }));
  }
  const base = text
    .slice(0, markers[0].index)
    .replace(/S\s*(locked cards:|locked:)?\s*$/, " ")
    .trim();
  const items: Evidence[] = [];
  if (base.length > 12)
    items.push({
      id: "brief",
      title: "Opening dashboard",
      text: base,
      cost: 0,
      discriminating: true,
      tag: "SIMULATED",
    });
  markers.forEach((m, index) => {
    const body = text
      .slice(m.index! + m[0].length, markers[index + 1]?.index ?? text.length)
      .replace(/^[:\s]+/, "")
      .trim();
    const isLocked = !!m[1] || /locked/i.test(m[0]);
    const title = body
      .split(/[:;]|\s(?=\d)/)[0]
      .replace(/\([^)]*\)/g, "")
      .slice(0, 70)
      .trim();
    items.push({
      id: `E${m[1] || m[3]}`,
      title: title || `Evidence ${index + 1}`,
      text: body
        .replace(/\s*\(red herrings?\)/gi, "")
        .replace(
          /\(resolution:[^)]*\)/gi,
          "(the definitions differ; reconcile them before deciding)",
        ),
      cost: isLocked ? Number(m[2] || m[4] || 1) : 0,
      discriminating: !/red herring/.test(body),
      tag: /\(S\d+\)/.test(body) ? "REFERENCE" : "SIMULATED",
    });
  });
  return items;
}

export const questions: Question[] = handoff.map((raw) => {
  const fields = raw.fields as unknown as Record<string, string>;
  const category = codeCategory[raw.id.split("-")[0]];
  const scenario =
    fields["Scenario and goal"] ||
    fields.Scene ||
    fields["Story prompt"] ||
    raw.title;
  const goal =
    scenario.match(/Goal(?: pin)?:\s*(.+)/i)?.[1] ||
    fields["Story prompt"] ||
    `Defend your decision: ${raw.title}`;
  const defensible =
    fields.Defensible ||
    fields["Defensible stories"] ||
    "Investigate with independent evidence; run a bounded test with a review date.";
  const alternatives = defensible
    .split(/;\s*(?=P\d|by |a |resolved|defer)|\bP\d\s+/)
    .map((s) => s.replace(/^P\d\s*/, "").trim())
    .filter((s) => s.length > 8);
  if (alternatives.length < 2)
    alternatives.push(
      "Use a smaller, reversible test first; accept slower learning in exchange for limiting exposure.",
    );
  const trap =
    fields.Trap ||
    "Premature solution → choosing before testing your assumptions.";
  const choiceLabels = alternatives.slice(0, 3);
  const trapLabel =
    trap.split(/→/)[1]?.trim() ||
    "Commit to the obvious solution before investigating";
  const choices = choiceLabels.map((label, i) => ({
    id: `path-${i + 1}`,
    label: label.replace(/[.]$/, ""),
    quality: 100,
    consequence:
      "The interviewer asks what evidence would make this decision defensible. Your evidence and guardrails still matter.",
  }));
  choices.splice(1, 0, {
    id: "shortcut",
    label: trapLabel,
    quality: 20,
    consequence:
      "The interviewer challenges the assumption behind your choice. You will have a chance to revise it.",
    ...{ trap: true },
  });
  if (category === "behavioral") {
    const sceneOptions = fields.Scene?.split("Choices:")[1];
    const labels = sceneOptions
      ? [...sceneOptions.matchAll(/[A-C]\)\s*([\s\S]*?)(?=[A-C]\)|$)/g)].map(
          (match) => match[1].replace(/[;.]\s*$/g, "").trim(),
        )
      : choiceLabels;
    choices.splice(
      0,
      choices.length,
      ...(labels.length >= 2 ? labels : choiceLabels).map((label, i) => ({
        id: `scene-${i + 1}`,
        label,
        quality: 100,
        consequence:
          "This choice sets the context for the probe. The structure of your real story—not the scene preference—drives feedback.",
      })),
    );
  }
  const primer = (
    fields.Primer ||
    `${raw.title} / There are competing constraints / Defend a decision with evidence`
  )
    .split(/\s+\/\s+/)
    .slice(0, 3);
  while (primer.length < 3)
    primer.push("Be ready to explain what would change your mind.");
  return {
    id: raw.id,
    slug: `${raw.id.toLowerCase()}-${slugify(raw.title).slice(0, 75)}`,
    title: raw.title,
    category,
    level: raw.level as Question["level"],
    minutes: raw.minutes,
    version: 1,
    status: (new Set((reviewRegistry as Record<string, string[]>)[raw.id] || [])
      .size >= 2
      ? "reviewed"
      : "draft") as Question["status"],
    reviewers: [
      ...new Set((reviewRegistry as Record<string, string[]>)[raw.id] || []),
    ],
    primer,
    scenario,
    goal,
    evidence: evidenceFor(fields.Artifacts || fields.Scene || scenario),
    evidenceSummary: fields.Artifacts || scenario,
    task:
      fields.Run ||
      fields["Story prompt"] ||
      "Investigate, make one call, and name the trade-off.",
    trap,
    choices,
    trace:
      fields["Reference trace"] ||
      fields["Reference trace (shape, not a script)"] ||
      fields["Reference trace (shape)"] ||
      "Pin the objective. Make your own actions explicit. Name the cost, the observable result, and the behavior you changed afterward.",
    alternatives,
    pump: (
      fields.Pump ||
      "Make the link between evidence and your decision explicit."
    ).replace(/^"|"$/g, ""),
    probes:
      fields["Probes by scene choice"] ||
      fields.Probes ||
      "What would change your mind? Which observation would rule out your preferred explanation?",
    retryNotes:
      fields["Retry seeds"] ||
      fields.Retry ||
      "Use a different evidence order and reconsider your primary decision.",
    storyPrompt: fields["Story prompt"],
    dimensions: categoryOf(category).dimensions,
  };
});

export const getQuestion = (id: string) =>
  questions.find((q) => q.id === id || q.slug === id);
export const evidenceBudget = (level: Question["level"]) =>
  ({ easy: 6, medium: 8, hard: 10 })[level];
export const REFERENCE_NOTE =
  "Scenario from the supplied interview handoff; review status is shown per brief. Internal company metrics are simulated; cited public figures are handoff references, not newly verified facts.";

export const RCA_CUTS: Record<
  string,
  { label: string; rows: [string, string, string][]; hypotheses: string[] }
> = {
  "RCA-E-1": {
    label: "Platform",
    rows: [
      ["iOS", "17,000", "17,100"],
      ["Android", "17,500", "12,580"],
      ["Web", "6,500", "6,400"],
    ],
    hypotheses: [
      "Tracking failure on Android 14",
      "UI regression across platforms",
      "Seasonal demand",
      "Competitor promotion",
    ],
  },
  "RCA-E-2": {
    label: "Carrier",
    rows: [
      ["Carrier A", "71%", "70%"],
      ["Carrier B", "60%", "31%"],
      ["Carrier C", "52%", "51%"],
    ],
    hypotheses: [
      "SMS delivery failure on carrier B",
      "Onboarding layout friction",
      "Listing quality",
      "Pricing change",
    ],
  },
  "RCA-E-3": {
    label: "Device",
    rows: [
      ["Phone", "3.6%", "3.6%"],
      ["Desktop", "5.0%", "5.0%"],
      ["Tablet", "3.8%", "2.36%"],
    ],
    hypotheses: [
      "Button visibility on tablet landscape",
      "Search relevance",
      "Payment errors",
      "Traffic quality",
    ],
  },
  "RCA-M-1": {
    label: "Cohort",
    rows: [
      ["Crash-affected share", "0.4%", "2.1%"],
      ["Non-crash conversion", "3.20%", "3.05%"],
      ["Zero-result queries", "2.1%", "9.4%"],
    ],
    hypotheses: [
      "Stale search index",
      "Crashes account for all loss",
      "Traffic mix",
      "Pricing change",
    ],
  },
  "RCA-M-2": {
    label: "City",
    rows: [
      ["City A", "28 min", "27 min"],
      ["City B", "34 min", "33 min"],
      ["City C", "Not launched", "52 min"],
    ],
    hypotheses: [
      "Mix shift toward low-density City C",
      "Dispatch regression in all cities",
      "Payment failure",
      "Seasonality only",
    ],
  },
  "RCA-M-3": {
    label: "Acquisition",
    rows: [
      ["Organic D7", "31%", "31%"],
      ["Promo share", "0%", "35%"],
      ["Promo D7", "—", "12%"],
    ],
    hypotheses: [
      "Low-retention acquisition mix",
      "Feed-ranking regression",
      "Notification volume",
      "App stability",
    ],
  },
  "RCA-H-1": {
    label: "Treatment / control",
    rows: [
      ["Control retention", "61.0%", "58.9%"],
      ["Treatment retention", "61.2%", "55.6%"],
      ["Fuel price index", "100", "111"],
    ],
    hypotheses: [
      "Earnings-screen effect plus baseline and competitor pressure",
      "Fuel prices explain the entire decline",
      "A competitor is the only cause",
      "A change in driver tenure mix",
    ],
  },
  "RCA-H-2": {
    label: "Case mix",
    rows: [
      ["Simple-ticket CSAT", "4.65", "4.65"],
      ["Complex-ticket CSAT", "3.70", "3.70"],
      ["Complex-ticket share", "22%", "41%"],
    ],
    hypotheses: [
      "Case mix, repeat contacts, and new-agent cohort effects",
      "Speed alone measures success",
      "A survey bug only",
      "Unrelated seasonality",
    ],
  },
  "RCA-H-3": {
    label: "Revenue bridge",
    rows: [
      ["FX effect", "—", "−$0.28"],
      ["Annual-plan mix", "—", "−$0.31"],
      ["Seat contraction + promotions", "—", "−$0.40"],
    ],
    hypotheses: [
      "Multiple causes with different health implications",
      "Every ARPPU decline is bad",
      "A single pricing bug",
      "All decline is harmless FX",
    ],
  },
};
