# The Ghost Metric — implementation and verification

Entry: `/app/projects/ghost-metric`, from the full clickable project card. This replaces that project's generic landing screen with a dedicated simulation. Existing generic chapter/run URLs retain their earlier prototype data; saved logs are not silently rewritten.

## Design and navigation

The lab uses pearl surfaces, deep amber text, PMForge's display serif, a quiet three-column desk and an iridescent metric bubble. The left rail holds people and the latest commitment; the middle holds one active task; the right holds confirmed evidence and uncertainty. At phone widths, Now / People / Evidence / Case / Pause replace the side rails. Soft light, calm motion and first-use guides are persistent preferences.

Subframe was installed globally using the requested MCP URL and OAuth login succeeded. This running chat did not expose the newly configured server's tools (`unknown MCP server` when queried). Public [Subframe inspiration guidance](https://www.subframe.com/inspiration) and its [component library](https://www.subframe.com/library/overview) were consulted. No private canvas or MCP inspiration-search result is claimed. `AGENTS.md` records Subframe as the reference source for future design work.

## Playable flow

1. A covered paper/pin entrance leads to the role and premise. Enter the all-hands, hear Elena and Joyce, then inspect the bubble. Classify a retry as new demand or a repeated event; the case file records the assumption.
2. Spend 12 audit hours across six drawers costing 15 hours in total. Drawer readings arrive immediately through short character conversations; original sample rows remain inspectable. Join matching request IDs to quantify retries, and account IDs to quantify Orbitly. A wrong key costs one hour and explains the mismatch. Drag, tap-to-select and select/button controls perform the same action; rows align over 600ms.
3. Record a point estimate and low/high range before seeing the full anatomy. Only proved causes affect the visible evidence band. Decide to raise the concern now, spend two prep hours on a targeted verification, or stay quiet. Silence leads to Elena's explicit board-pack question and a saved wording receipt.
4. Choose who hears the concern and in which order. Deliver directly, as Metric v2, privately with Ravi first, or through a data room. Sequencing changes trust, delay, and whether Marcus learns through Slack. Build a headline, ordered evidence slide and explicit ask. Insufficient preparation limits the evidence slide to one card.
5. Define the replacement unit, counting rule, streaming rule, exclusions, cohort, reporting window and quality guardrails. A retrospective model updates as choices change. Confirm the exact wording, then red-team it with three fix hours. A cohort breakdown is a free transparency change rather than an exclusion of smaller customers.
6. A skeptical Ravi requests an independent check. Rollout requires a choice about migration capacity. The board sees the original range, any promise, the presentation and remaining loopholes. Confirm whether to own the correction, blame the process or keep the headline. The missed-audit/silence path produces the outside-challenge crisis.
7. A short conclusion precedes the complete 8.5M anatomy, a seven-moment causal trace, optional detailed receipts, missed tells and reflection. Three curated replay entry points create separate branches. The original run remains intact. Export includes the event log, receipts derivable from it, and reflection.

All conversations are short, sequential pop-ups with captions, manual Next by default, skip, replay, optional audio-ended advance, and pause/leave. The five distinct illustrated portraits have four static expressions; mouths do not animate. The [experience correction pass](GHOST-METRIC-CORRECTIONS.md) expands this to 150 prerecordings, a full cast/case introduction, spoken guides and paraphrase sets. Ravi uses an Indian English neural voice; other characters keep the established offline Kokoro production voices. No speech model runs in the product. An independently muted, seamless room-tone bed ducks beneath dialogue. Recordings are synthetic, not human actors.

## Engine and interpretation

`src/lib/ghost-metric/engine.ts` is a pure, deterministic reducer. Strict action/metric schemas reject unknown fields and options. Hours cannot be overspent, sources cannot be cited unopened, repeated joins cannot be farmed, and saved logs are append-only. A separate device-local Dexie database scopes runs to the workspace owner. Concurrent event edits reject stale revisions. Reflection, export, resume recaps, local analytics and full-reset cleanup are integrated. Dedicated Ghost Metric runs are not included in general workspace backup/import or account sync.

The authored truth is 3.0M retries + 3.0M streaming double-count + 0.8M internal checks + 0.7M partner tests + 1.0M real demand = 8.5M additional daily events. Real demand grows from 2.5M to 3.5M (+40%); 88.2% of the *growth* is ghost traffic. That is different from its share of all current calls. Unproved causes remain hidden until the debrief.

The clean +40% applies to the all-customer completion unit. Enterprise uses its own 1.6M → 2.4M baseline (+50%); paying accounts use 2.0M → 2.9M (+45%). Token and revenue-unit histories are unavailable in the supplied dataset and explicitly show no comparable forecast. Tag-only exclusions leave an authored 0.35M leakage assumption in the model. These are simulated model outputs, not measured business results or calibrated scores.

Two handoff inconsistencies were resolved explicitly:

- Finding all four causes costs at least 11 hours: three 3-hour drawers and two 1-hour joins. The Surgeon threshold is therefore 11 hours rather than an unreachable 10.
- Directly briefing Elena earns five CEO-trust points. Without a positive briefing effect, her trust could never reach the handoff's 60-point quick-mandate threshold. A gentler delivery can now lead to the specified immediate mandate after delay.

Additional delay is a correction/adoption forecast, not a ticking reflex timer. A follow-up verification is one targeted check, not an unlimited way to reopen every drawer cheaply. Expert review and human playtests remain pending.

## Motion and performance

The WebGL chunk loads when a run enters the lab. One canvas uses a thin-film shader bound to proved ghost mass, a real-growth core, capped resolution and demand-driven rendering (40fps desktop, approximately 29fps mobile). Desktop peels use at most 180 instanced fragments; mobile omits them. Intersection observation stops idle rendering offscreen. SVG and DOM evidence preserve the reading in calm/reduced-motion mode or when WebGL cannot render. GSAP handles row alignment, chart changes, room tint, evidence labels and the red-team marker. The reveal precedes its closing conversation so the pop is visible.

Sacred No now imports the entrance synchronously and renders it before local-data loading completes. Initial paper/pin states are in CSS, with static final states for reduced motion. This removes both the dynamic-chunk gap and the initial unanimated art flash.

## Verification

`npm run test:ghost-metric`: 23 tests, including P1–P10, reachable Surgeon/mandate outcomes, budget limits, invalid keys, range validation, strict undefined-field rejection, deterministic replay, evidence restrictions, and an exhaustive sweep of affordable audit/join orders to ensure the evidence band contains the authored truth.

`npm test`: 50 passing existing tests, including owner isolation and reset behavior. `npm run test:sacred-no`: 22 passing tests. The production build checks TypeScript and verifies every Ghost Metric line, speaker and recording. Every spoken line is at most 14 words.

`node scripts/verify-ghost-metric.mjs` drives isolated Chrome through the actual controls. It checks both correction and crisis routes, recorded playback, pause/resume of the same line, keyboard focus, blocked-audio fallback, drag and tap joins, the +40% preview, reflection recovery, replay isolation, back/forward, missing-run recovery, 320px/390px layouts, reduced motion and first-frame entrance coverage. See [browser checks](ghost-metric-verification/checks.json) and [raw report](ghost-metric-verification/browser.json).

The wider navigation harness also sweeps all 312 concrete URLs and their current scripts/styles. Browser QA does not substitute for the handoff's proposed 6–8 human think-aloud sessions, real OAuth completion, or professional screen-reader testing.
