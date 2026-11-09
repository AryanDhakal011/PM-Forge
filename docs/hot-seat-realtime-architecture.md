# Hot Seat realtime architecture — implementation status

9 November 2026. This implements an **opt-in realtime pilot path**, not a claim that the attached handoff's production acceptance criteria have passed. No vendor credentials, operating budget, deployment region, or listening panel were available in this workspace. Existing Gemini/guided runs remain readable and resumable.

## Three-line decision log

1. Use LiveKit Agents for the separate realtime media worker; keep Next.js responsible for identity, admission, authoritative state, retention, and durable controls.
2. Wire Deepgram Flux + Cerebras gpt-oss-120b + Inworld TTS-2 as a **provisional reference stack**, supported by current official docs and installed SDK types; a comparative winner has not been selected.
3. Keep external realtime admission disabled and the budget at zero until account access, terms, voice auditions, measured latency, failover, and load tests are approved; preserve local guided practice and legacy runs.

## What was verified

The previous implementation calls a browser worker running Kokoro q8 in WASM, waits for the complete PCM result, creates a WAV, and only then starts playback. The text provider waits for a complete structured Gemini response before invoking speech. These are verified code paths, not measured allocations of the reported minute-long delay. There is no deployed GPU Kokoro endpoint in this repository to benchmark. No fresh browser/CPU/GPU latency number is claimed.

The new path is:

Browser microphone/typed control → room-scoped LiveKit WebRTC session → separate Node agent → Flux STT → streamed Cerebras reply → guarded sentence buffer → persistent Inworld TTS plugin → streamed room audio and synchronized transcription. The browser does not use SpeechRecognition or download Kokoro for this mode.

The installed `@livekit/agents` and plugins are 1.9.5. The server SDK is 2.19.2 and browser SDK 2.23.0. Worker and app TypeScript checks pass. Worker import succeeds without connecting providers. Dependency audits pass after targeted transitive overrides; these overrides are recorded in the worker lockfile.

Official references checked: [Flux and its Node STTv2 API](https://docs.livekit.io/agents/models/stt/deepgram/), [Inworld Node plugin](https://docs.livekit.io/agents/models/tts/inworld/), [Cerebras plugin](https://docs.livekit.io/agents/models/llm/cerebras/), [Cerebras model catalog](https://inference-docs.cerebras.ai/models/overview), [turn handling](https://docs.livekit.io/agents/logic/turns/), and [Inworld pricing](https://inworld.ai/pricing). Vendor latency claims and third-party rankings in the handoff are not measurements of PMForge.

## Application boundaries

- `src/lib/hot-seat/realtime/`: configuration gates, request/event validators, HMAC worker authentication, durable admission/usage ledger, prompt version, sentence guard, evaluation fixtures.
- `/api/hot-seat/realtime`: status, start, room connection, pause, end, deletion. Origin checks, bounded bodies, existing authenticated/server-issued guest identity, request limits, room-only tokens with microphone publishing and data for the allowlisted RPC controls. No room administration or inference grants reach the browser.
- `/api/hot-seat/realtime/worker`: signed, time-bounded worker events. One worker claims a room. Candidate text commits before generation. Event IDs bind to payload hashes; replay does not duplicate turns, observations or metrics. Quotes must match actual candidate turns. Models cannot change scores, release evidence, publish cases, or change session permissions.
- `services/hot-seat-agent/`: separate long-running worker and Dockerfile. Explicit Flux end-of-turn, Silero interruption detection, 700–2000 ms endpointing, 200 ms interruption threshold, no speculative generation. These settings are configured targets; observed behavior is still a live test gate.
- Client: same Hot Seat styling, explicit provider consent, connect/mute, manual “I'm done,” stop speech, typed answers, transcript, pause/save, end, and guided continuation. The existing debrief and portfolio path are reused.

The model reply is plain streamed speech, with one relevant question and a 60-word bound. Sentence checks run before each chunk enters TTS; they block unsupported numbers and obvious unsafe output. They are **not** a proof of semantic grounding. A separate bounded asynchronous observation call runs after a reply commits, validates exact supporting quotations, and does not delay speech. Invalid/unavailable observations remain unassessed.

LiveKit manages interruption cancellation and the played conversation history, with aligned transcription requested from Inworld. PMForge stores the framework's committed assistant text and interrupted flag. No custom guessed word rate is used in the realtime path. Exact playback alignment, truncation, and interruption timing must still be demonstrated with live audio.

## Setup

1. Install root dependencies with `npm ci`. In `services/hot-seat-agent`, run `npm ci`; its runtime and lockfile are independent of the app.
   Run `npm run download-files` in that directory to prepare the framework's VAD assets before a pilot. This preparation command is exempt from inference admission; it does not generate interviewer speech.
2. Create/configure a LiveKit project or self-hosted service, obtain its server credentials, and select a worker host near the target users. No project, paid account, GPU, or hosting resource was provisioned by this change.
3. Put LiveKit credentials, a strong shared worker secret, provider review flags, voice IDs, and explicit positive admission budgets in the **application's** private environment. See root `.env.example`. No public-prefixed secrets.
4. Put the same LiveKit/worker settings and the Deepgram, Cerebras and Inworld keys in the **worker's** private environment. See its `.env.example`. Provider keys do not need to be installed in Next.js. Choose and audition actual female voice IDs; there are no guessed voice defaults and Ellis remains retired.
   The installed Inworld plugin expects the console's Base64 credential string and adds `Basic ` itself. Do not prepend that prefix to the environment value.
5. Review each account's actual models, terms, retention/training settings, region routing, limits and invoice rates. Only then set the two approval flags and `PMFORGE_REALTIME_ENABLED=true`. These flags are assertions by the operator, not automated proof of a DPA or account entitlement.
6. Start locally from the worker directory: `node --env-file=.env.local --import=tsx src/agent.ts dev`. Production uses `start` instead of `dev`. A container image can be built from the repo root using the supplied Dockerfile. Keep the worker warm and verify VAD assets during image/release preparation.
7. The app remains on port 3002. The worker is a separate service connecting to LiveKit; it is not another frontend preview port. Worker model downloads and transport/hosting/storage charges are separate from provider inference charges.

## Operations and persistence

`npm run hot-seat:voice:ops -- status` reports configuration blockers, anonymous usage, conservative monthly reservations, and actual metric sample counts/p50/p95. Empty samples are null. `kill`/`unkill` controls the shared realtime kill switch. Worker heartbeat checks the application lease every five seconds; new operations reject immediately after a kill, while in-flight media can take up to the heartbeat/close interval to stop.

The current database is SQLite on a persistent application host. Transactions coordinate processes using **the same database file**. This is not independent multi-region storage and is unsuitable for unrelated ephemeral app replicas. A shared transactional database adapter is a public horizontal-scaling prerequisite; do not copy a SQLite file to each instance.

Admission reserves the operator-configured amount per session, with daily owner/device limits and a global concurrency cap. Reservations remain charged conservatively after failures or deletion. Token/character metrics are recorded, but reservations are **not provider invoices or a guaranteed bill ceiling**. Set vendor-side billing limits as well. Per-vendor daily accounting, rates, alerts and invoice reconciliation remain release gates.

A room has a configured resource lifetime plus two minutes to join; pausing does not extend it or reset the turn allowance. The soft practice clock remains separate. Reconnect rotates the room and worker lease. Expired private recovery copies are inaccessible and purged on realtime ledger maintenance/admission; run the operations command on a schedule for idle deployments. Default framework audio/transcript/trace recording is disabled. Local transcripts remain user-controlled; server recovery expires after 24 hours, metrics after 90 days. No automatic egress, voice cloning, or portfolio publication was added.

## Outstanding gates — do not label production ready

| Gate | Current evidence / blocker |
| --- | --- |
| Comparative TTS/LLM/STT selection | Credentials and region absent. Fixtures prepared; no winner, audio samples, panel ratings, WER or measured comparison. |
| Warm opening/backchannel cache | Not implemented for the new provider; requires auditioned voice IDs and permitted generated assets. Legacy Kokoro clips are never substituted. |
| Provider-to-provider failover | Not implemented. Current failure behavior preserves the run and offers reconnect/guided continuation; it is not vendor failover. |
| First-audio/word alignment/barge-in targets | Framework controls wired, no Kathmandu/deployment measurements or thresholds passed. No first-audio/browser-playback samples yet. |
| Capacity/load test at 2× peak | Not run; no deployed worker, vendor connection quotas, or approved target concurrency. Default admission is one session. |
| Full provider-cost accounting | Reservations and token/character usage exist; actual per-vendor billing and alert thresholds are pending. |
| Human interview quality/privacy sign-off | Required before enabling public admission. Syntactic guards and mocked tests cannot certify this. |

Blocked by provider credentials/account access, owned by the project owner, requiring private LiveKit/Deepgram/Cerebras/Inworld configuration and explicit budget/terms approval. Blocked by deployment and user recordings/listeners, owned by the operator/review panel, requiring a measured regional pilot and accent/listening evaluation. No additional input was requested before completing independent implementation.

Subframe MCP inspiration was consulted for voice interfaces (ElevenLabs, Midnight, Uncle Rudy). Existing PMForge surfaces, typography, persona artwork and controls were reused; no vendor marketing design was copied.
