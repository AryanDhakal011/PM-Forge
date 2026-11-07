# Shared project platform and storyline corrections

The supplied handoffs are retained verbatim in `PMFORGE_PROJECT_PLATFORM_SPEC.txt` and `PMFORGE_STORYLINE_CORRECTIONS_V2.txt` beside this document. They are the target contract. This implementation is a **review preview**, not a declaration that every release gate has passed.

## Implemented shared runtime

The new runtime lives in the binding `platform/` folders. Level story data lives in `levels/`, with a catalog, manifests, scenes, characters, reports/tools, event decks, templates, ask topics, objections, delayed receipts, rules, and local art manifests. The five corrected stories and a hidden regression level use the same reducer, tool host, UI, and save service.

- JSON conditions and effects, including conditional effect groups, are interpreted without `eval`.
- A serializable finite-state runner separates lines, required actions, visible reactions, overlays, and scene changes. Next cannot complete a tool for the player.
- Receipts preserve exact choice wording and complete three-round duel wording. Delayed consequences refer to their source receipt. Why panels expose the cause and numerical rule.
- Mulberry32 drives eligible event selection. Explicit choices remain deterministic. Counterfactuals reuse the seed in a Worker, with an eight-millisecond cooperative fallback.
- Shared layout, entrance, portraits, dialogue, choices, goal and remaining-action strips, case file, people/ask views, history, pause, consequence chips, review, replay, and branch routes are available through the public platform APIs.
- Tool configuration is validated before rendering. Controls have keyboard/menu alternatives to dragging. Resource scopes dispose listeners, timers, audio, workers, and animation contexts.
- Saves use IndexedDB, an in-memory fallback, ordered atomic transactions, a checksum, five prior snapshots, migration hooks, quarantine/export, and separate import/branch identities. Decision text is excluded from balance telemetry.
- Audio starts only after a user gesture. These revised scripts are explicitly caption-first; no new voice performances are claimed. Missing voice assets do not block play.
- GSAP supplies the registered scene and tool motion; reduced motion preserves meaningful static results. The motion manager limits spectacles and loops.
- The manifest, content validator, and runtime flag must all permit public entry. Flags can be changed in `.data/project-flags.json` without rebuilding. A global or per-level environment kill switch also applies.

## Corrected story previews

| Level | Implemented interactions |
| --- | --- |
| Deadlock | Hold-to-stop near-miss; limited lab evidence; second look; live mediation; ordered private asides; uncertain margin; configurable Forge; fifteen-second dry run; proposal tradeoff; five demo decisions and conditional technician callback; replay wall. |
| Trojan Horses | Coin press; two visits on the party floor; seven reports; device-identity classification; payout valve; exact public wording; conditional bakery visit or angry call; segment policies; grace period; Launch Night replies and intervention; Guild letter. |
| Sacred No | Three-message triage; evidence and Slack interruptions; safeguard allocation; argument rehearsal; three-round argument/tone duel; Tess tell negotiation; failure trace; timed kill switch; exact-words callbacks. |
| Ghost Metric | Retry classification; evidence cart and joins; instrument-based autopsy; interval/stake bet; conditional confession; slide framing; audience reveal; metric definition; three heist roles; comparison review. |
| Last Mile | Named courier selection and ride-along; field evidence; radio responses; threshold; shelter locations; public statement; compensation choices; rumor corrections; reopening order; operating cadence; followed-courier letter. |

The stories have 71 primary scenes and 120 authored check-in events in total. Every character has six ask topics. Source validation enforces short lines, identifiers, references, expressions, action requirements, scene reachability, tool schemas, simulated labels, and chapter JSON budgets. The hidden `toy-regression` level is an actual scaffold generated with the CLI and can be played through the same runner.

## Release policy

Deadlock, Invisible Wall, and Feature Factory are the three **launch candidates**, as requested. Candidate is not the same as ready. The manifests remain draft while human review gates are pending, so the public hub displays **In development**, without Enter or Resume. A development server, or a server started with `PMFORGE_PROJECT_PREVIEW=true`, can open review previews directly. Explicit kill switches always take priority over preview access.

Do not mark a level ready until its founder review, six-to-eight-player Fun Rubric assessment, relevant domain review, manual screen-reader pass, compatibility matrix, and remaining performance checks have evidence. Automated tests do not fabricate those approvals.

## Preserved legacy work and migration limits

The original engines, content, voice packs, and saves are retained. `?legacy=1` opens the preserved runner for previously built levels; existing Deadlock play/debrief IDs continue to select its original event-log runner. No old saved run is silently rewritten into a different numerical model.

Seven existing campaigns still use their preserved level runtimes: Invisible Wall, Feature Factory, Silent Churn, Pivot Point, Legacy Fracture, Shadow Roadmap, and Public Fracture. They share catalog/availability gating but **have not been migrated to the new state schema**. Their code is not represented as if it were JSON-only shared-runtime content. A parity-preserving extraction of those custom tools and historical saves remains necessary before the entire twelve-level architecture can be called unified.

The new story previews are revised authored models, not certified numerically identical migrations of old runs. In particular, the new simplified Deadlock preview has not replaced the original engineering outcome model. Original behavior is frozen by the existing test suites and remains available for comparison and rollback. Numerical parity is an outstanding migration gate.

The richer staged mechanics are review implementations. A timing-sensitive E-stop and demo, evidence-dependent arguments, immediate state changes, and later callbacks are real; external Fun Rubric scores, clinical/logistics accuracy, recorded performances for the new script, final art, and comprehensive playtest balance are not claimed. Some general tool-library names currently share a generic card/slider host; they need their specialized acceptance checks before being advertised as finished reusable tools.

## Commands

```text
npm run test:platform
npm run platform:fuzz
npm run pm-level -- validate
npm run pm-level -- simulate deadlock 1000
npm run pm-level -- coverage
npm run pm-level -- new my-level
npm run pm-level -- voice-export deadlock
npm run pm-level -- flag deadlock off
npm run pm-level -- snapshot deadlock
```

The scaffold command refuses to overwrite a level, registers its manifest, and leaves it draft. Build-time placeholder generation produces distinct characters, readable expressions, themed backgrounds, licensed asset manifests, and a validation artifact. Content and flags remain local; no external LLM or account service is required to continue an already-loaded run.

## Verification records

`docs/platform-verification/` contains authoring validation, canonical paths, property-run coverage, browser captures, and the final summary. Unfired lines, events, and endings remain visible in coverage rather than being silently treated as tested.

The original Deadlock, Sacred No, Ghost Metric, and Trojan Horses suites were run as a migration baseline. They all passed. The new suite checks conditions, effects, action/reaction gates, save ordering, corruption, blocked storage, unknown-field retention, migration failure, branch isolation, private telemetry, and resource disposal.

The final verification pass includes a successful production build and TypeScript check, 20 shared-runtime tests, 60 completed canonical paths, and 6,000 seeded property runs. The expanded browser run passed 222 checks across six shared-runtime levels, with 19 automated WCAG A/AA scans, 66 visited scenes, 157 desktop/mobile captures, no console errors, native stop controls, blocked-storage/audio fallbacks, and stable global listener counts after twenty soft entries. These scans do not substitute for manual screen-reader or player testing. CI now runs the browser checks after the build and uploads the reports.

Production mobile Lighthouse performance on the Deadlock preview measured **80/100**, below the requested 85 threshold; LCP measured 5.3 seconds under simulated throttling. Earlier entrance accessibility Lighthouse runs scored 100 for the five corrected previews. The performance target remains open. Some branch-only content remains uncovered in the property report; do not interpret completion of 6,000 runs as complete ending or dialogue coverage.

The pinned production preview was then rerun independently: 163 browser checks passed with no errors or console errors (`browser.json`). The broader development run with every visited scene captured is preserved separately as `browser-expanded.json` (222 checks). The production preview at port 3002 is pinned to build `vdsmuBmlwUXxVSMHmBz-F`.

Remaining implementation work includes parity-preserving migration of the seven older runners; specialized implementations and acceptance checks for the generic tool-library placeholders; a JSON Schema export for the tool SDK; and the remaining performance work. Final artwork, new voice performances, domain review, cross-browser/manual accessibility checks, and the founder/Fun Rubric release gates are also outstanding. The preview must not be advertised as completion of the entire twelve-level platform specification.

Subframe MCP inspiration was actually consulted. The selected Raycast Keyboard reference informed the dark technical staging, restrained accent colors, and instrument-like controls; PMForge’s Inter and DM Serif Display typography was retained. No Subframe project was modified.
