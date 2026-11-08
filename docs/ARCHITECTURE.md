# PMForge architecture and folder map

PMForge is one Next.js application. Keep the frontend and API routes in the same repository and origin; separate deployments would add authentication and CORS complexity without solving persistence.

| Folder | Responsibility |
| --- | --- |
| `src/app` | Pages, API routes, metadata and icons |
| `src/components/landing` | Landing narrative, first decision, hero flight and scene motion |
| `src/components/ui` | Shared controls and canonical Logo/BrandMark |
| `src/components/product` | Workspace shell, interviews and account UX |
| `src/components/portfolio` | Career Studio, case readers and sharing |
| `src/lib/product` | Practice engine, local Dexie, server auth/storage/mail |
| `src/lib/interview-ai` | Provider boundary, prompts, durable ledger and cost controls |
| `src/lib/portfolio` | Case schema, privacy transforms and publication |
| `content`, `src/content`, `levels`, `platform` | Authored scenarios and versioned project engines |
| `public/brand` | Original vector mark, lockup, reversed mark and email PNG |
| `tests`, `evals` | Engine/security tests and held-out AI fixtures |
| `scripts` | Build, validation, preview and operations helpers |
| `deploy`, `Dockerfile`, `compose.yaml` | Persistent Node hosting and proxy |
| `docs` | Setup, product decisions and verification reports |

Browser storage holds guest work and device media. Server SQLite holds accounts, account sync, publications, admission counters and encrypted mail/AI recovery state. Provider calls receive permitted committed context; secrets never enter the browser.

Do not rename authored folders merely for cosmetic tidiness: manifests, asset references and saved IDs depend on them. This pass removes obsolete landing components, consolidates branding and adds an explicit deployment map while preserving those boundaries.
