# First-session and prelaunch improvements

## New flow

The first newly created run for a profile is guided Easy. An Easy brief uses that scenario; a Medium/Hard brief explicitly offers the named RCA Easy starter instead. Subsequent runs retain the full workflow. Existing runs are preserved.

Guided sequence: brief → evidence/workbench → one pushback → synthesis with a 90-second spoken rep → feedback → reflection → expert reasoning → next move. Warm-up, goal pinning and the separate investigation screen are combined. The goal is automatically pinned after the brief; evidence still has a budget. The eight-minute countdown is a soft planning target, continues through reflection, and never cuts off work. Eight minutes is a design target, not a measured completion-time claim.

Full workbenches are desktop-recommended. Mobile remains supported for the complete workflow, with guidance about reading, short guided reps, speaking and reflection. No device exclusion is introduced.

## Activation

Definition: the same first guided run reaches feedback and records at least one self-grade before leaving reflection, in the initial practice session. A session expires after 30 minutes of inactivity. The session token survives reloads and tabs; active interview practice refreshes it. A two-minute gate release without a self-grade is `reflection_skipped`, never activation.

Idempotent events in IndexedDB meta: `first_run_started`, `debrief_reached`, `reflection_finished`, `reflection_skipped`. Progress shows the local funnel and exports the events. No production telemetry endpoint, cross-device identity stitching, or population conversion rate is claimed. Run/session references are local pseudonymous identifiers; export and browser data can be lost. Aggregate analytics still needs a deliberate deployment and privacy decision.

## Feedback and calibration

User-facing numeric rubric totals, percentages and score deltas are removed from runner, history, progress, Home and landing interview feedback. Bands are **Developing / Solid / Strong**. Internal deterministic numbers remain available to the engine and comparison tools. Evidence behind a band includes requested observations, the linked observation, committed direction and guardrail. A limitation statement explains that the rubric cannot judge full written reasoning, originality, truthfulness or spoken delivery.

Collect consented sample runs across categories, difficulty levels and weaker/stronger responses, check free text for personal information, and have two or three independent PM experts rate 30 samples. Agent-generated ratings are not independent expert review. Tooling:

```text
node --import tsx scripts/prepare-calibration.mjs workspace.json calibration-output
node scripts/compare-calibration.mjs calibration-output/expert-ratings.json calibration-output/engine-key.private.json calibration-output/report.json
```

Preparation requires 30 completed runs. It removes profile identity and timestamps from sample answers, but **free text still requires manual redaction**. Share only blinded samples and the empty ratings form. Keep the engine key private until ratings are locked. Supply independent expert IDs, bands and rationales. Comparison enforces 30 matched samples and a two/three-person panel, reports engine/consensus agreement, disagreements, unresolved ties and expert unanimity. Inspect disagreement by category and dimension, revise, and validate on held-out samples. Numbers stay hidden even after a comparison passes; a human calibration decision and documented release review are required.

Retry seeds now alter simulated percentage observations, order the decision choices differently and introduce scored trust/retention constraints. Estimation also varies modeled economics. Public reference figures do not change. Variants preserve the broad diagnostic mechanism; they are not a validated adversarial anti-gaming system.

## Keep this run and sign-in

After reflection at the first expert debrief, guests see **Keep this run**, account entry, full workspace export and a persistent-storage request. The persistence outcome is displayed and can be retried. No unsupported promise of permanent storage or synced data is made.

Google is primary; GitHub is inside Other sign-in options. Missing providers remain honestly disabled. Email links are the preferred next sign-in alternative to evaluate for non-Google users; shipping them needs a configured transactional email service and deliverability testing. LinkedIn is deferred until demand justifies its provider setup. Neither is presented as working.

`npm run launch:check` fails when real Google/auth environment configuration or two documented expert reviews per scenario are missing. This is a configuration/review preflight, not proof of a live OAuth round trip or a deployment. Current credentials are absent and all 63 scenarios still await real reviewers.

## Spoken synthesis and reflection

The synthesis rep has a 90-second active-tab timer, pause/resume, persistent elapsed seconds, and self-checks for recommendation/evidence structure and clear tradeoff/next-step delivery. It does not record, transcribe or automatically assess speech. A text/accessibility path is explicit and does not affect the band. Browser dictation in behavioral fields remains separate.

Reflection opens expert reasoning after one self-grade or 120 seconds from reflection entry. Grades never have to agree with the engine. Timed release is distinct from completed reflection.

## Coverage visualization and content review

The instrument uses unique completed-scenario coverage, not raw repeat-run count. Its 63 marks fill from actual coverage; the mobile SVG has the same marks. Both views display the same completed count and weakest recorded dimension. A plain coverage-grid switch allows direct comparison; view selections are logged locally. Real user task testing/A/B results are still pending; no preference or usability win is claimed.

`src/content/review-registry.json` is the review source of truth. An empty registry means Draft · expert review pending. Add actual distinct expert review IDs only after documented review; two or more yield Reviewed by N experts. Changing the label never substitutes for reviewing content.

## Verified storage policy

WebKit documents removal of script-writable storage after **seven days of Safari use without user interaction with the site**, rather than a simple seven-calendar-day countdown. Home Screen apps have an exemption described by WebKit. Safari 17+ exposes persistent-storage APIs and grants requests heuristically. Persistence is browser-controlled; export/account recovery remains important.

- [WebKit: Tracking Prevention](https://webkit.org/tracking-prevention/)
- [WebKit: Full Third-Party Cookie Blocking and More](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- [WebKit: Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)

## Verification

- Production build and type checking pass.
- Seventeen automated tests pass: fifteen engine/content tests, calibration-tooling fixtures and signed-session account isolation.
- Twenty-five production-browser assertions pass, including the guided Easy path, actual spoken timer progression, accessibility alternative, feedback without precise scores, immediate release after one grade, Keep this run, activation, offline recovery, grid parity, responsive layouts and zero idle WebGL draws.
- All seven full workbench fixture screens pass interaction/overflow checks, including 320 px estimation, navigation draft persistence and revision conflicts.
- The loader fallback’s nested overflow issue is fixed; the landing Signal sticky panel now passes the recovery-path check.
- Expert fixture ratings used to test comparison scripts are synthetic test data, not completed human calibration. Eight-minute usability and visualization preference tests still require participants. Live OAuth remains blocked by absent credentials.
