# Data inventory — current implementation

| Data | Store / access | Purpose, retention and deletion | Processors |
|---|---|---|---|
| Account email/name/sessions | Private SQLite; authenticated account APIs | Login; account deletion enabled. Full lifecycle and backup deletion SLA need launch review | Host; configured mail/OAuth provider |
| Practice/progress/notes | Browser IndexedDB; optional account workspace sync | Local learning; settings export/reset, account workspace deletion. Device-only data can be evicted by browser | Device; host only if synced |
| Career profile, resume, applications | Browser; optional workspace sync | User editing/export. Never assume confidential data is AI-eligible | Device; host if synced |
| Published portfolio snapshot/assets | Private SQLite; publication URL | Expiring snapshots and owner revocation. New production publishing blocked pending account/origin hardening | Host; public visitors if explicitly published |
| Local Hot Seat transcript/draft | Browser IndexedDB | Recovery and optional case draft. User-managed deletion/export | Device |
| Optional AI transcript/recovery | Sealed SQLite state | Current recovery expiry is 24 hours; expiry cleanup also runs on request/ops. Schedule janitor before launch | Host; selected text/voice providers with feature consent |
| Raw mic audio | Memory only; capture→local ASR or LiveKit stream | Not retained by PMForge by default. A crashed tab may lose untranscribed words; typed text remains saved | Local model or explicitly configured realtime providers |
| Local model/audio caches | Browser cache, IndexedDB, hashed public authored clips | Performance; user/browser clear controls. Public clips are fictional authored text, not recordings of users | Hugging Face download host receives network metadata |
| Quotas, reservation usage, timing | Private SQLite | Cost/abuse controls; realtime counters/metrics expire per ledger rules (90 days). Account anonymization coverage still needs audit | Host |
| Auth mail outbox | Encrypted private SQLite / dev-only private preview | Deliver verification/reset; inspect retry/cleanup before launch. Preview is never real delivery | Resend when configured |
| Logs/errors | Local/hosting operational logs | No answer/audio logging by default in new paths; production retention/redaction service not configured | Host; future monitoring vendor |
| Backups | Private local files; no off-host target yet | Manual verified snapshot; encrypted off-host retention and deletion completion SLA not configured | None configured |

This records implemented behavior, not a reviewed legal policy. A durable rights-request inbox, subprocessor review, retention schedule including backup expiry, legal review and user-facing vendor accuracy checks remain launch blockers. No personal user transcript was used to train or evaluate the new ASR test; the fixture is the authored synthetic preview.
