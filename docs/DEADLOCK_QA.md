# Deadlock prototype verification

Historical v1 verification. The corrected guided/voiced experience and its current checks are documented in [Deadlock v2](DEADLOCK-V2.md).

Verified locally on 30 October 2026, Windows / Node 24 / production Next.js 16.4.3. This is a playable prototype, not a release acceptance sign-off. See [known gaps](DEADLOCK_GAPS.md) and the [prepared playtest](DEADLOCK_PLAYTEST.md).

## Play and persistence

Open `/app/projects/deadlock` from Real World Projects. Choose silent or narrated play, inspect three floor objects, resolve the tactical table, project evidence, build a proposal, and manage the five-event live run. The ending leads to the trace debrief, verified counterfactuals, original-preserving forks, comparisons and an optional note. Saved runs resume from the entry. Export inside the simulation; generic workspace backup and cloud sync do not include these logs.

The supplied names and rules are used provisionally. Original SVG stage art and procedural/device audio are shipped; final Blender art and recorded voices are not.

## Automated checks

- `npm run build`: passed, including TypeScript and production route generation. Build ID is recorded in `deadlock-verification/budgets.json`.
- `npm test`: 47 existing product/account checks passed.
- `npm run test:deadlock`: 13 tests passed. Includes 64 table combinations, independent evidence/acceptance formulas, 10,000 seeded deterministic replays, original-preserving forks, verified counterfactuals, earned dialogue, inspection reservation, run-cost ledgers and decision-window badges.
- `node docs/verify-deadlock.mjs`: all 85 production Chrome guest-journey and responsive/offline checks passed with no browser exceptions. The exact check list and results are in `deadlock-verification/browser.json`; screenshots are local ignored outputs. Includes all six endings, five room states, 25 scene/viewport combinations, keyboard tokens and the guarded two-Enter commit, transcript reload, offline navigation, quota failure and six-fork limit. The voice check stubs the browser speech API; it does not validate real voices.
- `node scripts/deadlock-budgets.mjs`: all five compressed component-boundary checks passed. Final total 266,851 bytes gzip; chapter increments 11,105 / 8,773 / 3,821 bytes and debrief 6,424 bytes. Fonts total 37,016 bytes. Shared dependencies are included in the boundary; unrelated Next bootstrap/runtime scripts are excluded. These are not full cold-page transfer measurements.

The browser report also records short desktop and 4× CPU mobile-emulation frame samples: both measured approximately 16.9ms p95 with zero long tasks and approximately 20.3MB JS heap. These measure one scripted active scene, not total process memory, physical-device performance or an entire session. The standalone performance probe is `node docs/verify-deadlock-performance.mjs`.

## Balance gate is red

`npm run deadlock:sim` ran 200,000 reproducible seeded policies. All six endings and archetypes were reached; named informed/lean/bold/avoidant policies reach their specified targets. Three distribution thresholds fail: Shared Ground 0.0075%, Standing Guard 0.2615%, Steady Hands 2.981%. The supplied numeric rules were preserved. The command deliberately returns a failure and CI retains that gate rather than hiding it. See `deadlock-verification/simulation.json` for sampler definition and results; human outcome rates are unknown.

## Reproduce

Install with `npm ci --legacy-peer-deps`, run the engine/product tests, build, then start production on port 3001. Run the browser script on Windows with Chrome at its documented executable path. It uses a disposable profile and does not modify the user's browser or saved runs. Run the budget script after building. The simulation needs several minutes; do not run it concurrently with performance measurements. CI runs product, engine, build, compressed-budget and balance checks; remote outcomes must be inspected separately after pushing.
