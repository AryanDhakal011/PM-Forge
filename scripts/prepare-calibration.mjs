import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const [source, target] = process.argv.slice(2);
if (!source || !target)
  throw Error(
    "Usage: node --import tsx scripts/prepare-calibration.mjs workspace.json output-directory",
  );
const { exportSchema } = await import("../src/lib/product/schema.ts");
const { scoreRun } = await import("../src/lib/product/engine.ts");
const { getQuestion } = await import("../src/lib/product/content.ts");
const { questionForRun, variantConstraint } =
  await import("../src/lib/product/variants.ts");
const workspace = exportSchema.parse(JSON.parse(readFileSync(source, "utf8")));
const runs = workspace.runs.filter((r) => r.completedAt).slice(0, 30);
if (runs.length < 30)
  throw Error(
    `Need 30 consented, de-identified completed sample runs; found ${runs.length}. No synthetic expert ratings will be created.`,
  );
mkdirSync(target, { recursive: true });
const samples = runs.map((r, i) => ({
  sampleId: `S${String(i + 1).padStart(2, "0")}`,
  questionId: r.questionId,
  scenario: getQuestion(r.questionId)?.scenario,
  seed: r.seed,
  evidenceIds: r.evidenceIds,
  observedEvidence: questionForRun(r)
    ?.evidence.filter((e) => r.evidenceIds.includes(e.id))
    .map(({ id, title, text }) => ({ id, title, text })),
  constraint: variantConstraint(r.seed),
  availableDirections: questionForRun(r)?.choices.map(({ id, label }) => ({
    id,
    label,
  })),
  choiceId: r.choiceId,
  rank: r.rank,
  segment: r.segment,
  dials: r.dials,
  metrics: r.metrics,
  architecture: r.architecture,
  synthesis: r.synthesis,
  story: r.story,
  decisions: r.decisions.map(({ stage, action, value }) => ({
    stage,
    action,
    value,
  })),
}));
writeFileSync(
  resolve(target, "blinded-samples.json"),
  JSON.stringify(samples, null, 2),
);
writeFileSync(
  resolve(target, "engine-key.private.json"),
  JSON.stringify(
    runs.map((r, i) => ({
      sampleId: samples[i].sampleId,
      band: scoreRun(r).band,
    })),
    null,
    2,
  ),
);
writeFileSync(
  resolve(target, "expert-ratings.json"),
  JSON.stringify(
    samples.map((s) => ({
      sampleId: s.sampleId,
      ratings: [
        { expertId: "", band: "", rationale: "" },
        { expertId: "", band: "", rationale: "" },
      ],
    })),
    null,
    2,
  ),
);
console.log(
  "Prepared 30 blinded samples and an engine key. Remove personal details from free text before sharing. Keep the engine key hidden until ratings are locked.",
);
