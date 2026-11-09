# Operations runbooks

Owner for every incident: named deployment operator (not assigned); notify project owner through the monitored shared channel (not configured). No public deployment is claimed ready until this is filled and an alert is tested. Severity 1: exposure or uncontrolled spend; severity 2: widespread broken login/voice. Assign one incident lead, record timestamps and a short post-mortem.

| Incident / symptom | Check and immediate action | Recovery / rollback |
|---|---|---|
| Vendor outage or latency regression | Check provider status and per-stage timing; close new premium admission; preserve drafts and offer guided typing | Test fictional round in staging; reopen gradually; never silently switch paid vendors |
| Cost spike / abuse / many 429s | Activate shared AI and realtime kill switches; inspect anonymous usage/reservations, global and user limits | Fix admission rule; reconcile actual vendor bill; keep quotas low |
| Leaked key | Close affected feature immediately; rotate in vendor and host secret store within one hour; inspect access metadata | Replace deployment secret; test new key; revoke old key; no transcript dump |
| Database outage / corrupt disk | Stop writes; preserve DB + WAL/SHM together and current image; do not overwrite the only copy | Restore verified encrypted backup to a separate disk; integrity/foreign-key checks; test account + sync before promotion |
| Bad deploy | Drain premium rooms; select preceding immutable image; preserve current database backup | Rehearse backward-compatible schema rollback; health and real account checks. Under-five-minute target not yet rehearsed |
| DDoS / abuse wave | Host WAF/rate limits and edge logs; avoid trusting browser-forwarded IP headers | Tighten admission/invite gate; verify legitimate access; remove temporary blocks deliberately |
| Data-rights request | Verify identity through account; export/delete scoped data; record receipt without copying answers | Confirm public revocation, local/server distinction and backup expiry; legal deadline/contact require review |
| Security incident | Close admission and isolate affected feature; preserve scrubbed metadata | Assess exposure with qualified review; follow applicable notice duties; do not invent legal advice |
| Domain/certificate/email failure | Check DNS, sender verification, delivery queue and certificate dates | Restore DNS/cert/sender configuration; send real test mail. Never bypass TLS warnings |
| Failed backup / disk pressure | Check disk and snapshot age; stop nonessential writes and preserve last verified off-host copy | Expand capacity with owner approval; restore drill before deleting recovery copies |

Commands and operator gates: `docs/HOSTING.md`, `docs/hot-seat-realtime-architecture.md`, `scripts/backup-data.mjs`, `deploy/ai-control.mjs`, and `npm run hot-seat:voice:ops`. No command here authorizes new vendor spend.
