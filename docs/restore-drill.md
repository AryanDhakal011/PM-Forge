# Cloud backup and restore drill

The encrypted backup workflow is prepared. First upload and restore are pending.

1. Create a private B2 bucket and a key scoped to it with list, read and write access. Set a 35-day lifecycle for backups. The workflow does not delete remote objects.
2. Generate an age keypair offline and keep the private key in two recovery locations. Add the public recipient as `PMFORGE_AGE_RECIPIENT` and the bucket as `PMFORGE_BACKUP_BUCKET` in GitHub Actions variables. Put the scoped B2 credentials and TLS-enabled Supabase session pooler URL in the workflow's named GitHub Actions secrets.
3. Dispatch **Encrypted cloud backup** on `main`. The job streams the Auth and application database schemas through age, uploads encrypted bytes, and verifies the stored object's SHA-256 digest. Keep the bucket private.
4. Download and decrypt the archive in a private environment. Inspect it with `pg_restore --list` and restore into a disposable PostgreSQL/Supabase target using the managed Auth restore guidance. Verify schema and table counts, run both SQL checks in `supabase/tests/`, and exercise login and portfolio relations. [Supabase restore guidance](https://supabase.com/docs/guides/platform/backups)
5. Record date, restore duration, row counts and test outcomes here. Enable the nightly schedule with `PMFORGE_BACKUPS_ENABLED=true` after a successful drill. Targets are a backup no older than 24 hours and recovery within four hours. Repeat monthly.

The current portfolio assets are stored in Postgres. If publication moves to object storage, add a separate encrypted bucket backup and restore it alongside the matching database snapshot.
