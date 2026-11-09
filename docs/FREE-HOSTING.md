> Superseded for the owner-selected free hosting route: see [current cloud migration and deployment status](FREE-CLOUD-MIGRATION.md). The guide below records the earlier local/container architecture.

# Free hosting decision — 8 November 2026

For a **personal, non-commercial pilot**, the recommended target is Vercel Hobby for Next.js and API routes, Supabase Free for durable Postgres/storage, and the existing bounded Gemini fictional pilot. Use the free provider subdomain initially. Vercel Hobby restricts use to personal/non-commercial projects; a commercial PMForge launch requires an eligible alternative. No paid plan, trial or domain was enabled.

This is a target architecture, **not a completed migration or deployment**. The current tested release uses synchronous SQLite. Adding a Supabase URL or deployment file does not migrate it.

## Required migration

1. Introduce server-only Postgres repositories for Better Auth, account synchronization, published snapshots/assets, request limits and encrypted mail state. Preserve browser Dexie and saved run IDs.
2. Port AI admission to Postgres transactions/row locks with ownership, idempotency and run leases. Prove cross-instance admission and retry recovery against a real database.
3. Put operational tables in a private schema. Exposed tables/buckets require ownership policies and RLS; no service keys in browsers. Define transactional media-publication cleanup.
4. Replace process-local mail timers with durable scheduled delivery. Keep queue encryption and provider idempotency. Test recovery mail after process termination.
5. Back up local data; test migration and restoration in isolation before cutover. Verify accounts, shares, revocation, retention and duplicate requests.
6. Configure HTTPS origins, trusted proxy headers, server secrets and free-tier ceilings. Keep public AI guided until real quotas and data terms are verified.

## Options

| Option | Compatibility | Free boundary |
| --- | --- | --- |
| Vercel Hobby + Supabase | Requires the migration above | Non-commercial pilot; database size/egress caps and inactivity pausing |
| Render Free | Node runs; current persistence is unsafe | Ephemeral filesystem, no free persistent disk, cold starts; free Postgres expires after 30 days |
| Cloudflare / Sites | Requires Worker/database adapters | Current synchronous `node:sqlite` is not a D1 adapter |
| Existing Docker release | Matches the current implementation | Requires an actually persistent host; no guaranteed free VM was provisioned |

Do not upload environment secrets, databases, mail previews or backups. Free website hosting is separate from email sender-domain ownership and AI capacity.

The current public asset set measures approximately 81.8 MB across 1,193 files (including 10.9 MB of OCR language data); authored level data is approximately 0.6 MB. Those are source asset sizes, not per-visit transfer. Lazy delivery, CDN caching and portfolio upload/egress ceilings still matter on any free plan.

The Supabase connector returned no projects. Vercel became connected during this pass; its project search returned no matching PMForge project. Git remote: `https://github.com/AryanDhakal011/PM-Forge.git`. Consult the release note for the actual pushed branch/commit; this document does not establish a deployment.

After connection, Vercel account inspection confirmed the Hobby plan. The local repository is not linked to a Vercel project. The remaining deployment blocker is the durable database/queue migration described above, rather than connector access. No deployment or paid resource was created.

## Sources checked

- [Vercel Hobby and non-commercial limits](https://vercel.com/docs/plans/hobby)
- [Vercel filesystem limitations](https://vercel.com/docs/functions/runtimes#file-system-support)
- [Supabase Free database limits](https://supabase.com/kb/faqs/platform/database-only-cost)
- [Supabase inactivity pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Render Free limitations](https://render.com/docs/free)
- [Resend verified domains](https://resend.com/docs/dashboard/domains/introduction)

Verify limits and terms in the owner account when provisioning. Public launch readiness is not claimed.
