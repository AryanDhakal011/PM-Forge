# The Pivot Point

Playable at `/app/projects/pivot-point` and `/app/projects/pivot-point/play`. The gallery enters the dedicated, full-screen simulation directly. No workspace authentication, sidebar, or top bar is required for this level.

## What is playable

27 authored scenes across three chapters: the triage dilemma, the CMO standoff, and the patient pivot. An illustrated hospital entrance, nine fictional people with five expression variants each, seven limited-access evidence drawers, 1,000 fictional sampled patients, twelve case allocations, a cost ledger, an access map, care-model controls, a frontier comparison, three-year uncertainty testing, funded quality guardrails, five launch-day moments, evidence-linked board review, patient letters, and a decision-trace debrief.

The five possible outcomes are Excellence for few, Reach with care, Resource strain, Talent drain, and Balanced and defended. Archetypes describe the player's approach without assigning moral worth. The player may preserve the completed year and replay its seed or fork before launch. Preset counterfactuals are explicitly labelled projections rather than full replays.

## Model and content

All patient identities, stories, numbers, operational events, and health-system details are fictional. The persistent on-screen label is: **Simulated health network, authored scenarios, expert review pending.** No real patient information is requested or stored. The game is not medical advice.

The initial authored report figures follow the handoff. Capacity depends on budget allocation, facilities, staffing, and eligibility. Community supervision, escalation, and audits increase costs and expected recovery and reduce quality risk. The map uses a deterministic ranked sample and funded capacity; its reach predicate also determines each patient's letter. The mapped underserved percentage is calculated from that sample, rather than copying an unrelated constant. Premium cross-subsidy grows the modeled budget while introducing talent and access tradeoffs. Scale ranges are illustrative sensitivity projections, not clinical forecasts.

Scenes only expose the tools relevant to that moment. Evidence must have been opened, or a simulation actually run, before it can be linked. Full CMO support requires safeguards plus scalability evidence. The player's direction rationale appears verbatim in chapter consequences, board preparation, and review. Report blind spots stay unknown rather than being presented as discoveries.

Clock movement follows authored monthly scene transitions. Difficulty changes coaching visibility, not hidden medical assumptions. The final commitment allocates leadership attention rather than fabricating extra funding. Audio is a quiet synthesized room tone and interaction chimes, muted by default; there are no recorded voice performances. Portraits and backgrounds are original parametric SVG placeholders, not final WebP artwork.

## Isolation and recovery

- The server route honors `PMFORGE_PIVOT_POINT_ENABLED=false` at both entry URLs. Saved runs remain intact.
- The experience is dynamically imported only on its own route. Map, engine, content, and level CSS are not imported by the gallery or shared workspace shell.
- State transitions and launch randomness are deterministic; a seed can reproduce an entire strategy run.
- Saves use a versioned, checksummed envelope, staged write, previous-state backup, bounded schema validation, and backup recovery. Save failure is reported and export stays available.
- The level and scene have error boundaries, with a route error fallback. Styles and fonts are scoped; no global palette is mutated.
- Canvas uses at most 1,000 sample dots, renders only when needed, observes visibility, and disconnects its observer and listener on exit. There is no WebGL dependency.
- Audio nodes and contexts, visibility handlers, and test hooks are disposed on exit. Reduced motion disables scene and chart animation. All drag interactions have a menu or button alternative.
- Choice telemetry stays on the device and is only exported on request. No new analytics service is used.

## Verification

`npm run test:pivot-point` runs engine tests, the authoring validator, and ten complete reducer-driven smoke paths. The validator also runs during `prebuild`; CI runs the full level suite before building.

`node scripts/verify-pivot-point.mjs` exercises a full hybrid path in Chrome, takes desktop and mobile screenshots, tests save/resume and gallery entry, checks widths at 390 and 320 pixels, and performs twenty soft navigation cycles. Reports are in `docs/pivot-point-verification/`. `?qa=1` exposes the scoped test API: `advance`, `choose`, `state`, `solve`, and `setSeed`. It is removed on exit.

The final production browser run completed 103 checks with no console errors, including four complete strategy playthroughs. The production entrance achieved Lighthouse accessibility 100. Window/document listener counts were stable across twenty soft navigation cycles; this is a bounded resource check, not a proof of zero long-term memory growth. The production build, fifty base product/account tests, thirteen level tests, ten engine smoke paths, and the two-route shutdown switch also passed.

Design inspiration was actually searched through Subframe MCP. The selected reference was [General Dental](https://www.generaldental.ca/): spacious healthcare editorial typography, a warm light base, and strong color blocks, adapted to the handoff's white/teal palette and existing PMForge fonts. No Subframe project was modified.

## Before public release

A clinician and health-equity reviewer must review the stories, model, and tone. This human review is pending. Forecast calibration, playtest balance, final artwork, and the illustrative uncertainty ranges also remain prototype work. The implementation must not be advertised as clinical evidence or a validated allocation policy.
