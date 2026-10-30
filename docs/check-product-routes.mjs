import { writeFileSync, mkdirSync } from "node:fs";
const base = process.env.PRODUCT_URL || "http://localhost:3001";
const paths = [
  "/",
  "/app",
  "/app/practice",
  "/app/progress",
  "/app/history",
  "/app/bookmarks",
  "/app/portfolio",
  "/app/portfolio/new",
  "/app/settings",
  "/app/account",
  "/onboarding",
  "/login",
  "/signup",
  "/questions",
  "/questions?category=root-cause&level=easy",
  "/frameworks",
  "/how-it-works",
  "/content-policy",
  "/help",
  "/changelog",
  "/contribute",
  "/offline",
  "/maintenance",
  "/auth/error",
  "/privacy",
  "/terms",
  "/credits",
];
const checks = [];
for (const path of paths) {
  const response = await fetch(base + path);
  const body = await response.text();
  checks.push({ path, status: response.status, pass: response.status === 200 });
  if (path === "/questions")
    checks.push({
      check: "public catalogue is present without JavaScript",
      pass: body.includes("Durbar Marg"),
    });
  if (path.includes("category=root-cause"))
    checks.push({
      check: "public GET filters render three RCA easy articles",
      pass: (body.match(/<article/g) || []).length === 3,
    });
}
for (const [path, location] of [
  ["/dashboard", "/app"],
  ["/practice", "/app/practice"],
  ["/learn", "/resources"],
]) {
  const response = await fetch(base + path, { redirect: "manual" });
  checks.push({
    path,
    status: response.status,
    location: response.headers.get("location"),
    pass:
      [307, 308].includes(response.status) &&
      response.headers.get("location") === location,
  });
}
for (const [path,location] of [["/app/bookmarks","/app/practice?view=saved"],["/app/history","/app/progress?tab=history"]]) {const response=await fetch(base+path,{redirect:"manual"});checks.push({path,status:response.status,location:response.headers.get("location"),pass:response.status===308&&response.headers.get("location")===location});}
const bad = await fetch(base + "/questions/this-question-does-not-exist");
checks.push({
  check: "unknown question returns 404",
  status: bad.status,
  pass: bad.status === 404,
});
const report = { at: new Date().toISOString(), checks };
mkdirSync("docs/product-verification", { recursive: true });
writeFileSync(
  "docs/product-verification/routes.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (checks.some((check) => !check.pass)) process.exitCode = 1;
