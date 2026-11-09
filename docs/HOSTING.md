# Hosting PMForge

For the requested zero-cost pilot, read [the free-hosting decision](FREE-HOSTING.md) first. Local SQLite is not durable on serverless hosts.

PMForge is prepared for a **single persistent Node server**, with Caddy or the managed host terminating HTTPS. SQLite and the private mail queue require a persistent disk. Ephemeral or multi-replica serverless hosting is not supported. Optional realtime voice has a separate long-lived worker and vendor budget. Read the [hosting decision](HOSTING-DECISION.md) and [production audit](prr.md) before provisioning.

## Configure

1. Use Node 24 and Docker Compose on a Linux host. Point a domain's DNS to that host and allow ports 80 and 443.
2. Copy `.env.production.example` to `.env.production`. Keep this file private and out of Git.
3. Set `PMFORGE_DOMAIN`, `SITE_URL`, and `BETTER_AUTH_URL` to the same production HTTPS origin (the domain value has no scheme). Generate independent secrets with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Set both `BETTER_AUTH_SECRET` and `PMFORGE_SHARE_SECRET`. Preserve them across deployments.
4. Configure `RESEND_API_KEY` and `AUTH_EMAIL_FROM` with a sender on a verified sending domain. Email signup requires verification before login; verification links expire after one hour, password-reset links after 30 minutes. Do not enable preview mail transport in production.
5. Optional Google/GitHub login: configure each complete client ID/secret pair. Register the exact callbacks `https://YOUR_DOMAIN/api/auth/callback/google` and `https://YOUR_DOMAIN/api/auth/callback/github` with the provider. Account linking is disabled; an existing email is not silently linked to a different identity provider.
6. Run `node --env-file=.env.production scripts/check-launch.mjs`. Resolve every failure. Expert content calibration is reported separately from deployment readiness.

The repository does not contain live credentials or a verified production sender. Local development can use `AUTH_EMAIL_MODE=preview` with a test secret and local `BETTER_AUTH_URL`; messages are written to a private `mail-preview` directory beside the database. This mode never delivers email and is rejected in production.

## Build and launch

```sh
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d
docker compose --env-file .env.production ps
```

The app runs without root privileges and its port is internal to Compose. Caddy provisions HTTPS and overwrites the trusted client-IP header used by rate limiting. Keep the app port private; do not expose it directly to the internet. If using another trusted proxy, strip incoming client-IP headers and supply an authoritative header matching `AUTH_TRUSTED_IP_HEADER`.

`GET /api/health` checks database access and configured account readiness. It returns 503 when required production configuration is absent. It does not validate external email delivery or DNS; send a real test verification and recovery email before opening registration. Check provider delivery failures as well as HTTP health. Pending encrypted mail retries up to five times, and mail rows are removed after 24 hours when the queue next drains. Keep the server running for retries.

Smoke-check signup, email verification, login, logout, recovery, guest-to-account import, account sync, portfolio publication/revocation, microphone denial and a project resume on the actual HTTPS domain. OAuth must be exercised with real provider credentials. Auth pages use no-referrer and HTML uses a fresh CSP nonce; do not publicly cache HTML or replace the policy with a static nonce.

The post-build step assembles a self-contained `.next/standalone` directory with public and versioned client assets. A manual Node deployment may use `npm ci --legacy-peer-deps`, `npm run build`, then `HOSTNAME=127.0.0.1 PORT=3000 npm run start:server`, behind an HTTPS proxy, with the same environment variables. `npm start` is the isolated local review preview, not the recommended hosted command.

## Back up and restore

```sh
docker compose --env-file .env.production exec app node ops/backup-data.mjs
```

This creates a consistent SQLite snapshot in the private backup volume using `VACUUM INTO`, then verifies its integrity. Copy snapshots to encrypted off-host storage under your own retention policy; a second Docker volume on the same disk is not a disaster-recovery backup. Preserve the environment secrets separately. Never put database files, mail previews or backups under `public/`.

To restore, stop the app, retain the current database as a rollback copy, and replace `/data/pmforge.sqlite` with a verified snapshot owned by the container's `node` user. Remove stale SQLite WAL/SHM sidecars only while the app is stopped and after retaining the current database together with those sidecars. Start the app and verify login, workspace versions, shares and health. Test this procedure on a separate deployment before relying on it.

Server backups cover accounts, synced workspace data, published snapshots and the private email queue. Guest browser saves, device-only campaign saves, local audio and un-synced files require the app's browser export; they are not present in the server database. Do not promise cross-device recovery for device-only material.

## Operations and updates

Run the unit suites, `npm run typecheck` and `npm run build` before release. Review `npm audit --omit=dev` and dependency updates before launch. Rebuild the image for each release, keep the persistent volumes, and retain the preceding image plus a verified pre-release database backup. Do not run two app replicas against a shared SQLite volume. If horizontal scaling is required, move account/workspace storage, mail workers and rate limiting to suitable shared services first.

Monitor restarts, disk capacity, database backups, email delivery and HTTP failures. The application applies origin checks, request-size limits, database-backed auth rate limits, password hashing through Better Auth, HttpOnly sessions, HTTPS secure cookies and password-reset session revocation. This implementation and automated checks are not an independent security audit. Set operational support/privacy contact details before public launch.

## Verification limits on the development machine

The Docker client is installed, but the Docker engine is not running; an actual container build must be verified on the hosting machine. The standalone Next build and local browser flows are tested separately. Public deployment, real email delivery, DNS/TLS issuance and live OAuth need the production domain and provider credentials.


## AI interview operations

AI starts in `guided` mode and uses no external inference budget. The server-only key, three operating modes, data eligibility, model selection, durable limits, cleanup and measured pilot results are documented in [AI-INTERVIEW.md](AI-INTERVIEW.md). Keep public AI admission closed until its quota, terms, quality and load-test gates are satisfied. No paid speech service activates in $0 mode.

The standalone and Docker artifacts include `ops/ai-control.mjs`. Run `node ops/ai-control.mjs status`, `kill`, `resume`, or `cleanup` with the same persistent database path as the app. Schedule cleanup and include encrypted AI state in the private backup policy. One Node/SQLite deployment can run multiple processes against one local database; this does not authorize replicas on independent disks or network-mounted SQLite. Provider inference charges remain separate from hosting, storage and bandwidth.

On Windows local development, stop a server running from `.next/standalone` before rebuilding that directory. Use the pinned preview command for uninterrupted review during a rebuild; deploy new immutable artifacts rather than overwriting a running server folder.

The single local review URL is http://localhost:3002. Both start commands default there; local development has an isolated cache. Disable `PMFORGE_AI_LOCAL_TEST` before public deployment. This flag exists only for the bounded local fictional pilot and does not establish real project quotas.
