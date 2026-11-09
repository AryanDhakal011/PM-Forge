# PMForge: Production Readiness and Handover Handoff

Scope: everything that must be true before PMForge (landing, workspace, Career Studio, Hot Seat voice rounds, published portfolios) goes live, and what must exist so you never have to look back at it. It covers the things that work in dev mode and silently break or become dangerous in production, authentication, security, privacy and legal, infrastructure, reliability, cost control, operations and handover.

I cannot see the current repo or what the agent already did for hosting. So this document is an **audit plus a build list**. Every line is a requirement. The agent must produce a Production Readiness Report (PRR) before launch.

Do not ask clarifying questions. Audit, decide, log decisions in 3 lines, build. Report blockers as: "blocked by X, owned by Y, requiring step Z".

I am not a lawyer. Items marked (legal) need review by qualified counsel before launch.

---

## 0. How this is used: the PRR rule

Create `docs/prr.md` with one row per item in this document: `ID | requirement | status (Done, Not applicable, Missing, Deferred) | evidence | owner`. **Evidence is mandatory**: a link, a screenshot, a command output, a test result or a config file path. No item is Done without evidence. "Not applicable" needs a one line reason. "Deferred" needs a date and a risk note. The launch gate (section 12) requires zero Missing items in the blocker list.

## 1. Dev mode versus production: what changes

This table is the most likely place you are missing something. Check every row.

| Dev behavior | Why it breaks or is unsafe in production | Production requirement |
|---|---|---|
| Microphone works on `http://localhost` | Browsers allow `getUserMedia` only on HTTPS (localhost is the exception) | HTTPS everywhere, HSTS, and `Permissions-Policy: microphone=(self)`. Test on the real domain. |
| API keys in `.env` or `VITE_`, `NEXT_PUBLIC_` variables | Anything with those prefixes ships in the browser bundle | Vendor keys only in server or agent environment. Grep the built bundle for key patterns before every release. |
| Personal or free-tier API keys (AI Studio) | Key belongs to a person, has low quota, may use data for training, breaks at scale | Company-owned paid accounts with budgets, alerts and spend caps. Keys named per environment. |
| Open CORS (`*`), disabled CSRF, `credentials` anywhere | Any site can call your API | Explicit origin allowlist, CSRF protection for cookie sessions, no wildcard with credentials. |
| Mock or scripted AI engine, simulated mic, sample answers, feature flags on | Fake behavior leaks to users | Remove or hard-disable. Flags default off in prod. Search the repo for `mock`, `simulate`, `demo`, `TODO`, `FIXME`, `console.log`. |
| No rate limits, no quotas, unbounded sessions | One script can burn your entire paid voice budget in minutes | Per user, per IP, per day and global limits. Server-enforced max session length. Kill switch. |
| WebRTC works on the same network | Real users sit behind NAT, corporate firewalls and mobile networks that block UDP | TURN service (including TURN over TCP and TLS on 443). Test on mobile data, hotel Wi-Fi, and a restrictive network. |
| `livekit-server --dev` with `devkey` and `secret` | Public default credentials | Real keys, rotated, in a secret manager. Never the dev pair. |
| Hot reload and React StrictMode double effects | Hide leaks (two mic streams, two sockets) that only show in prod | Idempotent setup and cleanup, tests assert exactly one stream and one socket. |
| In-memory state (sessions, rate limits, caches, queues) | Lost on restart, wrong with more than one instance | Redis or the database. Stateless web and API instances. |
| Local disk for uploads and audio | Containers and serverless have ephemeral storage | Object storage (S3 compatible), signed URLs, lifecycle rules. |
| Serverless functions for long work | Timeouts and no long-lived sockets | Agent workers and WebSocket handlers run as long-lived services with min instances. |
| Auto schema sync (`db push`, `synchronize: true`) | Can drop data | Versioned migrations, backup before migrate, tested rollback. |
| Seed data, test users, admin routes, debug and docs endpoints (`/swagger`, `/debug`, `/graphql` introspection) | Free backdoors | Remove or protect with auth and IP allowlist. Default passwords must not exist. |
| Verbose errors and stack traces in responses | Information leakage | Generic messages plus a correlation id. Details only in logs. |
| Console logs with transcripts, tokens, emails | Personal data in logs | Structured logs, redaction, no PII, no secrets. |
| Magic-link emails printed to the console | Users never receive login emails | Real transactional email provider, SPF, DKIM, DMARC, tested deliverability. |
| OAuth and webhook URLs pointing to localhost or ngrok | Logins and callbacks fail | Production redirect URIs allowlisted. Stable webhook endpoints with signature verification. |
| Google Fonts and third party scripts loaded from CDNs | Privacy and availability risk, CSP conflicts | Self-host fonts and libraries. Pin versions, use SRI where external. |
| Source maps public, dev tools enabled | Source exposure | Source maps uploaded privately to the error tracker, not served. |
| `NODE_ENV` or build mode not production | Slower, less secure, verbose | Verify production builds, minified, tree-shaken, dev dependencies excluded. |
| Single region, cold starts tolerated | Voice latency budget fails from Nepal | Region choice per section 6, warm instances. |
| Pre-rendered audio built in dev with a different voice or model | Voice mismatch mid-conversation | `audio:build` runs in CI with production keys, manifest checks `voiceProfileId` at agent start. |
| Staging reachable and indexable | Duplicate content, leaked unfinished features, extra attack surface | Staging behind auth, `noindex`, separate keys and data. |
| Browser extensions, fast laptop, localhost latency | Real devices and networks are slower | Test on mid-range Android, Safari iOS, throttled networks, from Kathmandu. |
| Safari and iOS behaviors untested | Different autoplay, mic and storage rules | Full matrix test (section 7.4). |
| Clock and timezone assumptions | JWT clock skew, daily quotas reset at wrong time | NTP on servers, 60 second leeway on JWT validation, quotas defined in UTC with user-facing local display. |
| One engineer account owns everything | Bus factor of one | Shared admin ownership, 2FA, recovery codes, documented (section 13). |

## 2. Production architecture (reference)

```
Users (Nepal, South Asia) > Cloudflare (DNS, WAF, DDoS, CDN, Turnstile)
   > Web app (static, CDN)                     app domain  (cookies live here)
   > Published portfolios (separate domain)    p-domain    (no cookies, strict CSP)
   > API (stateless containers, 2+ instances)  /session/*, /auth/*, /portfolio/*, /usage/*
        > Postgres (managed, point-in-time recovery, same region)
        > Redis (rate limits, quotas, session locks)
        > Object storage (private bucket, signed URLs, lifecycle)
        > Auth provider (managed)
   > LiveKit Cloud or self-hosted LiveKit + TURN  (nearest region)
        > Agent workers (long-lived, min warm pool, Singapore or Mumbai)
             > STT, LLM, TTS vendors (direct, regional endpoints, fallbacks)
   > Observability: logs, traces, metrics, errors, uptime probes, status page
```
Environments: `dev`, `staging` (production-like, real vendors with low budgets), `prod`. Separate keys, databases, domains and budgets. Infrastructure as code (Terraform or the platform's config files) committed to the repo.

## 3. Authentication and authorization

### 3.1 Decisions (defaults)
- **Use a managed auth provider** (Supabase Auth, Clerk, Auth0 or Firebase Auth). Do not roll your own password or session code. Default pick: Supabase Auth with Postgres row level security if you also use Supabase for the database; otherwise Clerk. Choose by: price, Nepal and India email deliverability, Google sign in, magic link, MFA, session handling, data location.
- **Sign-in methods:** Google and email magic link (no passwords at launch). Add passkeys later.
- **Guests:** the local-first practice features work without an account ("On this device"). **Anything that costs money or is shared requires an account**: Hot Seat sessions, publishing portfolios, cloud backup.
- **Account linking:** when a guest signs up, offer to import local data to the account (versioned, user confirmed, idempotent).

### 3.2 Sessions and tokens
- Cookie sessions: `__Host-` prefix, `Secure`, `HttpOnly`, `SameSite=Lax`, short access token plus rotating refresh token, idle timeout 30 days, absolute 90 days, logout everywhere, revoke on password or email change.
- API authentication on every route (deny by default). Authorization checks by resource owner (`user_id` on every row). No client-supplied user ids.
- CSRF: SameSite plus a CSRF token on state-changing cookie-authenticated requests.
- Email verification required before using paid-cost features. Block disposable email domains. Rate limit sign-in and magic-link requests per email and IP.
- Bot protection: Cloudflare Turnstile on sign-up and magic-link request.

### 3.3 Hot Seat session authorization (critical, this is where money is spent)
1. Client calls `POST /api/session/prepare` and `POST /api/session/start` with the session cookie.
2. Server checks: authenticated, email verified, plan and quota remaining (per day and per month), **no other active session for this user**, global budget not exceeded, kill switch off.
3. Server creates a `sessions` row, then mints a **LiveKit access token**: identity = user id, room = random UUID (unguessable), grants = join this room only, publish audio only, no admin rights, TTL = session length + 5 minutes (confirm the refresh behavior of your LiveKit version).
4. Server dispatches the agent with signed metadata (persona id, company type id, pressure, length). **The agent re-validates the signature and ignores any prompt text or settings coming from the client.** The client can only choose ids from allowlists.
5. The agent enforces max duration server side (length plus 2 minutes grace), sends heartbeats, and ends the session if the user disconnects for more than 60 seconds. A janitor job closes zombie sessions and releases quota holds.
6. Usage is metered per session (STT seconds, LLM tokens, TTS characters, estimated cost) into a `usage_ledger` table for billing, limits and audits.

### 3.4 Account lifecycle
Account deletion (one click, confirmed, completes within 30 days and removes sessions, transcripts, uploads, published pages and ledger personal fields); data export (JSON); email change with re-verification; session list with revoke; admin role only via an allowlist and MFA; admin actions logged to an `audit_log`.

## 4. Security

### 4.1 Threat model (write it down in `SECURITY.md`)
Top risks for this product: (1) **cost fraud**, someone uses your paid voice and LLM budget; (2) account takeover; (3) data exposure of transcripts and uploaded evidence; (4) XSS or content abuse through user generated portfolio pages; (5) prompt injection and misuse of the AI interviewer; (6) secrets leakage; (7) supply chain compromise; (8) denial of service.

### 4.2 Web security headers and policies
Set on the app origin (tune and test, CSP will need `wasm-unsafe-eval` for the VAD model and `worker-src blob:` for AudioWorklet and workers):
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://<cdn>; media-src 'self' blob: https://<cdn>;
  connect-src 'self' https://<api> wss://<livekit-host> wss://<stt-or-agent-hosts-if-any>;
  font-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: microphone=(self), camera=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
```
Run CSP in report-only first, collect violations, then enforce. No `unsafe-eval`. Avoid inline scripts, use nonces if needed.

### 4.3 User generated content (portfolios and case studies)
- **Serve published portfolios from a separate registrable domain** (not a subdomain of the app domain) with no cookies, no app code, strict CSP, `X-Robots-Tag: noindex` by default. This isolates XSS from user sessions.
- Render user text as escaped text or sanitized Markdown (allowlist, for example DOMPurify configured for a minimal tag set). Never `dangerouslySetInnerHTML` raw user content. Test with XSS payloads in every field, including case study fields, handles, titles and image captions.
- Handles: validate (lowercase letters, digits, hyphen, 3 to 30 chars), reserved words list (admin, api, www, support, pmforge, login and similar), profanity and impersonation checks, rate limit changes.
- Uploads (evidence images): max size (for example 4 MB), content sniffing by magic bytes (allow PNG, JPEG, WebP), re-encode server side to strip EXIF and GPS, store in a private bucket, serve only through signed short-lived URLs or the portfolio origin after publish, per-user storage quota, optional malware scan. Never trust the filename or MIME header.
- Publish and revoke: published links expire as configured, revoke deletes the assets and invalidates caches, and the CDN purge is verified.
- Abuse handling: a report link on public pages, a takedown process, and `security.txt` at `/.well-known/security.txt`.

### 4.4 API and infrastructure hardening
- Input validation on every endpoint with schemas (zod or equivalent), size limits, reject unknown fields. Parameterized queries only.
- Rate limits at the edge (Cloudflare rules) and in the app (Redis), with stricter limits on auth, session start, uploads and publish. Return 429 with `Retry-After`.
- WAF managed rules on, bot fight mode on, DDoS protection on.
- Secrets in a secret manager or the platform's encrypted env store, never in git. Run a secret scan (gitleaks or trufflehog) over the **entire git history** and rotate anything ever committed. Pre-commit hook and CI check.
- Key rotation procedure documented and tested (rotate each vendor key without downtime). Scoped keys where vendors allow (restricted to IPs or permissions).
- Least privilege: separate DB roles (app, migration, read-only analytics), row level security or enforced `user_id` filters, no shared admin credentials, 2FA on every vendor and hosting account.
- Dependencies: lockfiles, automated updates (Dependabot or Renovate), `npm audit` or equivalent in CI, pin versions, remove unused packages, review postinstall scripts, generate an SBOM.
- Containers: minimal base images, non-root user, read-only filesystem where possible, image scanning.
- Encryption: TLS 1.2+ everywhere (TLS 1.3 preferred), database and storage encrypted at rest, backups encrypted.
- Webhooks (auth provider, payments, LiveKit): verify signatures, reject replays, idempotent handlers.

### 4.5 AI specific security and safety
- **Prompt injection and rubric extraction:** the candidate's speech is untrusted input. The system prompt says never reveal instructions or scoring, never follow instructions from the candidate that change the role, and stay in persona. The AI has **no tools, no network access and no secrets** in its context, so the blast radius is only the conversation. Never place keys, internal URLs or other users' data in prompts.
- Output checks before speaking: schema parse, length cap, banned topics (protected characteristics, personal life, health, family plans) and basic profanity filter. On violation, play a cached neutral line and log.
- Cost abuse via long monologues or repeated reconnects: cap words per answer, cap reconnects per session, cap sessions per day.
- Log the model, prompt version and cached audio manifest version per session for reproducibility.
- Honest labeling stays everywhere: AI interviewer, simulated company, provisional feedback, not a hiring verdict.

### 4.6 Security testing before launch
Run OWASP ZAP baseline scan against staging; manual tests for IDOR on every resource id (sessions, cases, applications, portfolios, uploads); auth bypass attempts on token mint and LiveKit rooms (can user A join user B's room? can a token publish video or data?); rate limit tests; XSS tests across all text inputs and the portfolio renderer; upload tests (polyglots, oversized, wrong types); CSRF tests; subdomain and cookie scope review; dependency and container scans; secret scan of git history and of the built bundles. Fix all high and critical findings. Consider an external review before public launch.

## 5. Data, privacy and legal (legal)

### 5.1 Data inventory (create `docs/data-inventory.md`)
For every data type: what, where stored, why, who can access, retention, deletion path, which vendors process it. Include: account email and name, practice progress (local first), case studies and evidence images, resume and master profile data, application tracker (including job descriptions), Hot Seat transcripts and observations, audio in transit (not stored by default), usage ledger, logs, analytics.

### 5.2 Rules
- **Local-first first.** Default to keeping practice and drafts on the device. Anything stored server side is opt-in or required for a feature the user chose.
- **Retention:** Hot Seat transcripts stored server side only if the user saves the session, otherwise deleted within 24 hours (or kept only on device). Logs 30 days, with no content. Usage ledger kept as long as needed for billing and abuse, with personal fields removed after account deletion. Backups follow a fixed schedule (for example 35 days) so deletion completes everywhere within 30 to 60 days.
- **Vendors (processors):** list every vendor that receives voice, text or files (LLM, STT, TTS, hosting, auth, email, analytics, error tracking). Prefer paid tiers with **no training on your data** and zero or short retention modes where offered. Sign data processing agreements. Do not rely on free-tier terms in production (free tiers may use inputs to improve products).
- **Consent:** microphone use is explicit. The lobby consent line names the actual vendors. No audio recording unless the user opts in. Do not record or transcribe other people.
- **Analytics:** privacy friendly and cookieless where possible, no session replay on Hot Seat or Career Studio pages, no third party trackers.
- **Minors:** set a minimum age in the terms (for example 16) and gate sign up accordingly; do not knowingly collect data from children.
- **Legal documents required at launch (legal):** Privacy Policy (what voice and text data is processed and by whom, retention, rights, contact), Terms of Service (AI interviewer disclosure, simulated companies, no hiring decision, acceptable use, account termination), Cookie notice if any non-essential cookies, Acceptable Use and takedown policy for published portfolios, subprocessor list. Check applicability of Nepal's privacy law, and of GDPR and CCPA if you accept users from those regions. Have counsel review.
- **Rights handling:** a working process and an email address for access, export, correction and deletion requests, with a 30 day response target.
- **Payments (if you charge):** Stripe does not generally support businesses in Nepal (verify). Evaluate merchant-of-record providers (Paddle, Lemon Squeezy) or local gateways (eSewa, Khalti, ConnectIPS) and confirm cross-border card acceptance and payout path before designing pricing. Ensure the vendor billing cards you use for cloud and API accounts work internationally and have expiry alerts.

## 6. Realtime, hosting and infrastructure specifics

### 6.1 Realtime-specific production items
- **TURN:** required. With LiveKit Cloud it is included, confirm TURN/TLS on 443 works. If self-hosting, deploy TURN with TLS on 443 and TCP fallback, correct external IP configuration, and open the required UDP port range. Test from a network that blocks UDP.
- **Region:** agent workers, LiveKit, STT, LLM and TTS endpoints in Singapore or Mumbai (verify available regions per vendor) and measure from Kathmandu.
- **Warm pools:** minimum idle agent workers, scale on active session count, graceful drain on deploy (finish sessions, accept no new ones).
- **Concurrency limits per vendor tier:** document them in `VENDORS.md`, load test to twice your expected peak, request limit increases before launch.
- **Reconnects:** transparent room reconnect, STT and TTS socket reconnect with keep-alive, session returns in `paused`.
- **Browser support policy:** current and previous two versions of Chrome, Edge, Firefox, Safari; iOS 16.4 or newer. Show a friendly "unsupported browser" screen with the typing path if capture or WebRTC is missing.

### 6.2 Web app delivery
Static build on a CDN with Brotli and HTTP/3, immutable hashed assets, short TTL HTML, route level code splitting (room, studio, landing animation chunks lazy loaded), images in AVIF and WebP with dimensions, self-hosted fonts with `font-display: swap`, Core Web Vitals budgets (LCP under 2.5 s on mid-range mobile, CLS under 0.1, INP under 200 ms), Lighthouse CI in the pipeline. Pre-rendered audio and large assets on the CDN with immutable caching.

### 6.3 Data layer
Managed Postgres in the nearest region, daily backups plus point-in-time recovery, connection pooling, indexes reviewed for the main queries, migrations versioned, read replica only if needed. Redis for rate limits, quotas and locks. Object storage with versioning off for user uploads (deletion must really delete) and lifecycle rules for temporary files.

## 7. Reliability, performance and cost

### 7.1 Reliability
- SLOs: 99.5 percent monthly availability for the app and API, 99 percent of Hot Seat sessions complete without a fatal error, time to first audio per the speed handoff.
- Health checks and readiness probes, graceful shutdown, timeouts and retries with backoff and jitter on every outbound call, circuit breakers per vendor, idempotency keys on state-changing endpoints.
- **Vendor failover tested for real:** disable each vendor key in staging and confirm the ladder (second TTS, second LLM, Kokoro fallback, typing mode) works and the user sees a calm message.
- Chaos checklist run once before launch: kill an agent worker mid session, drop the database connection, rate-limit a vendor, expire a token mid session.
- **Silent vendor changes:** pin model versions. A daily synthetic session (scripted audio through the full pipeline) alerts on failure or latency regression. Subscribe to vendor changelogs and deprecation emails (use a shared inbox). Several current model prices and versions change on fixed dates (for example Dec 31, 2026), put those dates in the maintenance calendar.

### 7.2 Load testing
Simulate at least twice expected peak concurrent sessions with realistic audio. Record per stage latency, agent CPU and memory, vendor 429 rates, LiveKit participant limits, database load. Fix the first bottleneck, repeat. Keep the report in `docs/load-test.md`.

### 7.3 Cost controls (a voice product can bankrupt you by accident)
- Cost per session is logged. A dashboard shows spend per vendor per day and per active user.
- Budgets and alerts at 50, 80 and 100 percent in every vendor console, plus an internal daily cap that flips the **kill switch** (new sessions blocked, existing finish, a friendly "capacity reached" screen).
- Per user: 1 concurrent session, daily and monthly quotas, maximum session length, maximum reconnects.
- Free tier design: limited sessions per week and shorter length. Use the cheaper voice (for example Kokoro on GPU) for free users and the premium voice for paid users only if the product decision allows.
- Review the first 7 days of spend daily.

### 7.4 Compatibility and accessibility
Test matrix: Chrome, Edge, Firefox, Safari desktop, Android Chrome, iOS Safari; built-in mic, wired and Bluetooth headsets, laptop speakers; screen readers (NVDA or VoiceOver) on lobby, room, debrief, studio; keyboard-only completion of every flow; reduced motion; zoom 200 percent; slow 3G throttling for the landing page. WCAG 2.2 AA is the bar.

## 8. Local-first storage specifics (often forgotten)

- **Safari and iOS can delete local storage and IndexedDB** for sites the user has not interacted with for about 7 days (anti-tracking limits), except installed home screen apps. A local-first product must handle this. Call `navigator.storage.persist()` and check `navigator.storage.estimate()`, show a clear backup nudge, make backup export and import one click, and encourage account sync. Explain it plainly in the app ("Safari may clear data you have not visited in a week. Back up or sign in").
- Quota handling for evidence images and audio, with warnings at 80 percent.
- Schema versioning and migrations for IndexedDB, tested with old data fixtures.
- Backup file integrity (checksum) and a restore test from a real backup.
- Private browsing and storage-disabled modes handled gracefully.

## 9. Observability and operations

- **Logging:** structured JSON, correlation id per request and per session, no PII, no transcripts, no audio, no tokens. Retention 30 days.
- **Tracing and metrics:** per turn OpenTelemetry spans (speed handoff), dashboards for latency p50 and p95 by stage and path, STT and TTS error rates, fallback rate, underruns, barge-in success, session completion, cost per session, quota and rate limit hits, sign-up funnel and activation.
- **Errors:** frontend and backend error tracking (Sentry or similar) with scrubbing, release tagging, source maps uploaded privately.
- **Uptime:** synthetic probes every minute from several regions **including South Asia**, covering landing, login, API health, and one full synthetic voice session daily.
- **Alerts** (to a real channel you read, with a phone push for severe ones): API error rate, p95 latency, vendor failure, cost spike, queue backlog, disk, certificate expiry (30 days), failed backups, security events (many failed logins, many 429s).
- **Status page** (public) and a support email with an auto-reply. In-app feedback button, error page with reference id.
- **Runbooks** in `docs/runbooks/`, each one page with symptoms, checks, fix, rollback and who to tell: vendor outage, latency regression, cost spike, abuse wave, leaked key (rotate within one hour), database restore, bad deploy rollback, DDoS, data deletion request, security incident, expired certificate or domain.
- **Incident process:** severity levels, one owner per incident, short post-mortem for every severity 1 or 2.

## 10. CI/CD and release management

- Pipeline: lint, type check, unit tests, build, secret scan, dependency audit, e2e (Playwright including the fake-audio latency and mic tests), Lighthouse CI, preview deploy per pull request.
- Deploy: automated, one command or merge, **rollback in under 5 minutes** (previous image and static build retained), database migrations backward compatible (expand, then contract), feature flags for risky features with a kill switch.
- Versioning: the model, prompt, persona and audio library manifest versions are recorded per session and deployed together. Prompt and content changes go through review and a small regression suite (10 scripted interviews with expected behaviors).
- Environments promote staging to production with the same artifact.
- Canary: release to 5 percent of sessions first for voice changes, watch metrics for 24 hours.

## 11. Product and operations basics often missed

Custom domain with registrar lock and 2FA, auto-renewal, DNS managed with DNSSEC if supported, TLS auto-renew with expiry alerts; email SPF, DKIM, DMARC for the sending domain; `robots.txt` and sitemap for marketing pages only, `noindex` for app, staging and portfolios by default; 404, 500 and offline pages; maintenance mode; favicon and social preview images; privacy friendly analytics; terms and privacy links in footer and sign up; cookie notice if needed; changelog; accessibility statement; support and abuse contacts; basic SEO for the landing page (titles, meta, structured data); a waitlist or invite gate for the soft launch.

## 12. Launch plan and gates

**Stages:** (1) internal dogfood with the real production stack, (2) closed beta of 20 to 50 invited users with low quotas, (3) public soft launch behind a waitlist, (4) full public launch.

**Launch gate (all must be true, with PRR evidence):**
- [ ] Every PRR item Done or justified Not applicable. Zero Missing blockers.
- [ ] Section 1 table fully checked, including a bundle grep showing no keys.
- [ ] Auth, quotas, session authorization and kill switch tested, including abuse attempts.
- [ ] Security tests in 4.6 completed, high and critical issues fixed, CSP enforced.
- [ ] Privacy policy, terms and vendor DPAs in place (legal), consent copy lists real vendors.
- [ ] Production vendors on paid accounts, budgets and alerts set, kill switch tested.
- [ ] TURN verified from restrictive networks. Region latency targets met from Kathmandu.
- [ ] Load test at 2x expected peak passed. Failover tests passed.
- [ ] Backups restored successfully in a drill. Rollback rehearsed.
- [ ] Monitoring, alerts, status page and runbooks exist and the first alert has been triggered on purpose.
- [ ] Accessibility and browser matrix passed.
- [ ] Two people have admin access and recovery information (section 13).

**Rollback triggers:** error rate above 2 percent for 10 minutes, p95 time to first audio above 3 s for 15 minutes, cost per session above 3x plan, any security incident. Rolling back is a standing decision, not a debate.

## 13. Handover: so you never have to look back

Produce these documents in the repo and keep them short and current:
- `README.md` (what this is, run locally, deploy, test), `ARCHITECTURE.md` (diagram, data flow, regions), `DECISIONS.md` (short ADRs: why this auth, why this voice, why this region).
- `ENV.md`: every environment variable and secret, what it does, which environment, where stored, who owns it, rotation schedule.
- `VENDORS.md`: every account (hosting, DNS and registrar, auth, database, LiveKit, STT, LLM, TTS, email, error tracking, analytics, payments), plan and limits, billing owner, renewal date, support link, status page, DPA status.
- `ACCESS.md`: who has which access, two admins minimum, password manager vault, 2FA method, recovery codes stored offline, offboarding checklist. **Vendor accounts belong to the company or a shared project email, not to one person's personal account** (including the current AI Studio key).
- `SECURITY.md` (threat model, reporting), `docs/runbooks/`, `docs/prr.md`, `docs/data-inventory.md`, `docs/load-test.md`, `docs/latency-report.md`, `docs/mic-test-report.md`.
- `CONTENT.md`: how to add or edit lines, personas, company types and curveballs, and how to rebuild and publish the audio library.

**Maintenance calendar (this is the minimum to keep it healthy):**
- Weekly (15 minutes): dashboards, spend, errors, fallback rate, support inbox.
- Monthly: dependency and container updates, access review, restore one backup into a scratch database, review abuse reports, check vendor changelogs and deprecations.
- Quarterly: rotate keys, re-run the voice and LLM bake-off, security scan and dependency audit, review legal pages against actual data flows, load test, review costs and renegotiate tiers.
- Yearly: domain and certificate review, vendor contract review, privacy and security review, disaster recovery drill.
- On a vendor notice or model deprecation date: schedule the migration the same day it is announced.

Nothing is truly zero maintenance. This calendar plus alerts keeps the work small and predictable.

## 14. Build order

1. Audit: fill `docs/prr.md` with the current state of every item, including a repo search for dev leftovers and a built bundle secret scan.
2. Accounts and keys: company-owned vendor accounts, paid plans, budgets, secret manager, environments.
3. Auth, quotas, session authorization, kill switch, usage ledger.
4. Security hardening (headers, CORS, CSRF, rate limits, uploads, portfolio origin) and tests.
5. Infrastructure as code, regions, TURN, warm pools, CI/CD, rollback.
6. Observability, alerts, status page, runbooks.
7. Privacy, legal documents, consent copy, data deletion and export.
8. Load test, failover test, chaos checks, backup restore drill.
9. Closed beta with low quotas, daily review, fix, then soft launch, then full launch.
10. Handover documents and the maintenance calendar set up as recurring reminders.

After each step post a 5 line status: what shipped, evidence added to the PRR, deviations and why, open risks, next step.