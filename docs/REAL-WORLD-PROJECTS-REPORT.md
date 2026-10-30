# Real World Projects — implementation report

## What ships locally

Twelve campaigns, 36 chapters and 74 authored choices are implemented from the supplied handoff. The original document is preserved in `docs/REAL-WORLD-PROJECTS-HANDOFF.txt`. Briefs, conflicting evidence, choice costs, numeric deltas, conditional carry rules, reactions and later constraints are explicit authored content in `src/lib/projects/content.ts`. Quantitative starting values, detailed observations and delta vectors are implementation elaborations, not SME-validated source facts.

Navigation:

```text
Landing Explore Projects → /projects → /app/projects
→ /app/projects/[projectId] → entrance → /app/projects/[projectId]/run/[id]
→ brief/evidence → choose → review known cost → lock → consequence
→ chapter 2 → chapter 3 → /app/projects/debrief/[runId]
→ export / targeted Interview practice / alternate timeline
```

`/app/projects/[projectId]/c/[ch]` previews an available chapter brief without mutating a run. Later briefs are concealed until earlier chapters have been completed in that workspace. No level gating is applied.

The gallery has all 12 palettes, responsive cards, category filters, one role/practice-based recommendation, and New / In progress / Completed-with-archetype states. Projects appear in the desktop rail, mobile More menu, command search, Home entry, progress constellation, history Project filter and bookmarks. Both entire projects and chapter decision points can be bookmarked.

## Campaign loop

- A reusable finite GSAP/SVG entrance runs for about 8.5 seconds, with skip after 2.5 seconds. Reduced motion settles after 300 ms. Entrance completion persists, so reload does not force it again.
- A focused campaign screen shows state meters, residual pre-choice trails, the current chapter’s stakes, evidence, competing commitments and stakeholder state indicators.
- At least one evidence source must be inspected. Ranking surfaces require an explicitly accepted or adjusted evidence order. There is no wall-clock countdown or speed grade.
- The separate lock dialog states the known cost. A locked choice becomes immutable in that timeline. Its authored deltas are bounded, its matching carry rules are applied, and a consequence trace is stored with before/after values.
- Reactions last approximately 0.6–1.1 seconds. Fractures, dimmed seats, momentum and recovery language are selected from the locked decision and carry rules. No random or generated plot is used.
- Pause, reload, recap and save/exit preserve the exact phase and state. Rationale drafts autosave, including navigation cleanup. A competing-tab revision conflict offers reload and a recovery export rather than silent overwrite.
- After chapter 3, the debrief returns to paper. It presents the outcome, exact decision → delta → reaction → constraint chain, an archetype definition, three alternate levers, JSON/Markdown exports and Interview practice suggested from the most exposed operating tradeoff. Last Mile gets a multi-stakeholder tension map instead of a single archetype.
- Replay from any completed chapter creates a new run, reconstructs the prefix through the engine, preselects a different choice and preserves the original. Every named archetype is reachable by an authored path.

All numeric meters are fictional operating indices or simulated runway weeks, not performance scores. Campaigns have no rubric totals or leaderboard. The 45–75 minute duration is a planning estimate, not a participant-tested median.

## Persistence, consent and ownership

Dexie schema version 2 adds a separate `projectRuns` store. Existing interview tables are retained. Workspace v1 backups remain compatible through an optional `projectRuns` field; export/import/reset, guest-to-member import and account deletion include campaigns. Foreign imports use deterministic scoped IDs and preserve replay-parent aliases.

Project trails are validated by replaying authored rules on import and at the account API. Forged state, consequences, choice histories and unknown project IDs are rejected. Local writes use revisions and transactions; imports reject divergent locked trails and conflicting equal-revision drafts. Recovery across simultaneous devices is conservative: a conflict may require keeping/exporting the local timeline and choosing an explicit branch, rather than an automatic merge.

Rationale sync is **off by default per campaign**. The UI offers explicit opt-in; the workspace client strips opted-out rationale and the server strips it again. Local drafts and explicit JSON/Markdown exports still include the user’s own rationale. Disabling rationale sync removes it from the next uploaded snapshot. Existing local rationale is preserved when a redacted remote snapshot is imported.

Backup import and account snapshot payloads are bounded to 1 MB, with strict per-field and per-array validation. Export before a workspace exceeds that sync/import envelope. Local browser eviction risks still apply; an export or configured account remains important.

## Decisions and scope differences

- This is the existing local Next.js product. No hosted Site, database, account credential or production deployment was fabricated.
- Guest campaigns remain available for device-only practice, consistent with the existing guest Interview experience. This deliberately differs from the new document’s account-only wording. A guest cannot claim account sync, and member API ownership is checked against a real signed session.
- The existing configurable Better Auth + Node SQLite account backend carries the validated campaign snapshot. Cloudflare D1 provisioning/migration remains deployment work; this is not a D1 implementation.
- Entrances use GSAP + SVG/CSS and allocate **no project WebGL context**. The project palettes and content are local; no image/video or third-party narrative requests are needed. Motion is finite and has reduced-motion paths. Physical-device 30 fps and mid-range Android performance are not certified.
- The handoff’s contradictory Last Mile cost wording is resolved explicitly: waiving penalties and refunding customers shifts the cost to the platform. Safe-route boundaries remain binding in every option. Clinical and emergency settings are fictional product-allocation exercises.
- Archetypes describe commitments, not personalities. Structured framing choices drive consequences; free-text wording is not secretly scored for hedging or sentiment.

## Verification

- Production build and type checking pass with the new route map.
- `npm test` passes **47 tests**, including all existing interview/calibration/account checks and the project suite, shared readiness validation and stakeholder-pressure polarity.
- Project tests exhaust **106 authored choice combinations**, reconstruct **318 chapter replay starts**, cover paused/empty/duplicate-lock/tampered-history edges for each project, verify the Sacred No carried crash exactly, and require every named archetype to be reachable.
- The signed-session API test stores and restores a locked project chapter, checks exact carried state, ownership isolation, malformed-history rejection, opted-out rationale removal and explicit opt-in preservation. It uses generated test sessions against a temporary database, not a live OAuth provider round trip.
- The production project browser walkthrough passes **41 assertions**: all 12 campaigns completed through their real decision surfaces; entrance skip/reload; pause/reload; exact canonical state; Sacred No’s carried fracture; coherent replay without original mutation; inert notes; history/progress/bookmarks; mobile gallery/ranking; reduced motion; competing-tab conflict; no runtime exceptions.
- The existing production Interview workflow still passes **25 browser assertions**, including offline recovery. Reports are at `docs/project-verification/results.json` and `docs/product-verification/results.json`; local PNG captures are ignored by Git.
- A final **16-assertion smoke pass** on the rebuilt module additionally verifies visible bookmark confirmation, targeted practice routing, consented foreign-backup scoping with the original preserved, and the server-rendered public gallery. Its report is `docs/project-verification/smoke.json`.
- A repository workflow runs typecheck, engine/account tests and build on push/PR. It has been added locally; no remote CI execution or Git push is claimed.

## Opened-card UI correction

All 12 project landing panels now share a warmer textured surface, paper category tags, deliberate two-line titles, separate setting/skill/practice layers, narrower readable text, a clearer action row, and minimal time/pause metadata. Entrance mechanics are behind an accessible disclosure. Chapter cards distinguish Available, Locked and Completed with state-specific fills, icons and actions; locked chapters have unique authored teasers and no inactive navigation links. Chapter progress follows the active timeline when one exists, otherwise the latest completed timeline.

Production build and typecheck pass. `docs/project-verification/cards.json` records 42 passing browser checks: all 12 panels at 1440, 390 and 320 px, two-line title fit, no horizontal overflow, primary-button contrast of at least 4.5:1, distinct locked teasers, disclosure behavior, persistent save state, completed/review presentation and exact chapter resume routing. Local screenshots use the `cards-` prefix.

## Remaining launch work

The later [research-informed UX corrections](PROJECTS-UX-RESEARCH.md) add chapter navigation, read-only commitment review, compact mobile meters, accessible save/readiness feedback and transactional decision locking. A failed local write now retains the prior phase and the decision draft rather than displaying a falsely locked consequence. Research sources and current verification limits are documented there.

Independent PM review of the new authored observations and state vectors, participant testing of ambiguity/archetype language and duration, physical-device and screen-reader audits, live Google sign-in credentials, and deployed account/D1 acceptance remain required. Current content is honestly marked as awaiting expert review. No public launch or external messages were sent.

Run `npm run start -- --port 3001` after building, then open `/app/projects` or the public `/projects` overview. All campaign code and reports remain local and uncommitted.
