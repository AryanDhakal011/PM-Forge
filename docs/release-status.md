# Zero-budget release status

The active release is the account-free portfolio showcase. It offers direct visitor entry, guided practice and simulations, browser saves, and a portable Career Studio export. Hot Seat shows the recorded opening. The first follow-up and hosted publishing offer a walkthrough request. The account-enabled release work orders below remain a separate future scope.

Decisions on 15 November 2026

1. Keep the live guest beta on the existing Vercel Hobby and Supabase Free projects. Release account features after verified Google and GitHub sign-in.
2. Keep guided practice as the dependable fallback. Enable each AI lane only when its limits, privacy and recovery checks pass.
3. Keep turn-based voice with Bella and Sarah. Try earlier on-device draft transcription with `NEXT_PUBLIC_PMFORGE_SEGMENTED_DICTATION=true` in a rehearsal build. Keep it off in the hosted beta until phone and desktop microphone checks pass. The rehearsal uses Whisper while Moonshine and Silero remain open.

In scope are guest practice, social sign-in, guest migration, account sync, Career Studio and publication, the three generative Hot Seat lanes, turn-based voice, hosted QA and basic operations. The four statuses below distinguish deployed evidence from implementation and planned work. The IDs spell out the handoff’s grouped ranges as individual checks.

The Final Completion Runbook now governs the execution order. Start with [configuration readiness](evidence/WO-READINESS/README.md) and the [batched owner setup](release-owner-setup.md).

| ID | Area | Requirement | Status | Named acceptance check | Evidence | Owner | Last checked |
|---|---|---|---|---|---|---|---|
| HOST-01 | Hosting | Public beta and Postgres health RPC | Verified | HOST-01 | [Live health endpoint](https://pmforge-tau.vercel.app/api/health) | Engineering / QA | 2026-11-15 |
| SHOWCASE-01 | Portfolio showcase | Live direct entry and local production-build walkthrough of browser saves, guided Hot Seat and portfolio download | Verified | Showcase browser walkthrough | [Showcase evidence](evidence/WO-SHOWCASE/README.md) | Engineering / QA | 2026-11-15 |
| CONF-01 | Readiness | Public configuration report and deployment baseline | Verified | WO-READINESS | [Production command log](evidence/WO-READINESS/production-check.txt) | Engineering | 2026-11-15 |
| CONF-02 | Readiness | Verified CAPTCHA, identity-linking, AI probes and operations receipts | Not implemented | WO-READINESS, WO-A1, WO-B1 to B3, WO-C2 | [Configuration evidence](evidence/WO-READINESS/README.md) | Owner / engineering | 2026-11-15 |
| LAND-01 | Landing | First decision through guest entry, skip onboarding and arrive at the selected scenario | Verified | LAND-01 | [Hosted browser evidence](cloud-verification/guest-scenario-entry.png) | Engineering / QA | 2026-11-15 |
| PRACTICE-01 | Practice | All 63 valid guided journeys | Implemented, awaiting verification | PRACTICE-01 | [Hosting handover](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| SIM-01 | Simulations | All 12 start, resume, branch and debrief journeys | Implemented, awaiting verification | SIM-01 | [Hosting handover](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PROG-01 | Progress | Completion and persistence match each journey | Implemented, awaiting verification | PROG-01 | [Hosting handover](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| AUTH-01 | Accounts | Google and GitHub OAuth on the live site | Not implemented | AUTH-01 | [Current backend and release scope](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| AUTH-02 | Accounts | Anonymous workspace links to a permanent identity | Not implemented | AUTH-02 | [Current backend and release scope](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| AUTH-03 | Accounts | Returning-account collision and repeated import | Not implemented | AUTH-03 | [Current backend and release scope](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| AUTH-04 | Accounts | Cancelled provider sign-in | Implemented, awaiting verification | AUTH-04 | [Current backend and release scope](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| AUTH-05 | Accounts | Provider callback error | Implemented, awaiting verification | AUTH-05 | [Current backend and release scope](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| AUTH-06 | Accounts | Expired session during edit | Implemented, awaiting verification | AUTH-06 | [Current backend and release scope](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| AUTH-07 | Accounts | Cleared auth storage and redirect loop | Implemented, awaiting verification | AUTH-07 | [Current backend and release scope](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| AUTH-08 | Accounts | Logout with local work preserved | Implemented, awaiting verification | AUTH-08 | [Current backend and release scope](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| AUTH-09 | Accounts | Returning user | Implemented, awaiting verification | AUTH-09 | [Current backend and release scope](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| AUTH-10 | Accounts | Recent reauthentication and complete account deletion | Not implemented | AUTH-10 | [Current backend and release scope](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| AUTH-11 | Accounts | Anonymous publish and quota denial | Implemented, awaiting verification | AUTH-11 | [Current backend and release scope](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| AUTH-12 | Accounts | Invalid Turnstile token blocks anonymous creation | Not implemented | AUTH-12 | [Current backend and release scope](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| SYNC-01 | Cloud sync | Two-device restore | Implemented, awaiting verification | SYNC-01 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-02 | Cloud sync | Simultaneous long-text edits preserve both versions | Not implemented | SYNC-02 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-03 | Cloud sync | Offline outbox reconnect | Not implemented | SYNC-03 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-04 | Cloud sync | Aborted request retries once | Not implemented | SYNC-04 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-05 | Cloud sync | Expired session and outbox | Implemented, awaiting verification | SYNC-05 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-06 | Cloud sync | Revoked session and outbox | Implemented, awaiting verification | SYNC-06 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-07 | Cloud sync | Two-account isolation | Implemented, awaiting verification | SYNC-07 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-08 | Cloud sync | Oversize workspace export recovery | Implemented, awaiting verification | SYNC-08 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-09 | Cloud sync | Storage choices match observed network behavior | Not implemented | SYNC-09 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-10 | Cloud sync | Local media stays on device | Implemented, awaiting verification | SYNC-10 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-11 | Cloud sync | Older local workspace imports | Implemented, awaiting verification | SYNC-11 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-12 | Cloud sync | Delete tombstones propagate | Not implemented | SYNC-12 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-13 | Cloud sync | Clock skew does not overwrite newer revisions | Not implemented | SYNC-13 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| SYNC-14 | Cloud sync | Rapid edits survive reload | Implemented, awaiting verification | SYNC-14 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| STUDIO-01 | Career Studio | Local PDF profile import | Implemented, awaiting verification | STUDIO-01 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| STUDIO-02 | Career Studio | Review extracted profile | Implemented, awaiting verification | STUDIO-02 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| STUDIO-03 | Career Studio | Real-work case completion | Implemented, awaiting verification | STUDIO-03 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| STUDIO-04 | Career Studio | Imported practice case provenance | Implemented, awaiting verification | STUDIO-04 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| STUDIO-05 | Career Studio | Create and edit a resume version | Implemented, awaiting verification | STUDIO-05 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| STUDIO-06 | Career Studio | Export PDF | Implemented, awaiting verification | STUDIO-06 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| STUDIO-07 | Career Studio | Print view | Implemented, awaiting verification | STUDIO-07 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| STUDIO-08 | Career Studio | Application with linked resume and case | Implemented, awaiting verification | STUDIO-08 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| STUDIO-09 | Career Studio | Strength and progress fixtures | Implemented, awaiting verification | STUDIO-09 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| STUDIO-10 | Career Studio | Empty and incomplete handling | Implemented, awaiting verification | STUDIO-10 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| STUDIO-11 | Career Studio | Large and malformed inputs | Not implemented | STUDIO-11 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| STUDIO-12 | Career Studio | Export/import equality | Implemented, awaiting verification | STUDIO-12 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-01 | Publishing | Anonymous denial | Implemented, awaiting verification | PUB-01 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-02 | Publishing | Unverified account denial | Implemented, awaiting verification | PUB-02 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-03 | Publishing | Handle availability and two-owner race | Implemented, awaiting verification | PUB-03 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-04 | Publishing | Selected cases and approved media only | Not implemented | PUB-04 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-05 | Publishing | Server-derived immutable provenance | Not implemented | PUB-05 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-06 | Publishing | Public link | Implemented, awaiting verification | PUB-06 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-07 | Publishing | Unlisted capability link | Implemented, awaiting verification | PUB-07 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-08 | Publishing | Expiry enforcement | Implemented, awaiting verification | PUB-08 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-09 | Publishing | Revocation and media purge with HTTP 410 | Not implemented | PUB-09 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-10 | Publishing | Failed replacement keeps the previous snapshot | Implemented, awaiting verification | PUB-10 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-11 | Publishing | Account deletion removes hosted material | Implemented, awaiting verification | PUB-11 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-12 | Publishing | Cross-account owner and storage isolation | Implemented, awaiting verification | PUB-12 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| PUB-13 | Publishing | Reader rejects workspace routes | Verified | PUB-13 | [Live reader route denial](cloud-verification/live-http.json) | Engineering / QA | 2026-11-15 |
| PUB-14 | Publishing | Malformed uploads and inert rendered payloads | Implemented, awaiting verification | PUB-14 | [Current backend and release scope](LIVE-HOSTING.md) | Engineering / QA | 2026-11-15 |
| AI-01 | Hot Seat | Candidate answer persists after provider failure | Not implemented | AI-01 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-02 | Hot Seat | Retry is idempotent | Not implemented | AI-02 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-03 | Hot Seat | Concurrent tabs share admission limits | Not implemented | AI-03 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-04 | Hot Seat | Shared kill switch takes effect within 10 seconds | Not implemented | AI-04 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-05 | Hot Seat | Quota exhaustion preserves guided continuation | Not implemented | AI-05 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-06 | Hot Seat | Browser BYOK and no PMForge key transfer | Not implemented | AI-06 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-07 | Hot Seat | Optional WebGPU model on supported desktop | Not implemented | AI-07 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-08 | Hot Seat | Fictional safety and grounding evaluation | Not implemented | AI-08 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-09 | Hot Seat | Two human reviewers meet relevance and quality threshold | Not implemented | AI-09 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-10 | Hot Seat | Live pilot latency and load report | Not implemented | AI-10 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-11 | Hot Seat | Provider consent and truthful quota copy | Not implemented | AI-11 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-12 | Hot Seat | Server authority over evidence, progression, scoring | Not implemented | AI-12 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-13 | Hot Seat | Provider reservations and usage reconciliation | Not implemented | AI-13 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-14 | Hot Seat | Session privacy and retention | Not implemented | AI-14 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| AI-15 | Hot Seat | Provider circuit breaker and controlled failover | Not implemented | AI-15 | [Cloud AI gate](../src/lib/cloud/availability.ts) | Engineering / owner | 2026-11-15 |
| MIC-01 | Turn-based voice | Single hardware owner and capture gate | Implemented, awaiting verification | MIC-01 | [Local microphone evidence](mic-test-report.md) | Engineering / device QA | 2026-11-15 |
| MIC-02 | Turn-based voice | Permission denied, dismissed, revoked and input lost | Implemented, awaiting verification | MIC-02 | [Local microphone evidence](mic-test-report.md) | Engineering / device QA | 2026-11-15 |
| MIC-03 | Turn-based voice | Pause, exit, hidden tab and typing stop capture | Implemented, awaiting verification | MIC-03 | [Local microphone evidence](mic-test-report.md) | Engineering / device QA | 2026-11-15 |
| MIC-04 | Turn-based voice | Ordered editable draft across recognition failure | Implemented, awaiting verification | MIC-04 | [Local microphone evidence](mic-test-report.md) | Engineering / device QA | 2026-11-15 |
| MIC-05 | Turn-based voice | Cold model load and interrupted download recovery | Implemented, awaiting verification | MIC-05 | [Local microphone evidence](mic-test-report.md) | Engineering / device QA | 2026-11-15 |
| MIC-06 | Turn-based voice | 15-second utterance latency on desktop and phone | Not implemented | MIC-06 | [Local microphone evidence](mic-test-report.md) | Engineering / device QA | 2026-11-15 |
| MIC-07 | Turn-based voice | Bella and Sarah preview and cache correctness | Implemented, awaiting verification | MIC-07 | [Local microphone evidence](mic-test-report.md) | Engineering / device QA | 2026-11-15 |
| MIC-08 | Turn-based voice | Time to first audio by runtime | Not implemented | MIC-08 | [Local microphone evidence](mic-test-report.md) | Engineering / device QA | 2026-11-15 |
| MIC-09 | Turn-based voice | Model and device capability selection | Not implemented | MIC-09 | [Local microphone evidence](mic-test-report.md) | Engineering / device QA | 2026-11-15 |
| MIC-10 | Turn-based voice | Moonshine/Silero segmented transcription and Whisper fallback | Not implemented | MIC-10 | [Local microphone evidence](mic-test-report.md) | Engineering / device QA | 2026-11-15 |
| REL-01 | Release | One current release checklist | Implemented, awaiting verification | REL-01 | This file | Engineering | 2026-11-15 |
| OPS-01 | Capacity | Actual project limits read from each console | Not implemented | OPS-01 | [Limits register](provider-limits.md) | Owner / engineering | 2026-11-15 |
| OPS-02 | Security | Full-history secret scan, hosted security checks, key rotation and publish challenge | Not implemented | OPS-02 | [Prior audit](production-audit.md) | Engineering / owner | 2026-11-15 |
| OPS-03 | Backups | Encrypted off-host upload and independent restore drill | Implemented, awaiting verification | OPS-03 | [Backup workflow](../.github/workflows/cloud-backup.yml) | Owner / engineering | 2026-11-15 |
| OPS-04 | Retention | Authenticated daily cleanup for expiring cloud data | Not implemented | OPS-04 | [Hosting handover](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| OPS-05 | Recovery | Hosted rollback and recovery rehearsal | Not implemented | OPS-05 | [Hosting handover](LIVE-HOSTING.md) | Engineering | 2026-11-15 |
| OPS-06 | Monitoring | Scrubbed monitoring, status and delivered test alerts | Not implemented | OPS-06 | [Hosting handover](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| OPS-07 | Policy | Current processor and storage disclosures, operator, contact and review | Not implemented | OPS-07 | [Hosting handover](LIVE-HOSTING.md) | Owner / engineering | 2026-11-15 |
| OPS-08 | Accessibility | Keyboard, 200% zoom, mobile, screen reader and axe checks | Implemented, awaiting verification | OPS-08 | [Local release evidence](release-qa/browser-summary.json) | Engineering / QA | 2026-11-15 |
| OPS-09 | Pilot | 5–20 participants, five consecutive green nightly runs and pilot targets | Not implemented | OPS-09 | Pilot pending | Owner / QA | 2026-11-15 |
| VOICE-01 | Voice | Audio processed in ordered segments before Finish | Implemented, awaiting verification | VOICE-01 | [Segment regression tests](../tests/hot-seat-dictation-segments.test.ts) | Engineering / device QA | 2026-11-15 |
| VOICE-02 | Voice | Kokoro sentence streaming and version-matched opener/banked playback | Not implemented | VOICE-02 | [Earlier local timing](latency-report.md) | Engineering | 2026-11-15 |
| VOICE-03 | Voice | Optional server transcription with provider-specific opt-in and quota | Not implemented | VOICE-03 | [Limits register](provider-limits.md) | Owner / engineering | 2026-11-15 |
| DEF-01 | Deferred | Email and password signup. Trigger: Verified domain and transactional delivery. | Deferred | DEF-01 scope review | Zero-budget handoff | Owner | 2026-11-15 |
| DEF-02 | Deferred | Custom domain. Trigger: Owner acquires a domain. | Deferred | DEF-02 scope review | Zero-budget handoff | Owner | 2026-11-15 |
| DEF-03 | Deferred | LiveKit, interruptible realtime voice and premium TTS. Trigger: Approved operating budget and capacity. | Deferred | DEF-03 scope review | Zero-budget handoff | Owner | 2026-11-15 |
| DEF-04 | Deferred | Monetization and paid inference. Trigger: Commercial hosting and an approved budget. | Deferred | DEF-04 scope review | Zero-budget handoff | Owner | 2026-11-15 |
| DEF-05 | Deferred | SOC-style compliance and native apps. Trigger: Separate requirements and resourcing. | Deferred | DEF-05 scope review | Zero-budget handoff | Owner | 2026-11-15 |

Pilot completion requires the applicable checks above, an independent restore, a rollback rehearsal, a received test alert, five consecutive green hosted core nights, and at least one full-suite pass in that window. Run the pilot for 5–7 days with 8–20 participants. Record crash-free session rate (target at least 98%), data-loss and account-isolation incidents (target zero), AI latency and voice recovery evidence before declaring v1 complete.
