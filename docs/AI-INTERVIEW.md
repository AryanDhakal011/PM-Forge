# AI decision room: setup and operations

The shared PMForge interview now supports **Guided practice** and an optional **AI interviewer**. Existing category workbenches, evidence costs, scoring, timers, pause/resume, local recordings, account sync and portfolio controls remain application-owned. AI output never executes a stage advance, spends evidence credits, changes a score or publishes anything.

## Operating modes and costs

- `guided` is the default. It makes no Gemini inference calls and works without credentials. Authored prompts are explicitly labeled Guided practice.
- `free-pilot` requires a verified Free project, approved terms/regions, configured project limits and a $0 monthly external-AI budget. It sends only server-selected fictional case positions, approved scenario context and unlocked facts. Scratch notes, outlines and personal career stories are excluded from the provider context. Workbench state passes privately through PMForge for stage validation; it is not all forwarded to Google.
- `production` needs explicit mode selection, an approved nonzero monthly budget, current token prices, a verified maximum billable-output allowance (including reasoning tokens), and terms/region review. Behavioral stories additionally need `PMFORGE_AI_PERSONAL_DATA_APPROVED=true`. Candidate text is untrusted and cannot grant permissions.

A key by itself does not enable inference. The app never enables billing, changes project plans, rotates keys, or automatically switches models, APIs or providers after failure. Hosting, SQLite storage, backups, bandwidth and any separately approved speech service have their own costs. Free inference does not make hosting free.

## Install the key

Set `GEMINI_API_KEY` only on the server, using the host's secret/environment configuration. Local development uses ignored `.env.local`. The supplied development key has been installed there and is absent from the environment examples. Do not paste it into browser code, public environment variables, commits or logs. Replace a chat-shared credential before public deployment through the owner's provider console; do not rotate projects or keys to evade quotas.

Copy the non-secret settings in `.env.example` or `.env.production.example`. Keep `PMFORGE_AI_MODE=guided` and `PMFORGE_AI_MONTHLY_BUDGET_USD=0` until the required configuration is verified. Default AI allowance is 10 replies and a soft 12-minute timebox. Neither limit reduces the rubric result. Users may continue guided with their existing work.

For local deterministic testing only: run a separate development server with `PMFORGE_AI_MODE=free-pilot`, `PMFORGE_AI_TEST_PROVIDER=mock`, and `PMFORGE_AI_ALLOWED_REGIONS=NP` (or a test region). Every screen identifies the test double. This flag cannot enable a mock in a production server. Never present its timings or responses as live Gemini results.

## Model and API verification

The official SDK is `@google/genai` 3.0.0. Both model and transport are configured centrally. `gemini-3.7-flash` was checked first: account metadata access succeeds, but the current model page says requests are routed to 3.8. The explicit application default is now `gemini-3.1-flash-lite` with the supported GenerateContent transport: it produced a validated follow-up in the controlled comparison, while 3.8 timed out or returned 503. This is a deliberate configured choice, not an invisible runtime fallback. `gemini-3.8-flash` and Interactions remain configurable reviewed alternatives.

`PMFORGE_AI_TRANSPORT=interactions` uses the current Interactions API, structured JSON, `store:false`, LOW thinking, no tools and no automatic continuation or retries. `generate-content` is an explicit compatibility configuration using the same maintained SDK; Google classifies that API as legacy but still supported. It uses JSON schema, LOW thinking, no automatic continuation and one HTTP attempt. No unsupported `minimal` setting or sampling override is applied to 3.7/3.8.

Read the current [model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash), [SDK documentation](https://ai.google.dev/gemini-api/docs/libraries), [structured-output guide](https://ai.google.dev/gemini-api/docs/structured-output), and [supported GenerateContent API](https://ai.google.dev/api/generate-content). SDK request configuration is verified by outbound-request tests; metadata access does not establish successful inference.

```sh
node --env-file=.env.local --conditions=react-server --import tsx scripts/ai-ops.ts verify-model
```

Open the actual project in AI Studio. Confirm its Plan is Free and billing is disabled, then copy its model-specific RPM, TPM and RPD values into `PMFORGE_AI_PROJECT_RPM`, `PMFORGE_AI_PROJECT_TPM`, and `PMFORGE_AI_PROJECT_RPD`. They default to zero, which closes external admission. These quotas are project-wide, shared across keys and other applications; a dedicated operational key is not a separate quota pool. Do not infer concurrency from RPD alone. See [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

The owner confirmed Free plan during implementation. Actual project limits were not supplied. Public AI admission remains closed. Controlled diagnostic ceilings in `scripts/probe-interview-ai.ts` are local test ceilings, explicitly **not** discovered project quotas.

## Eligibility and data handling

Review the current [Gemini terms](https://ai.google.dev/gemini-api/terms), [available regions](https://ai.google.dev/gemini-api/docs/available-regions) and [pricing](https://ai.google.dev/gemini-api/docs/pricing) before launch. The reviewed terms require adult, professional/business use in eligible regions; unpaid inputs/outputs may be used for service improvement and may be reviewed by people. Set an approved region allowlist and `PMFORGE_AI_TERMS_APPROVED=true` only after checking the intended audience and deployment.

Users must affirm adulthood, appropriate data use and their current approved region. This declaration is not independent age or location verification; the product must not target or knowingly admit children to the provider-backed experience. Region self-selection does not replace an operator's distribution review. The free pilot excludes behavioral stories entirely. Redaction is not treated as a way to make arbitrary confidential input safe: arbitrary scratch text is never sent to unpaid Gemini.

PMForge stores a bounded private AI session encrypted in its persistent SQLite database for at most 24 hours, then deletes it on cleanup. This supports candidate-first saving, idempotency, retries and reload recovery. It is separate from publishing and optional account transcript sync. Local transcripts stay in the existing browser workspace; optional audio remains on the device. Practice settings offers immediate private-session deletion, and member account deletion removes its private AI rows. Anonymous operational counters have a 90-day retention window and contain no full answers.

Run the cleanup command periodically using the hosting platform's scheduler. Data expiry is also checked on access and cleaned during session admission. Preserve the database encryption key row and protect backups; encryption does not replace host/disk access controls. Do not publish database files or private backups.

## Durable controls and failure behavior

SQLite contains session ownership, server-issued HttpOnly guest tokens, native state mirrors, request identities, candidate turns, leases, shared API limits, daily limits, conservative token/cost reservations and a circuit breaker. `BEGIN IMMEDIATE` serializes admission. Separate Node processes using the same database file share these controls; independent disks do not. The deployment remains one persistent Node/SQLite service, not horizontally scaled serverless replicas. A multi-host deployment needs shared transactional storage first.

The server validates ownership, consent, scenario identity/version, expected server revision, native stage gates, evidence additions and cost eligibility. Native advances and candidate turns have separate idempotent identities. One generation lease is permitted per run. An answer is saved locally and in the private server session before inference; retries do not append it again. Server context is bounded to 14 KB, response to 700 tokens, and normal timeout to 20 seconds (configurable 3–30 seconds with `PMFORGE_AI_TIMEOUT_MS`). Unknown usage retains its full conservative reservation. At most two attempts are permitted for a committed answer, including explicit retries. Retry-After and circuit cooldowns are honored; there is no background retry loop.

Structured output requires exact candidate anchors and valid source IDs. It rejects unknown metrics, locked references, invented quotations, duplicate questions, forbidden actions, unsupported debrief citations and premature debriefs. Provider schemas disallow debrief observations before closure. These guards reduce specific failure classes; they do not prove that every possible semantic hallucination is eliminated. Independent human review remains necessary.

After four seconds, processing feedback explains the delay. Users can continue guided immediately. A late response is retained for inspection without taking control of the guided prompt. Failure never lowers a score, removes the candidate answer, or fabricates an AI reply.

Paid Deepgram/ElevenLabs calls additionally require explicit production mode, a nonzero approved AI budget, `PMFORGE_PAID_SPEECH_APPROVED=true`, a separate nonzero voice budget, the legacy voice enable flag and appropriate keys. They are blocked in $0 modes even if keys exist. Typing and consented best-effort browser speech remain available without those services. Browser speech may involve the browser vendor's processing and is not guaranteed private or universally available.

## Operations

Use the same database path as the running app:

```sh
node --env-file=.env.production --conditions=react-server --import tsx scripts/ai-ops.ts status
node --env-file=.env.production --conditions=react-server --import tsx scripts/ai-ops.ts kill
node --env-file=.env.production --conditions=react-server --import tsx scripts/ai-ops.ts resume
node --env-file=.env.production --conditions=react-server --import tsx scripts/ai-ops.ts cleanup
```

The DB kill switch is shared by processes. `PMFORGE_AI_KILL_SWITCH=true` also blocks admission at startup/runtime configuration. Neither switch promises to cancel a request already running at the provider. Resume still checks terms, quotas, budgets and the provider circuit. CLI output contains operational counts and sanitized codes, not full answers or keys. The standalone artifact and Docker runtime include dependency-free `ops/ai-control.mjs`. Use `docker compose --env-file .env.production exec app node ops/ai-control.mjs status` (or `kill`, `resume`, `cleanup`) against the shared volume. No TypeScript development runtime is needed in the container.

## Capacity and latency

Admission uses 70% of configured project RPM, TPM and RPD, plus the configured concurrent-session limit. Token reservations include the complete bounded payload, an instruction allowance and output allowance; production cost reservations use explicit configured rates and do not release uncertain spend. Paid mode also requires `PMFORGE_AI_BILLABLE_OUTPUT_TOKEN_RESERVE` to cover the selected model’s maximum billed output, including reasoning. Its default of 0 blocks paid admission. Confirm the provider’s output-limit semantics before setting it; the visible 700-token response limit is not assumed to bound every billable token. Reservations do not shrink after uncertain or failed attempts. These are conservative application controls, not a provider billing cap. The owner must also configure provider billing safeguards before any paid deployment.

For measured average candidate pacing `P` seconds/turn and conservative input size `T`, a planning bound is:

`concurrent sessions <= min(0.7 * RPM * P / 60, 0.7 * TPM * P / (60 * T), configured concurrency)`

Account for other project traffic, retries, burstiness and provider latency. Use RPD separately for daily admission; a session can consume up to twice its turn cap when explicit retries are used. Actual project quota and a paced load test are required before claiming user capacity. No numerical capacity claim is established yet.

The four-second p95 first-usable-reply target is **not passed** by mocked results or isolated probes. Live diagnostic outcomes and available token usage are in `docs/ai-evaluation/`; the operational ledger includes failures and timeouts. Two Interactions attempts timed out at approximately 12.2 and 20.2 seconds, and a GenerateContent 3.8 attempt returned HTTP 503. A Flash-Lite response reached the semantic guard and was rejected for premature debrief content; the schema was tightened rather than accepting it. After that constraint was added, a Flash-Lite follow-up passed grounding validation in 2,735 ms. The usable sample reported 593 input tokens, 160 output tokens and 173 thought tokens. This single usable sample does not establish p95, sustained quality or project capacity. Keep public admission closed until actual quotas, expert review and the agreed load test support opening it.

## Evaluation and release checks

`npm run test:ai` checks provider request shapes, guardrails, ownership, persistence, concurrency, retry limits, quotas, deletion, $0 speech policy and legacy-save compatibility. `npm run ai:eval` runs 28 held-out fictional cases across seven categories and three difficulties with a deterministic mock. Fixtures in `evals/interview/cases.ts` are separate from prompt-development examples in `prompts.ts`. The failure report records failure classes. This is prompt/scenario tuning, not model fine-tuning; no user transcripts become training data.

A deliberately enabled live evaluation uses the same durable admission and accounting path:

```sh
node --env-file=.env.production --conditions=react-server --import tsx scripts/evaluate-interview-ai.ts --live --case=root-cause-0
```

It obeys operator limits and records blocked cases rather than bypassing quotas. Behavioral cases remain guided-only without approved production processing. Review repetition, unsupported facts, leading questions, relevance, changed-direction behavior, and debrief specificity with qualified humans. If persistent failures justify fine-tuning later, re-check current provider support and obtain an explicit separate training/hosting budget first.

## Design reference

Subframe inspiration was consulted through its MCP search. The selected [Canopy reference](https://canopyseo.com/) informed readable editorial hierarchy and compact receipt-style evidence treatment. PMForge retains its own cream, green and amber palette, typography and interaction conventions; no reference assets were copied.


## Current local review (8 November 2026)

There is one review address: **http://localhost:3002**. Other PMForge listeners were stopped. Both `npm start` and `npm run dev` now explicitly default to port 3002 and loopback; development uses a separate `.next-development` cache. An occupied port fails rather than silently selecting a new one.

The owner requested immediate real-provider testing and confirmed a Free project. The ignored local environment now enables `free-pilot` with `PMFORGE_AI_LOCAL_TEST=true`, the existing server key, Nepal-only self-declared eligibility, a $0 budget, and restrictive application test ceilings. These ceilings are **not** verified Google RPM/TPM/RPD. The service can still reject requests at its own quota; failure preserves the run and offers guided practice. No billing, project/key rotation, paid fallback or paid speech was enabled.

Local testing is refused when `PMFORGE_DEPLOYMENT=production`; the route also refuses non-loopback hostnames in local-test mode. The review server binds to 127.0.0.1. Deployment preflight rejects this local flag. Production examples leave it false. A public pilot still requires actual project quota and audience/data review.

A real browser session on port 3002 selected an approved fictional position and received a validated Gemini follow-up in **1,934 ms**. The private scratch draft remained local and the answer/source binding was checked. See [live UI verification](pass-two-live-ai/browser.json). One sample is not a p95/capacity or expert-quality pass. Category/difficulty instructions, examples and deterministic evaluations are prompt/scenario tuning; model weights have not been fine-tuned.

To try it: Practice → choose an eligible fictional scenario → AI interviewer → review the age/data/region disclosure → Begin interview → select and explicitly send a case position. Guided remains the default selection. Behavioral/personal career stories remain guided without approved production processing.
