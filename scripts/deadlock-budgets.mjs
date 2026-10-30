import {
  readFileSync,
  readdirSync,
  existsSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { gzipSync } from "node:zlib";
import { runInNewContext } from "node:vm";
const context = { globalThis: {} };
runInNewContext(
  readFileSync(
    ".next/server/app/app/projects/deadlock/page_client-reference-manifest.js",
    "utf8",
  ),
  context,
);
const manifest = Object.values(context.globalThis.__RSC_MANIFEST)[0];
const root = Object.entries(manifest.clientModules).find(([key]) =>
  key.includes("/deadlock/DeadlockExperience.tsx"),
)?.[1];
if (!root)
  throw Error(
    "Deadlock client boundary is missing from the production manifest.",
  );
const chunks = readdirSync(".next/static/chunks").filter((name) =>
  name.endsWith(".js"),
);
const signatures = {
  floor: "Lab zones",
  table: "conflict lane",
  data: "Shared projector.",
  forge: " dial defense",
  run: "Five run events",
  debrief: "Debrief views",
};
const scenes = Object.fromEntries(
  Object.entries(signatures).map(([scene, signature]) => {
    const files = chunks.filter((name) =>
      readFileSync(".next/static/chunks/" + name, "utf8").includes(signature),
    );
    if (!files.length)
      throw Error(`Could not locate the ${scene} scene chunk.`);
    return [scene, files.map((name) => "/_next/static/chunks/" + name)];
  }),
);
const size = (file) => {
  const path = ".next/" + file.replace(/^\/_next\//, "");
  if (!existsSync(path)) throw Error("Missing built chunk " + path);
  return gzipSync(readFileSync(path)).length;
};
const boundary = [...new Set(root.chunks)],
  all = [...new Set([...boundary, ...Object.values(scenes).flat()])];
const incremental = (files) =>
  [...new Set(files)]
    .filter((file) => !boundary.includes(file))
    .reduce((n, file) => n + size(file), 0);
const report = {
  at: new Date().toISOString(),
  buildId: readFileSync(".next/BUILD_ID", "utf8").trim(),
  method:
    "gzip of the production Deadlock client-reference dependency set plus signature-identified lazy scene chunks. This is a component-boundary budget; unrelated Next runtime/bootstrap scripts are outside this measurement.",
  boundaryGzipBytes: boundary.reduce((n, f) => n + size(f), 0),
  totalBoundaryAndScenesGzipBytes: all.reduce((n, f) => n + size(f), 0),
  incrementalChapterGzipBytes: {
    chapter1: incremental([...scenes.floor, ...scenes.table]),
    chapter2: incremental([...scenes.data, ...scenes.forge]),
    chapter3: incremental(scenes.run),
    debrief: incremental(scenes.debrief),
  },
  fonts: readdirSync("public/deadlock/fonts")
    .filter((f) => f.endsWith(".woff2"))
    .map((file) => ({
      file,
      bytes: statSync("public/deadlock/fonts/" + file).size,
    })),
  imagePlateBytes: 0,
  recordedAudioBytes: 0,
  assetStatus:
    "Vector plates and procedural/device audio; final raster plates and recorded voices are not supplied.",
  files: all.map((file) => ({ file, gzipBytes: size(file) })),
  scenes,
};
report.checks = {
  totalAtMost350KB: report.totalBoundaryAndScenesGzipBytes <= 350 * 1024,
  chapter1AtMost150KB:
    report.incrementalChapterGzipBytes.chapter1 <= 150 * 1024,
  chapter2AtMost90KB: report.incrementalChapterGzipBytes.chapter2 <= 90 * 1024,
  chapter3AtMost70KB: report.incrementalChapterGzipBytes.chapter3 <= 70 * 1024,
  debriefAtMost60KB: report.incrementalChapterGzipBytes.debrief <= 60 * 1024,
};
writeFileSync(
  "docs/deadlock-verification/budgets.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (!Object.values(report.checks).every(Boolean)) process.exitCode = 1;
