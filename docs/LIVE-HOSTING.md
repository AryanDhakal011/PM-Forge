# Live hosting handover — 10 November 2026

PMForge is live at **https://pmforge-tau.vercel.app/** as a free device-practice beta.

- Frontend and application APIs: Vercel Hobby, Mumbai (`bom1`).
- Managed backend: Supabase Free project `pmforge`, Mumbai (`ap-south-1`).
- Isolated portfolio reader: https://pmforge-reader.vercel.app/.
- Verified production source: `main`, commit `23c0536c1ede65c7bcad1a0ac857d6d0a26b056d`, status Ready.
- Future production updates: push tested changes to `main`; Vercel builds and deploys automatically. Database migrations and Edge Function releases remain separate operations.

The reported Dependabot Next.js update failure (`0ae2d33`) was a Preview deployment, separate from production. The initial production build also caught a Windows/Linux filename-case mismatch in an audio-license check; commit `d29d7ec` fixed that check. Production subsequently succeeded. Earlier preview errors remain in history and do not replace the working production site.

Automatic Preview Branch Tracking is now disabled and verified after reload on **both Vercel projects**. This covers older branches that do not contain the new repository configuration. Production tracking remains on for `main`. Production failure notifications were not muted.

Live HTTP checks verified the homepage, practice/projects/Hot Seat pages, Postgres health, HSTS and nosniff headers, denial of anonymous workspace sync, main-to-reader redirects, and reader account/workspace route isolation. Evidence: `cloud-verification/live-http.json`, `live-landing.png`, and `previews-disabled.png`. The previous migration test report records 153 passing automated tests and live database ownership/transaction checks; it predates public deployment.

## Remaining feature setup

Public email/OAuth signup, account cloud sync, authenticated portfolio publication and hosted generative AI are **not enabled**. The separate reader infrastructure is ready, but account-dependent publication still needs configured and verified authentication. Guided/device practice remains available without paid AI. Public microphone/device verification and the broader owner production-readiness review remain separate gates.

Localhost browser saves do not automatically move to the public site. Export the old workspace from Settings and import it at the live origin. Free hosting has usage limits and Supabase Free may pause for inactivity; no paid upgrade or unlimited-service promise was made.
