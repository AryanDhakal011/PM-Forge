# PMForge product MVP

The landing now leads into a runnable, local-first product, with the supplied interview handoff as its content source. The existing landing art direction and scroll work are retained. This report describes the new product work; the earlier rendering and scroll reports remain historical baselines.

The first-session follow-up adds a guided Easy starter, a soft eight-minute countdown, provisional bands, a 90-second spoken synthesis, a timed reflection release, a guest save/export moment, Google-first entry, review progression, and local activation measurement. See [prelaunch improvements](docs/PRELAUNCH-IMPROVEMENTS.md) for the current flow and calibration procedure. Latest verification includes the new guided first-run workflow.

Real World Projects now adds 12 three-chapter campaigns under `/app/projects`. See [the projects report](docs/REAL-WORLD-PROJECTS-REPORT.md) for its authored state engine, consequence traces, replay, expanded backup/sync behavior and verification. Its addition supersedes the earlier product-only test count below.

## Implemented

- **Entry and identity:** modal and full-page entry, instant guest workspaces, three-step skippable onboarding, safe deep-link targets, and genuine Better Auth integration for Google/GitHub when configured. A local email entry is no longer presented as account authentication.
- **Workspace:** Home, recommendations, resume, command search, desktop navigation, mobile bottom navigation, light/dark themes, motion/sound/haptic preferences, and account/data controls.
- **Content:** all **63 unique draft scenarios**, exactly seven categories × three levels × three questions, imported from the provided handoff. Scenario facts, primers, traps, traces, and alternative paths are preserved. Drafts are labelled, public figures are unverified handoff references, and question-bank routes are `noindex` until review.
- **Interview engine:** preflight; easy-level fundamentals; goal pin; evidence requests and budgets; category workbenches; locked decisions; deterministic pushback/probe/pivot events; structured synthesis; feedback; replay; self-calibration; gated expert reasoning; targeted retries and decision records. Time pressure is optional and extendable.
- **Seven workbenches:** diagnostic segment cutter and hypothesis ranker; product-sense idea cuts; strategy scope board; metric tree and test/guardrail design; live estimation dials with unit checks; component-based architecture sketch; behavioral scene/story builder with optional real browser dictation.
- **Persistence:** IndexedDB via Dexie, debounced drafts, decision snapshots (latest 20 per run), pause/resume, revision conflict detection, scoped local imports, deterministic guest-to-member migration IDs, and explicit carry-forward consent. Demo records do not affect official scores or coverage.
- **Outputs:** progress, history, bookmarks, decision-record CRUD, Markdown copy/download, print, workspace export/import/reset, session revocation, sign-out cleanup, and configured-account deletion.
- **Offline:** production service worker caches anonymous app shells and static assets, never authentication/API responses. Previously visited runs recover from the device copy without network access.
- **Public routes:** a server-rendered, filterable question catalogue, question briefs, field-note references, resources, how-it-works, content policy, changelog, contribution guidance, offline/maintenance pages, and updated privacy/terms. Legacy dashboard/practice/learn entry points have real destinations.

## Motion and rendering

The user’s request for an immersive product takes precedence over the routing handoff’s blanket “no 3D in /app” suggestion. The compromise is deliberate: one lazy, on-demand Three.js decision instrument on capable desktop Home screens. It responds to actual practice progress and stops drawing when still or offscreen. Mobile and reduced motion use a still SVG drawing. Other workbenches use semantic HTML/SVG and finite GSAP transitions rather than additional canvases or permanent animation loops.

The product uses native scrolling. Landing Lenis integration is disabled on `/app` and onboarding. The existing landing scene lifecycle, DPR policy, and scene implementations were not replaced.

Production Chromium measured **zero WebGL draw calls over two seconds at idle** on desktop Home, one canvas allocated there, and zero product canvases on mobile/reduced-motion Home. After entering through the landing and onboarding, a fresh Home navigation reported **2,200,241 script resource body bytes**, including the deferred Three.js engine. Service-worker cache responses can expose decompressed body sizes; this is not a compressed transfer budget measurement. The handoff’s 150 KB route-JS target is **not certified**. Physical-device Lighthouse/LCP and compressed route-payload budgets still require a dedicated launch audit.

## Verification

- `npm run typecheck` passes.
- `npm run build` passes with the expanded route map.
- `npm test` passes **15 engine/content tests, one calibration-tooling test, and one account-backend integration test**.
- Engine simulations cover **378 strong paths** (63 × 3 variants × 2 defensible first choices), trap paths, deterministic scoring, no keyword rewards for general free text, budget limits, calibration gates, arithmetic, redirects, and import validation.
- The account test creates two isolated test users and real signed test sessions against a temporary SQLite database. It verifies migration, ownership isolation, unauthenticated rejection, wrong-origin rejection, stale-version rejection, tampered-cookie rejection, and account-data deletion. It does **not** claim a live Google/GitHub round trip.
- All **25 production browser assertions** pass: landing modal → guest → onboarding → library → guided Easy RCA run → feedback → one-grade reflection → expert → saved record. Checks also cover the spoken timer, evidence-backed bands, first-debrief storage/account/export prompt, session-one activation, plain-grid information parity, Signal CTA/fallback pinning at 860 px, pause/reload, inert user HTML, offline recovery, responsive layouts, theme, reduced motion, and API rejection. Full-run debrief sequencing remains covered by engine tests.
- All seven category workbench screens were inspected with prepared local fixtures. The estimation workspace passes the 320 px overflow check. Pending draft persistence during SPA navigation and external revision conflict detection also pass. These are screen/interaction checks; the full browser click-through uses Root Cause Analysis.
- Public/product route checks, legacy redirects, server-rendered catalogue filtering, and unknown public question 404 checks pass. The app shell uses Next.js streaming; an unknown in-app question renders the framework’s not-found/noindex response after the streamed shell.
- Raw results: `docs/product-verification/results.json`, `workbenches.json`, and `routes.json`. Local PNG captures are ignored by Git.

## Configuration and launch limits

1. **OAuth credentials are not present.** Google/GitHub options therefore show their configuration state and guest mode works immediately. Copy `.env.example` to `.env.local`, set a high-entropy `BETTER_AUTH_SECRET`, the deployed `BETTER_AUTH_URL`, and the desired provider credentials. Provider callback paths are `/api/auth/callback/google` and `/api/auth/callback/github`.
2. **The runnable server uses Better Auth + Node SQLite in `.data/pmforge.sqlite`, not a provisioned Cloudflare D1 service.** There is no fake hosted database. Cloudflare D1/Drizzle/Hono migration, distributed rate limiting, deployment configuration, and a real OAuth-provider round trip remain deployment work. Do not deploy this Node SQLite setup unchanged to Workers.
3. **Content remains draft.** Human PM/SME review, verification of public statistics, granular scoring calibration, and legal review of account-facing policies remain necessary before public launch. The current engine is a working configurable MVP, not a claim that every authored rubric is validated as a hiring assessment.
4. **Voice relies on browser support and permission.** The text path is complete. No microphone/audio behavior is simulated and PMForge stores no audio. Live speech-service validation and screen-reader/physical-device audits remain human acceptance work.
5. **Content version 1 is the shipped bank.** Runs record the content version; a complete historical content-version archive and migration tool should be added before publishing materially changed questions. Multi-device sync currently uses validated, versioned workspace snapshots, rather than the handoff’s complete per-entity D1 API/schema.

## Run locally

Use Node 22.13+ (verified here on Node 24.4), then:

```text
npm install --legacy-peer-deps
npm run typecheck
npm test
npm run build
npm run start -- --port 3001
```

Open `/app` to enter the product or `/` to start from the landing. Guest mode needs no environment configuration. Use the same origin/port when returning to device data; browser storage is origin-specific.

The changes remain local and uncommitted above the prior performance checkpoint. No public deployment or external user messages were created.
