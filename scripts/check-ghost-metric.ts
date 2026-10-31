import { readFileSync, existsSync } from "node:fs";
import { lines } from "../src/lib/ghost-metric/dialogue";
import { people, layers } from "../src/lib/ghost-metric/content";
const manifest = JSON.parse(
  readFileSync("content/projects/ghost-metric/audio-manifest.json", "utf8"),
);
if (new Set(lines.map((l) => l.id)).size !== lines.length)
  throw Error("Duplicate Ghost Metric line IDs.");
if (layers.reduce((sum, l) => sum + l.mass, 0) !== 7.5)
  throw Error("Ghost Metric mass does not reconcile.");
for (const line of lines) {
  if (
    !people.some((p) => p.id === line.speaker) ||
    line.text.split(/\s+/).length > 14
  )
    throw Error("Invalid speaker or long line: " + line.id);
  const clip = manifest.lines[line.id];
  if (
    clip?.caption !== line.text ||
    clip.speaker !== line.speaker ||
    !existsSync("public" + clip.file)
  )
    throw Error("Missing or stale Ghost Metric recording: " + line.id);
}
console.log(
  `Ghost Metric: ${lines.length} short lines and recorded assets verified; 7.5M counting noise + 1.0M real growth = 8.5M increase.`,
);
