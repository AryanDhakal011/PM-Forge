# Production configuration readiness

The runbook's section 3 check is at `GET /api/health/config`. It checks Postgres, the Supabase public Auth settings, the publishing Edge Function, and the isolated reader with bounded requests. It returns an allowlisted projection. It does not send candidate content, perform OAuth, create accounts, or consume AI quota.

```sh
npm run verify:prod
npm run verify:prod -- --baseline
# Optional revision pin, via the shell's PMFORGE_EXPECTED_REVISION environment variable.
```

The default exits nonzero when a required release configuration check is open. The baseline checks the current guest deployment and labels incomplete release capabilities OPEN. Neither command certifies the signed-in publishing journey or other work-order acceptance tests.

The script is also available as `pnpm verify:prod` in a pnpm-managed checkout. Use the npm commands above in this repository to preserve its existing npm lockfile and installation.

## Evidence

- Local cloud suite passed 15 tests, including the response shape, no operational details forwarded, upstream credential isolation, and failure handling.
- The restored npm installation produced a complete production build. The release secret scan checked 1,387 files and available Git history patches and reported zero findings.
- Direct read-only checks against the deployed Supabase project returned HTTP 200 for the health RPC and Auth settings. Auth settings reported Google and GitHub disabled and the upstream email provider enabled. The PMForge app has email sign-in disabled.
- The [production command log](production-check.txt) records deployment `b6002c07ccc5532a568b1ccd3cf1dd33fb884bb5` on 15 November 2026. The revision-pinned baseline exited 0. Full readiness exited 1 with the outstanding gates. The reader returned 404 for the app-only readiness route.

The hosted public Auth settings do not advertise manual linking, CAPTCHA, or an anonymous provider field today. Their readiness remains false until dedicated verification is connected. AI provider results and operations timestamps remain false or null until the provider probe and operations work orders can supply verified success. Those fields must never be populated solely from the presence of a key or a feature flag.

[Supabase Auth settings](https://supabase.com/docs/guides/auth/general-configuration) · [Supabase Auth management API](https://supabase.com/docs/reference/api/v1-get-auth-service-config) · [Vercel deployment metadata](https://vercel.com/docs/environment-variables/system-environment-variables)
