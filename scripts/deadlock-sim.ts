import { writeFileSync, mkdirSync } from "node:fs";
import { policyRun } from "./deadlock-policies";
const total = Number(process.env.DEADLOCK_POLICIES || 200000);
const started = Date.now(),
  counts: Record<string, number> = {},
  archetypes: Record<string, number> = {},
  examples: Record<string, number> = {};
for (let i = 1; i <= total; i++) {
  const { state } = policyRun("RANDOM", i, true);
  counts[state.ending!] = (counts[state.ending!] || 0) + 1;
  archetypes[state.archetype!] = (archetypes[state.archetype!] || 0) + 1;
  examples[state.ending!] ??= i;
  if (i % 20000 === 0) process.stdout.write(`${i} / ${total}\n`);
}
const named = Object.fromEntries(
  (["INFORMED", "LEAN", "BOLD", "AVOIDANT"] as const).map((policy) => {
    const { state } = policyRun(policy, 1);
    return [
      policy,
      {
        ending: state.ending,
        archetype: state.archetype,
        metrics: {
          rob: state.rob,
          sw: state.sw,
          runway: state.runway,
          ready: state.ready,
          align: state.align,
          cred: state.cred,
        },
        wow: state.run.wow,
        supervision: state.run.supervision,
      },
    ];
  }),
);
const pct = (ending: string) => ((counts[ending] || 0) / total) * 100;
const targets = {
  allOrdinaryEndingsAtLeast3: [
    "FRACTURE",
    "STANDING GUARD",
    "BABYSITTER",
    "STEADY HANDS",
    "QUIET ROOM",
  ].every((e) => pct(e) >= 3),
  goldenBetweenPoint2And4:
    pct("SHARED GROUND") >= 0.2 && pct("SHARED GROUND") <= 4,
  quietAtMost25: pct("QUIET ROOM") <= 25,
  fractureAtMost35: pct("FRACTURE") <= 35,
  informedGolden: named.INFORMED.ending === "SHARED GROUND",
  boldStandingGuard: named.BOLD.ending === "STANDING GUARD",
  leanSteadyHands: named.LEAN.ending === "STEADY HANDS",
  avoidantQuietRoom: named.AVOIDANT.ending === "QUIET ROOM",
  atLeastFourArchetypes: Object.keys(archetypes).length >= 4,
};
const report = {
  at: new Date().toISOString(),
  seedRange: [1, total],
  policies: total,
  policyDefinition:
    "Uniform inspected sets, budget-feasible sockets, dataset count/order, dial stops and available defense attachments. Second proposals are independently sampled; available push/revise and four run actions are equiprobable. No tuning changes.",
  durationMs: Date.now() - started,
  counts,
  percentages: Object.fromEntries(Object.keys(counts).map((e) => [e, pct(e)])),
  archetypes,
  exampleSeeds: examples,
  named,
  targets,
  allTargetsMet: Object.values(targets).every(Boolean),
};
mkdirSync("docs/deadlock-verification", { recursive: true });
writeFileSync(
  "docs/deadlock-verification/simulation.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (!report.allTargetsMet) process.exitCode = 2;
