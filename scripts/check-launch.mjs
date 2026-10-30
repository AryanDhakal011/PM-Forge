import { readFileSync } from "node:fs";
const missing = [
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
].filter((k) => !process.env[k]);
if (
  (process.env.BETTER_AUTH_SECRET || "").length < 32 &&
  !missing.includes("BETTER_AUTH_SECRET")
)
  missing.push("BETTER_AUTH_SECRET (32+ characters)");
const review = JSON.parse(
  readFileSync(
    new URL("../src/content/review-registry.json", import.meta.url),
    "utf8",
  ),
);
const count = Object.values(review).filter(
  (ids) => Array.isArray(ids) && new Set(ids).size >= 2,
).length;
const blockers = [
  ...missing.map((k) => `Missing ${k}`),
  ...(count < 63
    ? [`${count}/63 scenarios have two documented expert reviews`]
    : []),
];
console.log(
  blockers.length
    ? `Launch blocked:\n${blockers.join("\n")}`
    : "Account credentials and scenario review gate pass. Complete deployment and acceptance checks before public release.",
);
if (blockers.length) process.exitCode = 1;
