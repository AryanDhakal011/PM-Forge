# Security and release boundaries

Public launch is blocked pending the security evidence in `docs/prr.md`. This is not an external security certification. Reporting address and incident owner contact must be configured before launch; do not publish a fake `security.txt` email.

Threats: cost abuse; account takeover; transcript/evidence exposure; public portfolio XSS/impersonation; prompt injection; leaked keys; dependency compromise; denial of service. The app uses origin checks, bounded bodies, Zod contracts, owner checks, maintained Better Auth sessions, nonce CSP and database-backed usage limits. Paid realtime admission requires a verified member. Worker callbacks have signed expiring messages; replayed event IDs do not repeat effects. Model output cannot directly score or publish.

External AI and paid speech default off. Keep budget and provider-terms gates closed until reviewed. Candidate text is untrusted, not instructions. Local ASR audio is transient memory and is never logged. Third-party model downloads reveal network metadata to the download host, even though inference is local.

New production portfolio publishing is blocked pending account binding and isolated-origin review. Existing published snapshots/revocation require a separate audit; a capability owner key alone is not verified account ownership. Do not advertise the publishing gate as completed.

Run `npm run security:scan` after a build (pattern scan of all available Git patch history and browser assets; not a substitute for gitleaks/security review). Scan build images and dependencies, rehearse key rotation, run ZAP and manual cross-account/XSS/CSRF tests in staging. Never print secrets during checks. Chat-shared credentials need owner rotation before deployment, even if no Git leak is found.

Outage or suspected leak: close AI admission immediately using the documented ops kill switch; preserve metadata without answers; rotate the affected vendor key in the host's encrypted environment store; revoke affected sessions; verify recovery on staging before reopening. See `docs/runbooks/operations.md`. No vendor console action has been performed by this change.
