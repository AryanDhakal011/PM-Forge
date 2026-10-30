import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRun } from "../src/lib/product/engine";
import { questions } from "../src/lib/product/content";
test("calibration tooling blinds 30 samples, rejects missing ratings, and compares a fixed expert panel without enabling numbers", () => {
  const folder = mkdtempSync(join(tmpdir(), "pmforge-calibration-test-"));
  const runs = Array.from({ length: 30 }, (_, i) => ({
    ...createRun(questions[i], "fixture-owner"),
    stage: "complete",
    completedAt: new Date().toISOString(),
  }));
  const input = join(folder, "workspace.json");
  writeFileSync(
    input,
    JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: {
        id: "fixture-owner",
        name: "",
        role: "test",
        level: "easy",
        timeline: "test",
        onboardingComplete: true,
        identity: "guest",
        updatedAt: new Date().toISOString(),
      },
      runs,
      records: [],
      bookmarks: [],
    }),
  );
  const prepare = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/prepare-calibration.mjs", input, folder],
    { encoding: "utf8", windowsHide: true },
  );
  assert.equal(prepare.status, 0, prepare.stderr);
  const samples = JSON.parse(
    readFileSync(join(folder, "blinded-samples.json"), "utf8"),
  );
  assert.equal(samples.length, 30);
  assert.equal(samples[0].ownerId, undefined);
  assert.equal(samples[0].band, undefined);
  const ratingsPath = join(folder, "expert-ratings.json"),
    keyPath = join(folder, "engine-key.private.json"),
    output = join(folder, "report.json");
  const compare = () =>
    spawnSync(
      process.execPath,
      ["scripts/compare-calibration.mjs", ratingsPath, keyPath, output],
      { encoding: "utf8", windowsHide: true },
    );
  assert.notEqual(compare().status, 0);
  const key = JSON.parse(readFileSync(keyPath, "utf8"));
  writeFileSync(
    ratingsPath,
    JSON.stringify(
      key.map((row: { sampleId: string; band: string }) => ({
        sampleId: row.sampleId,
        ratings: [
          {
            expertId: "test-expert-a",
            band: row.band,
            rationale: "Fixture rationale",
          },
          {
            expertId: "test-expert-b",
            band: row.band,
            rationale: "Fixture rationale",
          },
        ],
      })),
    ),
  );
  assert.equal(compare().status, 0);
  const report = JSON.parse(readFileSync(output, "utf8"));
  assert.equal(report.engineConsensusAgreement, 1);
  assert.equal(report.numericScoresEnabled, false);
});
