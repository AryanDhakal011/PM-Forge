import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const source = readFileSync(process.argv[2], "utf8");
const blocks = [
  ...source.matchAll(
    /^### ([A-Z]+-[EMH]-[1-3]) — (.+?)\s+\((Easy|Medium|Hard), ~?(\d+) min[^\n]*\)\r?\n([\s\S]*?)(?=^### |^## |^# |$(?![\s\S]))/gm,
  ),
];
const questions = blocks.map(([, id, title, level, minutes, body]) => {
  const fields = {};
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^([^:]+):\s*(.+)/);
    if (match) fields[match[1].trim()] = match[2].trim();
  }
  return {
    id,
    title,
    level: level.toLowerCase(),
    minutes: Number(minutes),
    status: "draft",
    version: 1,
    fields,
  };
});
if (questions.length !== 63 || new Set(questions.map((q) => q.id)).size !== 63)
  throw Error(`Expected 63 unique questions, got ${questions.length}`);
mkdirSync("src/content", { recursive: true });
writeFileSync(
  "src/content/interview-handoff.json",
  JSON.stringify(questions, null, 2) + "\n",
);
console.log(
  `Imported ${questions.length} draft questions; no publication or review status was changed.`,
);
