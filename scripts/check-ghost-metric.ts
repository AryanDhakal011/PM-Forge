import { readFileSync, existsSync, readdirSync } from "node:fs";
import { lines } from "../src/lib/ghost-metric/dialogue";
import { people, layers } from "../src/lib/ghost-metric/content";
const manifest = JSON.parse(
  readFileSync("content/projects/ghost-metric/audio-manifest.json", "utf8"),
);
if (new Set(lines.map((l) => l.id)).size !== lines.length)
  throw Error("Duplicate Ghost Metric line IDs.");
// The case file states 7.5M of counting noise. Named here so a content edit
// fails with the expected and actual totals instead of a bare magic number.
const EXPECTED_NOISE_MASS = 7.5;
const mass = layers.reduce((sum, l) => sum + l.mass, 0);
if (mass !== EXPECTED_NOISE_MASS)
  throw Error(
    `Ghost Metric mass does not reconcile: expected ${EXPECTED_NOISE_MASS}M of counting noise, got ${mass}M.`,
  );
for (const line of lines) {
  if (
    !people.some((p) => p.id === line.speaker) ||
    line.text.split(/\s+/).length > 14
  )
    throw Error("Invalid speaker or long line: " + line.id);
  const clip = manifest.lines[line.id];
  if (line.speaker === "Ravi" && clip?.voice !== "en-IN-PrabhatNeural")
    throw Error("Incorrect Ravi casting: " + line.id);
  if (
    clip?.caption !== line.text ||
    clip.speaker !== line.speaker ||
    !existsSync("public" + clip.file)
  )
    throw Error("Missing or stale Ghost Metric recording: " + line.id);
}
// Every shipped MP3 must belong to a line, otherwise a re-render leaves dead
// weight in public/ that no manifest can explain.
const referenced = new Set(
  Object.values(manifest.lines as Record<string, { file: string }>)
    .map((l) => (l.file || "").split("/").pop())
    .filter(Boolean),
);
const orphans = readdirSync("public/ghost-metric/audio")
  .filter((file) => file.endsWith(".mp3") && !referenced.has(file))
  .sort();
if (orphans.length)
  throw Error("Unreferenced Ghost Metric recordings: " + orphans.join(", "));
console.log(
  `Ghost Metric: ${lines.length} short lines and recorded assets verified, no orphan clips; 7.5M counting noise + 1.0M real growth = 8.5M increase.`,
);
