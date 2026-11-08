# PMForge Hot Seat — setup and operation

Hot Seat is `/app/hot-seat`, separate from the scenario Interview section. It has eight fictional company worlds, two selectable personas (Nora and Kai; Ellis is retired), three pressure levels and 10/20/30-minute soft timeboxes. The app owns the fictional facts, curveball release, saved transcript and allowances. Gemini supplies a short, bounded follow-up and quoted observations. Prompt tuning is not model fine-tuning.

## Run locally

Use Node 24 and `npm ci --legacy-peer-deps`. Run `npm run dev`. The existing preview wrapper uses port 3002; the normal start command does not silently claim additional ports. Build with `npm run build` and serve with `npm start`. Prebuild prepares the Kokoro browser runtime. Python is not required in deployment; the checked-in previews were rendered offline. Standalone deployments include only the v2 Hot Seat speech runtime, previews and worker, excluding obsolete speech assets.


## Configuration and external calls

Copy `.env.example`. Install the key in the server's `GEMINI_API_KEY`, never a public variable or browser storage. A key alone does not enable AI. Default `PMFORGE_AI_MODE=guided` makes no external inference calls. `free-pilot` additionally requires verified free project, approved unpaid-service terms and regions, and explicit project RPM/TPM/RPD. `production` requires the existing approved personal-data and budget configuration; it is not enabled by this feature.

Hot Seat shares `PMFORGE_AI_MAX_TURNS`, daily sessions, concurrent sessions, project quota reservations, circuit breaker, budget controls and kill switch with legacy AI sessions. Set `PMFORGE_AI_KILL_SWITCH=true` or use the durable ledger control to stop admission. Keep `PMFORGE_AI_MONTHLY_BUDGET_USD=0` for the free pilot. No paid speech service is automatically selected. Do not use multiple projects/keys to evade limits.

In AI Studio inspect this exact project's model access and actual RPM, TPM and RPD before public activation. Owner confirmation established a Free plan, but actual account quotas have not been supplied. Current localhost diagnostic ceilings (4 RPM, 60,000 TPM, 30 RPD, one session) are deliberately configured caps, not verified provider entitlements. The localhost-only flag must remain off in a public deployment. Text model remains configurable, currently `gemini-3.1-flash-lite`; proposed 3.8 text/TTS models are not silently substituted.

### Speech

Kokoro is the single speech engine. Nora uses `af_bella` (Bella); Kai uses `af_sarah` (Sarah). These are female neural voice profiles, not operating-system voices. The worker accepts only those two IDs; retired saves use Bella. Browser speech and automatic paid speech substitution are absent from the playback adapter.

Two offline-rendered Kokoro previews play without the model download. Their manifest binds voice, exact caption and WAV checksum. Live interview lines are synthesized by Kokoro in a Web Worker after explicit preparation/Begin (roughly 90 MB model download from Hugging Face plus local WASM runtime). The UI states that download plainly. The 1.2.1 Kokoro prebundle requires the exactly pinned ONNX runtime `1.22.0-dev.20250409-89f8206ba4`; prebuild copies the matching runtime. Do not upgrade one side alone. Synthetic audio caches use `kokoro-female-v2` plus the actual voice ID and exact text, preventing reuse of the previous engine/voice clips. Failure surfaces an error and offers retry or explicitly selected captions; it never falls back to browser speech.

Optional microphone input still uses best-effort browser dictation with explicit permission, a real input meter and review-before-send. PMForge does not retain microphone recordings; browser processing is subject to its vendor's behavior.

Optional Gemini speech has a separate OFF gate: `PMFORGE_HOTSEAT_GEMINI_TTS_ENABLED`, `PMFORGE_HOTSEAT_TTS_FREE_VERIFIED`, reviewed positive TTS RPM/RPD and allowlisted model. It accepts only owned canonical interviewer lines, caches encrypted audio, and reserves its own durable speech capacity. It is not exposed by the current interface, live-verified or enabled in this release. Existing Deepgram/ElevenLabs integrations remain behind their original paid-service gates. There is no full-duplex Gemini Live or guaranteed realtime neural audio claim.

## Data and recovery

Free AI is fictional practice only: committed answers, relevant recent turns, company facts and quoted observations go to Google, whose unpaid terms may permit human review/service improvement. Consent and a pattern check are not a guarantee arbitrary input is safe. Personal career stories and employer-private content belong in local guided practice or an appropriately approved production service.

Unsent drafts and full original transcripts remain in IndexedDB. Schema version 5 adds separate hotSeats/hotSeatAudio stores without rewriting existing runs. Prior-version synthetic speech caches are preserved with old saves and removed by conversation deletion or device reset. New speech uses installed device voices. Hot Seat export and deletion are separate from general workspace backups/cloud sync; export each conversation you want to retain. Device reset includes both new stores. Server recovery state is encrypted for up to 24 hours; admission/scheduled cleanup removes expired payloads, with up to 90-day operational counters. Host backup retention is an operator responsibility. Account deletion includes both new server tables. Signing in does not strand a guest session if its verified guest cookie is still present.

A committed answer saves locally and server-side before generation. Run ownership, revision, request identity and a generation lease protect repeated/reconnected submissions. Failure preserves the answer and offers an explicit retry or guided continuation. The timer never cuts off input or lowers feedback. Debrief bands summarize supported quoted observations and are not calibrated scores or hiring readiness. Simulation exports cannot claim production impact.

## Hosting

This release reuses synchronous SQLite with atomic durable counters. It is suitable for a single Node server with a persistent protected disk and backups. Do not deploy this unchanged on ephemeral Vercel function storage or separate independent SQLite copies. A public multi-instance deployment needs the ledger/auth/publishing data moved to shared durable database transactions first. Hosting, persistent disk, database, egress, Hugging Face downloads and email costs are separate from the $0 inference budget. No new hosting or billing was activated.

## Verification and remaining launch work

Run `npm run test:hot-seat`, `npm run hot-seat:eval`, `npm run test:ai`, `npm test`, `npm run typecheck`, and `npm run build`. The separate offline evaluation has 28 fixture/attack checks; it does not certify expert conversational quality or live latency. Legacy scenario-AI creation browser CI was retired because its entry control was intentionally removed; legacy API/save compatibility tests remain. Manual browser evidence is in `docs/hot-seat-verification/`.

One real fictional Hot Seat response on 2026-11-08 succeeded: provider generation 2,385 ms, 621 input tokens, 309 output tokens, 90 thought tokens reported. This is one observation, excludes local speech synthesis/network/UI time, and establishes neither p95 nor safe public concurrency. At an illustrative 45-second answer cadence, configured 4 RPM permits fewer than three simultaneous speaking users before reserve/headroom; configured application admission is one. Actual launch capacity must use verified provider limits and a representative measured load test, including retries and token reservations.

Before public launch: verify actual provider/region/data terms and quotas; perform a representative latency/capacity test; conduct expert review of conversations/debriefs; test Safari, Firefox, Edge, iOS and Android speech/keyboard behavior on real devices; migrate hosting persistence as needed. Current browser testing is Chromium, not cross-browser certification.

## Sources and design decisions

- User's supplied PMForge_HotSeat_Design.html informed the room/lobby, with established DM Serif Display/Inter retained. Browser policy prevented rendering its local file; source was inspected rather than bypassing that restriction.
- A real Subframe inspiration MCP search returned Pear (https://www.ilovepear.com/); it informed restraint and composition, not a copied interface.
- Official Google SDK/docs were checked for structured generation and current TTS Interactions schema: https://ai.google.dev/gemini-api/docs/structured-output and https://ai.google.dev/gemini-api/docs/speech-generation and https://ai.google.dev/gemini-api/terms . Account access remains separate from documentation availability.
- Kokoro: https://github.com/hexgrad/kokoro ; ONNX Runtime MIT license: https://github.com/microsoft/onnxruntime/blob/main/LICENSE . Preserve bundled notices and model license when distributing weights.

## Known product limitations

No custom personal scenarios in the unpaid pilot. No numerical readiness claim, no expert-reviewed badge, no microphone recording/replay, no streaming/full-duplex speech, and no hidden extra summarization model calls. Authored silence reassurance is limited to once per question. Silence reassurance uses device speech; live interruption/backchannel timing has not been certified. Quality varies with browser dictation and device synthesis speed. A public production readiness claim would be premature until the launch work above is completed.

## Recovery polish (8 Nov 2026)

Shared dismissible error notifications surface existing blocking alert messages, explicit AI failures, connection/timeouts and uncaught errors without storing or logging their contents. Popups do not initiate retries or extra inference. Per-run retry controls remain authoritative. Missing-profile entry uses a naturally scrollable container, not the fixed onboarding layout. Auth surfaces release departed scroll locks; shared dialogs use counted locks so closing a nested dialog cannot unlock an active room. Workspace identity removal is detected on focus/visibility and while visible; Hot Seat stops writing the departed profile after reset. Hot Seat/help return URLs are allowlisted without allowing external redirects.

Onboarding has a shared minimum content footprint and equal-width primary buttons. Choices have no nested scroll container. Preview import is a separate optional fourth step, avoiding an oversized final choices page. At very short viewports or increased text size, the document can scroll rather than hiding content.

Subframe inspiration was consulted again (The Salad Project, cream and forest-green composition); established PMForge components remain in use. Voice switching, cancellation, timeout messages, popup events, nested scroll locks and safe redirects have regression tests. This does not certify the quality of every operating system voice or eliminate every possible runtime failure.

Verification for the device-speech/recovery update: 17 Hot Seat regression tests, 22 legacy AI tests, three authentication tests and 52 general/account tests passed, along with the production build and a zero-known-vulnerability production dependency audit. Browser evidence in `device-recovery.json` records five-width button measurements, scrollable signup and a real rejected-import error popup. Timeout event handling is tested with controlled failures, not by exhausting the provider. Existing user storage was not erased during QA. The current profile has no preview carry-over, so the optional fourth onboarding step was inspected in code rather than exercised in that browser run.

## Voice regression correction

The browser/device-speech simplification was a quality regression and is superseded by Kokoro female-only playback. The old device-speaker chooser is not used. The new engine guard test prevents browser speech or paid TTS calls from being reintroduced into the playback adapter. Voice/caption manifest checks verify two distinct audible mono 24 kHz previews with the intended Bella/Sarah assignments. These checks establish engine/voice identity and audio validity; listener preference remains subjective.
