import { readFileSync, writeFileSync } from "node:fs";
const [ratingsPath, keyPath, out = "calibration-report.json"] =
  process.argv.slice(2);
if (!ratingsPath || !keyPath)
  throw Error(
    "Usage: node scripts/compare-calibration.mjs expert-ratings.json engine-key.private.json report.json",
  );
const ratings = JSON.parse(readFileSync(ratingsPath, "utf8")),
  key = JSON.parse(readFileSync(keyPath, "utf8"));
const bands = ["Developing", "Solid", "Strong"];
const experts = new Set(
  ratings
    .flatMap((row) => row.ratings.map((r) => r.expertId?.trim()))
    .filter(Boolean),
);
if (experts.size < 2 || experts.size > 3)
  throw Error(
    "Use the same panel of two or three independent experts across the sample set.",
  );
if (
  ratings.length !== 30 ||
  key.length !== 30 ||
  new Set(ratings.map((r) => r.sampleId)).size !== 30 ||
  new Set(key.map((r) => r.sampleId)).size !== 30
)
  throw Error("Exactly 30 unique matched samples required.");
const rows = ratings.map((row) => {
  const engine = key.find((k) => k.sampleId === row.sampleId)?.band;
  const rs = row.ratings;
  if (
    !bands.includes(engine) ||
    rs.length < 2 ||
    rs.length > 3 ||
    new Set(rs.map((r) => r.expertId.trim())).size !== rs.length ||
    rs.some(
      (r) =>
        !r.expertId.trim() || !bands.includes(r.band) || !r.rationale.trim(),
    )
  )
    throw Error(
      `Need 2–3 independent expert IDs, valid bands, and rationales for ${row.sampleId}`,
    );
  const votes = bands.map((b) => rs.filter((r) => r.band === b).length),
    max = Math.max(...votes);
  const consensus =
    votes.filter((v) => v === max).length === 1
      ? bands[votes.indexOf(max)]
      : null;
  return {
    sampleId: row.sampleId,
    engine,
    expertBands: rs.map((r) => r.band),
    consensus,
    agreement: consensus ? engine === consensus : null,
  };
});
const resolved = rows.filter((r) => r.consensus);
const report = {
  at: new Date().toISOString(),
  samples: 30,
  consensusSamples: resolved.length,
  unresolved: 30 - resolved.length,
  engineConsensusAgreement: resolved.length
    ? resolved.filter((r) => r.agreement).length / resolved.length
    : null,
  unanimousExpertSamples: rows.filter((r) => new Set(r.expertBands).size === 1)
    .length,
  rows,
  numericScoresEnabled: false,
  next: "Review disagreements, revise rubric, repeat a held-out comparison, and obtain documented human sign-off before enabling numeric scores.",
};
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    samples: 30,
    agreement: report.engineConsensusAgreement,
    unresolved: report.unresolved,
    numericScoresEnabled: false,
  }),
);
