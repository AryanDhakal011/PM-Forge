# Portfolio and entry experience implementation

The original requirements are retained in PORTFOLIO_HANDOFF.txt and DESK_HANDOFF.txt. The three desk attachments were identical.

## Design

Subframe MCP search_inspiration was consulted. The selected reference was Primer (https://primer.com/): an editorial grid, oversized serif typography, ruled boundaries and strong color blocks. PMForge retains its cream, forest green, ochre and serif/mono typography. No Subframe project was modified. The landing uses native CSS/SVG animation and a small interactive decision demo. It does not mount WebGL, auto-playing video, Lenis or the previous blocking loader. Reduced motion is respected.

## Portfolio

/app/portfolio contains a private career studio with Overview, Master profile, Case studies, Resume studio, Applications and Share tabs. Classic decision records remain accessible and importable. Workspace schema v4 adds profile, case, immutable resume, job and local-media stores. Account JSON exports include career text; media blobs remain local. Server workspace ownership validation covers all new top-level entities.

Profile import is local PDF.js with a self-hosted worker, editable heuristic field extraction and mandatory human review. A strictly allowlisted, bounded, timed LinkedIn URL request is best effort only; redirects and login walls fall back to PDF/paste. Layouts differ, so imported role boundaries and dates must be reviewed.

Case studies support a default 15-second skim, 2-minute narrative and artifact deep dive. Interview imports are always Strategic Teardown & Stress Test; manually entered professional work is Production Impact and requires an ownership confirmation. Every source remains candidate-controlled. No independently verified badge or percentile is invented. Replay presents five documented reasoning steps over 55 seconds. Local interview clips or uploaded explanations can be converted to a 60-second WAV; publishing audio requires separate consent.

The confidentiality workbench persists a private alias/numeric dictionary across cases. It preserves stated percentages, masks unmapped amounts, and computes actual indexed changes from a positive baseline. It does not invent a lift or inspect pixels. Images are flattened to PNG locally and individually approved before upload.

Resume versions freeze profile contact fields and selected case text. Semantic, single-column HTML prints to PDF and exports plain text/Markdown. The JD differential and sourced cover-letter draft are deterministic helpers: they do not use an external language model, infer years of experience, or certify eligibility. Selected cases must be reviewed before creating a resume.

## Sharing

Publishing is explicit. Public/signed-link modes require at least two reviewed cases, contact confirmation, confidentiality review, accuracy confirmation and real-work ownership. Mentor draft review is separately labeled and allows annotations. Share text and all selected media commit atomically; a failed publication preserves the prior snapshot. Only an owner key can update or revoke a handle. Expiring links use server HMAC signatures bound to snapshot contents. Public pages are server rendered with public-only social previews; private links are noindex and do not put candidate details in social previews.

Public inquiry retrieves exact excerpts from selected cases and, only when explicitly included, reviewed career bullets. Every answer cites its source; undocumented questions receive a refusal. This is extractive evidence search, not a generative chatbot. Views, scroll milestones and audio starts are aggregate counts, not unique people or completed listens. No third-party tracking is added.

Portfolio owner keys are part of private workspace backups. Revoke an existing publication before clearing the workspace that owns it. Expiration/revocation stops server access; it cannot remove copies already saved by a visitor. This local preview is not an internet deployment.

## Desk and corrections

The desk resumes the newest unfinished interview or recommends an untouched/weak category using latest assessed attempts. It includes reason disclosure, bookmark, evidence preview, scenario/time/status filters, keyboard-accessible SVG coverage, mobile coverage expansion and a primary action above mobile navigation. Streaks use local calendar days.

Progress now includes classic, shared-platform and authored project saves, plus case/resume counts. Decisions assessed and full learning loops are distinguished. Shared/authored saves that lack account ownership are explicitly labeled device-wide. This does not retroactively claim that old local saves belong to the current account.

All twelve projects have per-story active-play estimates. Playback is authorized independently of pending human review, while kill switches, lint and minimum-version checks remain enforced. Pending expert/playtest gates are not falsely marked passed.

Evidence cards wrap, sidebar collapse sits beside the logo, popup menus dismiss outside/on navigation/Escape, global search spacing is improved, signup is primary with guest access preserved, Help starts at the top, and the recommended card has explicit dark-mode contrast.

## Verification

See portfolio-verification/browser.json, screenshots, the ATS PDF/render and landing-performance.json. A local cold-cache desktop comparison observed resources fall from 1906 KB to 309 KB and largest-content paint from 2304 ms to 464 ms; this is not a field Web Vitals study. Re-run npm run test:portfolio and node --import tsx scripts/verify-portfolio.mjs against the production preview. The browser harness uses an isolated Chrome profile and revokes its own test publication.

Verified on the production preview: 58 browser checks and 14 accessibility scans without violations; 20 portfolio model/server tests; existing 50 core/account tests, 19 live-interview tests, and 21 platform tests plus 60 canonical platform paths passed. The PDF was parsed back to selectable text and its first page rendered for visual review.
