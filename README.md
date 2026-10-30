# PMForge

A practice workspace for product judgment: 63 interview scenarios, seven category workbenches, twelve three-chapter projects, evidence-backed debriefs and a private decision portfolio.

## Run locally

```sh
npm ci --legacy-peer-deps
npm run dev
# Production preview:
npm run build
npm run start -- --port 3001
```

Guest mode needs no credentials. Set up Google or GitHub through [.env.example](.env.example) before offering account sync. The account backend uses Better Auth and Node SQLite in ignored `.data/`; deployment requires durable storage and configured OAuth. Secrets and personal practice data must stay out of Git.

## Navigation

| Route | Purpose |
| --- | --- |
| `/` | Interactive landing narrative |
| `/app` | Today: suggested Easy brief, real coverage instrument, rooms and decision shelf |
| `/app/practice` | Cards, list or map; category, level, length and status filters |
| `/app/practice?view=saved` | Saved scenarios and project decision points |
| `/app/practice/[slug]` | Scenario brief and start/resume |
| `/app/run/[id]` | Guided practice, workbench, spoken synthesis, debrief and reflection |
| `/app/projects` | Twelve missions and their chapter progress |
| `/app/projects/deadlock` | The Deadlock: a dedicated playable simulation prototype |
| `/app/projects/deadlock/play/[runId]` | Floor/table, projector/Forge, and live robot supervision |
| `/app/projects/deadlock/debrief/[runId]` | Decision trace, verified counterfactual levers and fork comparison |
| `/app/progress` | Coverage, bands and project constellation |
| `/app/progress?tab=history` | Interview and project session trails |
| `/app/portfolio` | Decision records and Markdown export |
| `/app/settings` | Preferences, backup/import and account controls |
| `/app/bookmarks`, `/app/history` | Permanent redirects to Saved and History |
| `/questions`, `/projects`, `/learn` | Public library, project overview and curriculum |

The app uses native scroll. Lenis and ScrollTrigger coordinate only the marketing pages. Mobile and reduced-motion users receive an interactive SVG coverage equivalent. Cmd/Ctrl+K opens the palette; / searches Practice; g then h/p/r opens Today/Practice/Projects.

## Verification

```sh
npm run typecheck
npm test
npm run build
node docs/check-product-routes.mjs
```

Windows Chromium harnesses in `docs/verify-*.mjs` and `docs/verify-*.ts` exercise real guest flows in isolated browser profiles. GitHub Actions checks types, engine/account tests and production build on Node 24. The optional `npm run launch:check` separately reports missing launch credentials and expert reviews.

## Scope and limits

The Deadlock replaces its earlier decision-form experience with three distinct playable loops. Its event log, forks, optional notes and transcript are stored on this device; use **Export run** inside the simulation for backup. These logs are not yet included in general workspace backup/import or account sync. Vector room art and device speech are functional fallbacks. See [Deadlock QA](docs/DEADLOCK_QA.md), [known gaps and balance results](docs/DEADLOCK_GAPS.md), and the [playtest packet](docs/DEADLOCK_PLAYTEST.md). `npm run test:deadlock` verifies the engine; `npm run deadlock:sim` runs 200,000 seeded policies and currently fails its balance distribution gate with the supplied defaults.

Scenario numbers are simulated. Scenarios remain drafts until independently reviewed; readiness bands are provisional and do not grade spoken delivery or originality. No real expert ratings, public deployment or external AI scoring are implied. Guest data is browser-local; export backups from the top-bar device menu or Settings.

Set `NEXT_PUBLIC_SITE_URL` to the deployment origin. The default local origin is `http://localhost:3001`. The stack is Next.js 16.4.3, React 19.3.1, Three.js 0.182.0, R3F, drei, GSAP, Dexie and CSS Modules.

See [product MVP](PRODUCT-MVP-REPORT.md), [projects](docs/REAL-WORLD-PROJECTS-REPORT.md), [workspace corrections](docs/WORKSPACE-CORRECTIONS.md), and [asset provenance](docs/ASSET_MANIFEST.md). Older implementation reports describe earlier landing prototypes.
