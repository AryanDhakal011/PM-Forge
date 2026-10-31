import { lintContent, content } from "../src/lib/sacred-no/engine";
import { readFileSync, existsSync } from "node:fs";
lintContent();
const manifest = JSON.parse(
  readFileSync("content/projects/sacred-no/audio-manifest.json", "utf8"),
);
for (const line of content.lines) {
  const clip = manifest.lines[line.id];
  if (
    clip?.caption !== line.text ||
    clip.speaker !== line.speaker ||
    !existsSync("public" + clip.file)
  )
    throw Error(`Missing or stale Sacred No recording: ${line.id}`);
}
console.log(
  `Sacred No: ${content.lines.length} short lines, references and recorded assets verified.`,
);
