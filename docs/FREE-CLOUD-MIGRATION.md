# Free managed hosting - 9 November 2026

> Superseded deployment status: PMForge is now live as a device-practice beta. See [the verified hosting handover](LIVE-HOSTING.md), dated 10 November 2026. The provisioning notes below record the earlier migration stage.

Owner selected free hosting and explicitly selected **aryan's Org**. Supabase quoted **$0/month** before project creation. No paid upgrades, paid services or billing changes were enabled.

## Actual resources and status

- Supabase Free project `pmforge`, ref `wddsmywlorlcmdlfkett`, Mumbai (`ap-south-1`), active.
- Three versioned migrations applied; Edge Function `pmforge-backend` deployed. Database RPC and function health both returned HTTP 200.
- Vercel Hobby is the intended Next.js host. The connector returns workspace-access 403 after owner approval. Direct dashboard sign-in is pending. **No public PMForge URL is deployed or verified yet.**
- Public account delivery/OAuth and the isolated portfolio reader are not configured. Do not advertise those as live.

## Architecture and security

Vercel runs the existing Next.js frontend and same-origin APIs. Supabase manages Auth, Postgres and narrowly scoped privileged operations. Device practice remains in IndexedDB. The existing Node/SQLite backend stays available locally when the storage driver is unset or `local`. Cloud mode refuses SQLite instead of writing to an ephemeral server disk.

Existing account UI/API contracts are preserved. The server uses PKCE, HttpOnly host-only cookies and verified identities. Workspace reads use owner RLS; writes use atomic expected-version checks. Stale tabs receive 409 and keep local work. Direct write RPCs are also rate limited. Recovery claims are one-use and expire; revoked sessions lose database access even while an old access JWT has not expired.

Portfolio publication/account deletion use the Edge Function. Its backend secret comes from Supabase's built-in `SUPABASE_SECRET_KEYS.default` (legacy service-role runtime fallback only). No privileged key is installed in Vercel, browser code or Git. Privileged actions verify the provider identity and live database session; private/review reads require exact capabilities. Public responses omit private database columns.

The separate reader deployment has no account/workspace routes. Main-site portfolio links redirect there; publication stays closed until its origin is configured. PNG validation checks dimensions, structure and CRCs and strips ancillary metadata. WAV validation bounds PCM/float containers and removes extra chunks. This is not pixel re-encoding or a malware scanner. HTML/SVG/documents are never served as public uploads.

## Deployment

Use Node 24 and Git-based Vercel deployment from the verified release commit. Install: `npm ci --legacy-peer-deps`. Build: `npm run build`. Git deployment avoids the CLI source-upload limit for the existing media library. Do not deploy a stale main branch.

Server-only configuration on the main app (see environment examples):

```dotenv
PMFORGE_STORAGE_DRIVER=supabase
SUPABASE_URL=https://wddsmywlorlcmdlfkett.supabase.co
SUPABASE_PUBLISHABLE_KEY=<project publishable key>
SITE_URL=https://<main-project>.vercel.app
BETTER_AUTH_URL=https://<main-project>.vercel.app
PMFORGE_DEPLOYMENT=production
PMFORGE_AI_MODE=guided
PMFORGE_AI_MONTHLY_BUDGET_USD=0
PMFORGE_AI_LOCAL_TEST=false
PMFORGE_REALTIME_ENABLED=false
PMFORGE_VOICE_ENABLED=false
PMFORGE_PAID_SPEECH_APPROVED=false
PMFORGE_CLOUD_EMAIL_ENABLED=false
PMFORGE_CLOUD_GOOGLE_ENABLED=false
PMFORGE_CLOUD_GITHUB_ENABLED=false
PMFORGE_PUBLIC_PORTFOLIO_ONLY=false
PMFORGE_PUBLIC_PORTFOLIO_ORIGIN=https://<reader-project>.vercel.app
```

The reader project uses the same code/Supabase publishable configuration, SITE_URL pointing at the main app, and `PMFORGE_PUBLIC_PORTFOLIO_ONLY=true`. Do not add legacy auth secrets, provider AI/speech keys, worker secrets or a service-role key to either project. Reader routes permit portfolio pages, assets/events, static resources and health only. Account/app routes return 404. Signed links use no-referrer and no-store headers.

### Accounts

Configure the actual main site URL and exact `/api/auth/callback/cloud` redirect in Supabase Auth. Configure either an owned verified SMTP sender or a real Google/GitHub OAuth application using Supabase's callback URL. Default Supabase mail is restricted, not a public production sender. Do not create temporary email identities or enable untested delivery. Enable the relevant cloud flag only after HTTPS signup, verification, login/logout, password recovery/replay, deletion and OAuth callbacks pass. Flags describe tested availability; they do not provision providers.

### Updates, migration and rollback

Yes, changes can be uploaded after hosting. Commit, run checks, push the linked release branch, verify the preview, then promote. Device saves and managed Postgres survive app deployments. Keep database migrations additive and versioned; never reset production. Rolling back an app does not reverse database changes. Back up/export separately and test restoration. Supabase schema/function deployments are separate from Vercel app deployments.

Package the function with `node scripts/package-cloud-backend.mjs`; upload every emitted file, entrypoint `index.ts`, import map `deno.json`. Gateway JWT verification is off because the function authenticates privileged actions itself and validates capability tokens for private reads. Never remove those checks. New DDL requires a new CLI-generated migration and Supabase migration application, not edits to an applied migration.

Localhost and the hosted origin have separate browser storage. Export your old workspace in Settings and import at the new origin. No local saves were overwritten or uploaded during this migration.

## Free capacity

- Workspace: 1 MiB/document, 100 MiB globally; 120 operations/minute/member. Profile URL imports: 5/minute.
- Publishing: 3 handles/account; 3-30 character handles; expiry up to 180 days. PNG/WAV: 1 MiB/file, 2 MiB/snapshot, 10 MiB/account, 100 MiB globally. Portfolio JSON: 50 MiB globally.
- Public read/event buckets: 1,000/minute each, shared; publishing: 10/minute/member. Mentor comments: 100/snapshot and 10 MiB globally. Atomic Postgres limits work across instances; attackers can still consume provider-level free invocations. This is not a DDoS immunity guarantee.
- Hosting, database, storage, network, AI and speech are separate resources. [Vercel Hobby](https://vercel.com/docs/plans/hobby) is for personal, non-commercial use and stops features at limits. Supabase Free can [pause for low activity](https://supabase.com/docs/guides/platform/free-project-pausing). Do not defeat inactivity rules with artificial keep-alives or promise zero maintenance. Recheck actual limits before launch.
- Hosted generative inference and paid realtime workers remain off. Guided Hot Seat, scenarios, prerecorded female voices, on-device Kokoro and device dictation remain available. Do not call guided conversations unlimited live AI. Model downloads and browser compute depend on the user's network/device.

## Verification and remaining gates

Passed: production build, TypeScript, 14 cloud tests, 3 existing auth tests, 31 portfolio tests 54 core tests and 51 Hot Seat tests. Hosted database/function health and live SQL owner isolation, version conflicts, session revocation and recovery replay checks passed. SQL fixtures in `supabase/tests/workspace-isolation.sql` roll back. Port 3002 browser check used the managed backend: typed guided answer, follow-up, pause/save and honest unavailable-account disclosure. See `cloud-verification/signup.png`.

Security advisor notices were reviewed: default-deny RLS tables intentionally have no client policies; authenticated SECURITY DEFINER entrypoints intentionally use empty search paths, fixed SQL and owner/live-session validation. Backend-only publication functions are not executable by anon/authenticated roles. Notices were not silenced by broadening grants.

Remaining: Vercel deployment and actual-domain QA; real account provider/delivery setup; isolated reader deployment and full authenticated publish/revoke/delete tests; public microphone/device checks; owner policy review, backup/restore and alerts. The broad earlier PRR is not automatically complete. `/api/health` reports database readiness separately from account/reader configuration and hosted AI availability.
