# Production audit — 9 November 2026

## Implemented and independently checkable in the repository

- Replaced Hot Seat browser SpeechRecognition with a single AudioWorklet hardware controller, explicit local Whisper download, a real input meter, bounded capture, cancellable permission acquisition, tap/hold operation and typed recovery. Old dictation module removed. `tests/hot-seat-microphone.test.ts` and `hot-seat-worklet.test.ts` cover lifecycle and actual worklet buffering. See the separate mic report for browser evidence and limitations.
- Predictable local speech is rendered using the same Kokoro-JS q8 female voices and speed as the live path. Cache lookup requires an exact profile and exact text/voice match. A mismatched premium provider never uses this cache. The 118-clip, 24 kHz PCM16 local library passed hash/profile/format/duration/non-silence/clipping checks. Full requested premium splice/stream cache remains missing.
- `src/proxy.ts` now permits exact configured secure LiveKit WSS/HTTPS origins on Hot Seat pages only; malformed/credentialed URLs fail closed. CSP, origin checks, body limits and verified-account admission are covered by relevant tests. Other optional external connections still need full staging CSP audit.
- `product_limits` moved from an in-memory map to atomic SQLite rows, with expiration. Realtime reservations enforce one active room per owner and existing global budget/lease/kill controls. These are one-disk guarantees, not distributed Postgres/Redis or edge WAF coverage.
- Realtime start/connect and paid legacy generation require verified accounts. New production public portfolio publishing is explicitly paused until account binding/isolated-origin/abuse review; local editing and export remain available. This safety gate is an unfinished launch feature, not a completed requirement.
- Backup drill creates a genuine snapshot of the existing local DB and checks an independent restored copy. This does not establish encrypted off-host backup, PITR or hosted rollback.
- CI now includes app and worker dependency audits/typechecks, built-client/history pattern scan, authored audio integrity checks and SBOM generation. An independent secret scanner, container scan, ZAP, Lighthouse, full cross-browser/screen-reader matrix and real voice load tests are still missing.

Evidence: [mic report](mic-test-report.md), [latency report](latency-report.md), [backup drill](production-verification/backup-restore.json), [secret scan](production-verification/secrets.json), [test results](production-verification/checks.json), [workflow](../.github/workflows/checks.yml), [environment register](../ENV.md). No report is evidence of work that has not actually run.

## Findings behind the changes

`src/components/hot-seat/useMicrophone.ts` previously coupled capture to browser SpeechRecognition; the browser vendor returned a network error despite a live mic. The new adapter owns hardware independently. The initial self-hosted Transformers web entry left bare ONNX imports unresolved in a public worker; browser verification caught this and setup now copies the self-contained distribution. `HotSeat.tsx` also awaited full TTS model warmup before entering a session; authored cache playback no longer depends on that warmup.

`src/proxy.ts` previously allowed only local/Hugging Face connections in production, blocking LiveKit. `src/lib/product/server.ts` used restartable process-local rate counters. Realtime start/connect previously accepted guest capabilities for budgeted voice. These are corrected in this change. Tests cover the code boundaries, not vendor account access.

## Launch blockers — owner and exact next step

| Blocked by | Owner | Required step |
|---|---|---|
| No production host/domain or durable sender | Project owner | Approve hosting cost; provision the reviewed blueprint; configure HTTPS origin, sender or OAuth, trusted IP header and test real verification/reset delivery |
| Realtime accounts/voices/budgets/terms unverified | Project owner + provider account admins | Install server/worker secrets privately, review terms/regions, set actual console quotas and caps; rotate chat-shared key; perform paid fictional bakeoff only after explicit budget |
| Premium speed library/splice/TTFT and failover incomplete | Voice implementation owner | Build exact configured premium voice cache, streaming parser/chunker and cancellation tests without mixing local voices; measure real T0–T8 under an agreed budget/load |
| Local ASR/voice browser and hardware matrix incomplete | QA owner | Test real spoken words on Chrome/Edge/Firefox/Safari/iOS/Android, wired/Bluetooth and denied/unplugged/revoked permissions; compare user-visible drafts and measured latency |
| Public publishing/auth target not fully implemented | App security owner | Managed-auth/magic-link decision, verified account ownership, lifecycle purge, separate portfolio origin and abuse handling before removing production publish gate |
| Reference distributed data architecture not implemented | Backend owner | Choose pilot single-disk limitations or implement/test Postgres, durable shared leases/limits, private object assets and versioned migrations before high availability |
| Security assurance and operational accounts missing | Security/deployment owner | Full-history gitleaks/trufflehog, ZAP, manual IDOR/XSS/CSRF/upload tests, container scan, 2FA/two admins and key-rotation rehearsal |
| No independent off-host encrypted recovery or rollback drill | Deployment owner | Set backup destination/retention, restore on a separate staging host, rehearse previous-image rollback and destructive migration recovery |
| No live monitoring/alerts/status/support channel | Operations owner | Connect scrubbed monitoring, South Asia probes, a durable inbox and second admin; deliberately trigger/receive an alert; set budget notifications and maintenance schedule |
| Data terms, age policy and rights process not reviewed | Project owner + qualified counsel | Review actual vendor processing/retention, policy accuracy, eligibility, account deletion including backups, contact and DPAs; do not treat repository policy text as legal approval |
| Public voice capacity and network reliability unknown | Deployment/QA owner | Restrictive-network TURN/TLS, region RTT from Kathmandu, chaos/failover tests and 2× peak load with real vendor limits and capped spend |

The full supplied checklist is preserved and mapped in [PRR](prr.md). Conservative Missing rows intentionally remain when a compound requirement has only partial code evidence. Hosting configuration is prepared, but public launch is not approved. No paid services or recurring operations were silently enabled.
