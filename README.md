# PMForge

A local-first practice ground for product judgment. PMForge turns a landing-page narrative — **CHAOS → SIGNAL → DECISION → IMPACT** — into working tools: a 3D decision engine, a ten-input signal test, a project workbench, a timed interview lab, a career board, and a downloadable decision blueprint.

The build is a Next.js App Router application. There is no backend, no hosted account, and no model call. Profiles, progress, and preferences live in the browser's `localStorage`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Production check:

```bash
npm run typecheck
npm run build
npm run start
```

Set `NEXT_PUBLIC_SITE_URL` before a real deployment so canonical and Open Graph URLs resolve to the production origin. Without it the app uses `http://localhost:3001`. The current local production preview runs on **port 3001** (`$env:PORT=3001; npm run start` on Windows).

## What is real

- The hero is a live React Three Fiber scene with a poster fallback when WebGL is unavailable or reduced motion is on.
- The signal test is keyboard- and pointer-operable, with a pinned scene and persisted result.
- The learning path reads real progress from `pmforge.learning.v1`; it no longer ships sample completion states.
- The workbench has two scenarios, four phases, five sprint checks, a pressure decision, consequences, and a copyable decision record.
- The interview lab uses the browser's Web Speech API for optional dictation after explicit consent. The browser's speech provider may process audio remotely; PMForge does not record or store audio. Written answers are scored locally with a deterministic seven-criterion rubric.
- The blueprint validates eight fields with Zod, persists a draft, copies to the clipboard, and downloads a Markdown file.
- The career board validates a LinkedIn URL, saves a target role, and copies a practice summary.

## Honest limits

- Local-only profiles: no password, OAuth, server session, password reset, or cross-device sync.
- No AI grading, transcription, voice recording, or recruiter marketplace.
- No Blender/GLB pipeline. The 3D scenes are procedural Three.js geometry; the wood textures and two photographic plates are the external assets.
- One Pexels mountain photograph and one workspace plate (provenance unrecorded) are used; the remaining photographic “plates” are original CSS/SVG art direction.
- `hello@pmforge.example` is a placeholder support address. No inbox is monitored.

See [`BLOCKERS.md`](BLOCKERS.md) for the full list.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing narrative and seven interactive/editorial scenes plus the drafting-sheet footer |
| `/learn` | Ten-module curriculum |
| `/learn/[slug]` | Ten statically generated lessons |
| `/projects` | Two-scenario project workbench |
| `/practice` | Interview lab and question bank |
| `/career` | Local career evidence board |
| `/tools` | Evidence-strength check and tool index |
| `/resources` | Question bank, rubric, reading paths, templates |
| `/signup`, `/login` | Local profile creation and reopening |
| `/dashboard` | Workspace snapshot and next action |
| `/about`, `/credits`, `/help` | Context, attribution, operating manual |
| `/privacy`, `/terms` | Local-data and use terms |

## Documentation

- [`docs/ASSET_MANIFEST.md`](docs/ASSET_MANIFEST.md) — every runtime asset, source, licence, and use.
- [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md) — what is built and how it was verified.
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) — the QA record, including failures found and fixed.
- [`DECISIONS.md`](DECISIONS.md) — architecture and product trade-offs.
- [`BLOCKERS.md`](BLOCKERS.md) — missing inputs and deliberate limitations.
- [`public/credits.txt`](public/credits.txt) — plain-text attribution shipped with the app.

## Stack

Next.js 16.4.3 · React 19.3.1 · TypeScript 5.9.3 · React Three Fiber 9.8.2 · drei 10.7.9 · three 0.186.1 · GSAP 3.15 · Lenis 1.3.27 · Zod 4.6.7 · lucide-react 1.61 · CSS Modules and custom properties. No Tailwind.

## Notes for maintainers

- The scroll authority is `src/components/providers/SmoothScroll.tsx`; same-page anchors are intercepted there.
- `src/lib/scrollTo.ts` exposes the Lenis instance to non-React code.
- Every dialog uses `src/components/ui/Dialog.tsx` for focus trapping and restoration.
- The mobile menu has its own focus trap and body scroll lock in `Navigation.tsx`.
- Progress events use the browser event `pmforge:progress`; analytics events use `pmforge:analytics` and stay in the page.
- This directory is not a Git repository and has no CI. Verification is local, documented in the QA checklist.
