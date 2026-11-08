# Landing, brand and email review — 8 November 2026

## Delivered

- One finite card-unfold sequence and paper-plane flight, confined to hero artwork and started when the art comes into view. Optional replay; reduced-motion overrides; no input-blocking intro.
- Native scrolling, normal cursor, compact Monday rush and one interactive decision exercise. Removed duplicated answer controls, fake settings switches, repeated feature tours and large category-filter dashboard from the landing. The full practice library remains in the app.
- Earlier finished decision record, three real starting scenarios, compact product paths, section-aware navigation and repaired narrow-screen grid sizing.
- Original folded-F brand system across primary landing/app/account/portfolio surfaces, favicon, Apple icon, social preview and branded verification/recovery mail. Reusable SVG/PNG assets and brand notes included.
- Architecture/folder map and researched zero-cost hosting decision. Current SQLite compatibility and sender-domain blockers are documented explicitly.

## Checks and limits

- Production build (including TypeScript and authored-project gates) passed.
- Three account/template tests passed: signup/verification/login/recovery/token reuse/origin protection, HTML/plain-text expiry/link correctness and unsafe URL/attribute handling. External email was not sent.
- Browser review checked 320, 375, 768, 1024 and 1440 px: demo bounds and controls fit. Reviewed choice feedback, follow-up, reset, mobile navigation, Escape/focus restoration, active section and return-to-top. Desktop/mobile captures are in `landing-focus-verification`.
- Actual saved run availability still drives Resume links; no saved runs were reset for visual review.
- Secret scan found no configured private value in tracked/unignored source; private environment files stay ignored. No real account links are included in visual email samples.
- Existing browser regression scripts were updated for intentionally removed landing controls. They were syntax-checked, not rerun as an additional full browser suite this pass. Older 106-check Pass 2 results are historical, not a certification of the reduced landing.
- No new runtime dependency, paid service, public deployment or external email account was introduced. Physical-device testing, exhaustive accessibility audit, sustained load testing and Postgres migration remain outstanding.

## Hosting outcome

The app is running locally on port 3002 only. Vercel and Supabase connectors were inspected, but no matching Vercel project or Supabase database was provisioned. [Free-hosting decision](FREE-HOSTING.md) explains the recommended personal/non-commercial pilot stack and the required durable storage migration. [Email setup](EMAIL-SETUP.md) distinguishes local previews from actual delivery.
