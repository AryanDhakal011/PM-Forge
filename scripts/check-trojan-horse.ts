import { existsSync, readFileSync } from "node:fs";
import { allLines } from "../src/lib/trojan-horse/content";
const manifest = JSON.parse(readFileSync("content/projects/trojan-horse/audio-manifest.json", "utf8"));
if (new Set(allLines.map(l => l.id)).size !== allLines.length) throw Error("Duplicate Trojan Horse line IDs");
for (const line of allLines) {
  const clip = manifest.lines[line.id];
  if (clip?.caption !== line.text || clip?.speaker !== line.speaker || !existsSync("public" + clip.file)) throw Error("Missing/stale Trojan Horse recording: " + line.id);
}
console.log(`Trojan Horse: ${allLines.length} caption-matched prerecorded lines verified.`);
