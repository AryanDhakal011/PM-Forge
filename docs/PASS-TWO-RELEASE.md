# PMForge Pass 2 - local release review

Reviewed 8 November 2026. Build: `Gkc6RjxJzZXiqlby3ZK1x`.

## Open the application

Use **http://localhost:3002**. The only PMForge listener is bound to `127.0.0.1:3002`. Both `npm run dev` and `npm start` now default to this port and fail instead of silently selecting another port. Stop the running preview before switching commands. Development uses a separate build cache.

## Delivered

- Landing Pass 2: responsive editorial scenes, reactive charts, usable interactive tour, intent and time filters, finite clock/paper motion, hover/focus feedback and reduced-motion behavior. Subframe MCP inspiration informed the layout; no reference assets were copied.
- App arrival and route-loading paper transitions, corrected Today Resume label, shared progress-driven career next actions and compact animated studio navigation.
- Career Studio: profile import/review, nine-section case builder, autosave, reading depths, evidence captions and opaque image redaction, confidentiality aliases and indexed metrics, immutable resume versions, JD coverage, application pipeline, private backup/restore, publication preflight/preview and typed revocation.
- Updated privacy, terms and feedback/content policies with actual local/account/provider/publication boundaries. Public operator identity and contact details remain a launch gate.

## Test the real AI interviewer

Open Practice, choose a fictional non-behavioral case, select AI interviewer, review the free-pilot data disclosure and eligibility, then Begin. Use the approved fictional case positions. Private scratch notes stay local. Personal behavioral stories remain guided.

A real Gemini 3.1 Flash-Lite follow-up passed browser validation in **1,934 ms**. This is one sample, not a p95 or capacity result. The interviewer is prompt/scenario tuned, not weight fine-tuned. No billing or paid speech was enabled. Local diagnostic ceilings are not verified Google account quotas. The localhost pilot refuses public deployment; see [AI operations](AI-INTERVIEW.md).

## Verification

- [Pass 2 browser checks](pass-two-verification/browser.json): 106 passed, including six landing widths, light/dark studio accessibility, evidence redaction, backup/restore, resume export, application controls, publication/revocation and save behavior.
- [App surface](pass-two-surface/browser.json): 75 passed.
- [Landing regression](pass-two-landing-regression/browser.json): 21 passed.
- [Native interview regression](pass-two-native-interview/browser.json): 73 passed.
- [Real AI browser run](pass-two-live-ai/browser.json): 10 passed.
- Portfolio unit/server tests: 31 passed. AI tests: 22 passed. Offline evaluation: 28 fixtures passed; live expert review remains pending.
- Production build, TypeScript and client-secret scan passed. No private environment file was packaged.
- [Bundle report](pass-two-verification/build-and-bundle.json): no new runtime dependencies; all generated client chunks increased by 24,712 gzip bytes over the preceding build. This is not initial-page transfer or measured frame rate.

## Before public launch

Configure the real domain, production mail, persistent storage/backups and secure deployment environment; supply operator/legal contact details and obtain policy review. Verify actual provider quotas, free-tier eligibility and data terms before enabling a public pilot. Complete physical-device/browser checks, sustained latency/capacity testing and independent interview-quality review. Hosting, storage and network costs are separate from the AI budget.

Later-tier features such as DOCX, password-protected links, custom domains and advanced analytics are not claimed as delivered. See [implementation decisions and boundaries](PASS-TWO-DECISIONS.md) and [hosting setup](HOSTING.md).
