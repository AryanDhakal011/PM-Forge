> Superseded for the owner-selected free hosting route: see [current cloud migration and deployment status](FREE-CLOUD-MIGRATION.md). The guide below records the earlier local/container architecture.

# Hosting decision — 9 November 2026

No hosting resources were provisioned and no spend was authorized by this change.

## The smallest deployment compatible with today's code

Use a single Docker web service on Render in Singapore, with a paid persistent disk mounted at `/data`. Next.js serves both the frontend and API backend. Better Auth, synced workspaces, portfolio snapshots, mail outbox and quota ledgers use SQLite on that disk. Device-only practice remains in IndexedDB. Do not run replicas or put SQLite on a network filesystem.

`deploy/render.yaml` is a review-only starter blueprint, with automatic deployment off and external AI disabled. It is not a free hosting promise. A host subdomain can serve the pilot over HTTPS without purchasing a website domain, but email signup still needs an owned, verified sender domain or a separately configured OAuth provider. Health remains 503 until account configuration is ready. Verify the host-overwritten client IP header; never trust a header supplied by the browser.

Realtime Hot Seat additionally needs LiveKit Cloud and a long-lived agent worker built with `services/hot-seat-agent/Dockerfile`, configured with separate vendor keys, reviewed terms, quotas, budgets, approved voices and regional measurements. Do not put the worker in a short-lived Next.js function. The existing guarded stack is not a publicly verified service. Local guided practice, local speech and on-device dictation incur no per-request AI bill, but transfer, hosting and device compute still have costs.

## Can an already-hosted site be updated?

Yes. Commit → CI checks → backup → deploy the new image → verify health and a real account/session → promote. Keep the preceding image and database snapshot. Content and app updates do not require users to reinstall. Keep old asset hashes available for open tabs. A persistent disk means the current Render deployment has a restart interruption; it is not a zero-downtime architecture. Do not deploy over an active premium voice room; drain first.

For the high-availability architecture in the handoff, migrate the synchronous SQLite stores to managed Postgres, move limits/leases to shared durable services, move public assets to private object storage and use a separate portfolio origin. That migration is **not implemented**. It is a different release, not a configuration toggle. Vercel plus Supabase is a possible future option, not a working drop-in deployment of the current storage layer.

## Low maintenance, not no maintenance

The owner must monitor security updates, expiring provider models/credentials, delivery failures, spending, disk space and backups. Assign a second administrator and a durable shared inbox. Before public launch: complete `docs/prr.md`, restore an off-host encrypted backup, test rollback and trigger a real alert. A static marketing-only site could be free; this authenticated realtime voice product cannot honestly be promised free and unlimited forever.

Official references checked for this decision: [persistent disks](https://render.com/docs/disks), [deployment interruption with a disk](https://render.com/docs/deploys), [Blueprint schema](https://render.com/docs/blueprint-spec). Check prices and region availability when provisioning; no price is locked here.
