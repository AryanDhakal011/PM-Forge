# Implementation Status

Last verified: **2026-10-26**
Build: **passing** · TypeScript: **passing** · Routes generated: **29** · Statically generated lessons: **10**
Local production preview: **`http://localhost:3001`** (`next start`)

This document describes what is actually implemented in this directory. It does not claim hosted infrastructure, AI features, or assets that are not present.

## Stack in use

| Layer | Version / choice |
| --- | --- |
| Framework | Next.js 16.4.3, App Router, TypeScript 5.9.3 |
| UI runtime | React 19.3.1, React DOM 19.3.1 |
| 3D | three 0.186.1, @react-three/fiber 9.8.2, @react-three/drei 10.7.9 |
| Motion | GSAP 3.15 + ScrollTrigger, Lenis 1.3.27 |
| Validation | Zod 4.6.7 |
| Icons | lucide-react 1.61.0 |
| Styling | CSS Modules, global custom-property tokens (`src/styles/tokens.css`, `src/app/globals.css`) |
| Tailwind | Not used |

## Route status

| Route | Rendering | Status | Notes |
| --- | --- | --- | --- |
| `/` | Static | Implemented | Full landing narrative: seven main sections, five narrative beats, and the drafting-sheet footer |
| `/learn` | Static | Implemented | Ten-module list, real progress, next module |
| `/learn/[slug]` | SSG (10 paths) | Implemented | Principle, failure mode, three drills, artifact, previous/next |
| `/projects` | Static | Implemented | Two scenarios, four phases, sprint checks, pressure decision, written record, copy |
| `/practice` | Static | Implemented | Interview lab, question bank, rubric explanation |
| `/career` | Static | Implemented | Role select, LinkedIn validation, evidence summary, copy |
| `/tools` | Static | Implemented | Evidence check plus tool index |
| `/resources` | Static | Implemented | Questions, rubric, reading paths, templates |
| `/signup` | Dynamic (search params) | Implemented | Local profile, consent, demo profile, intent copy |
| `/login` | Static | Implemented | Email match against local profile, demo profile |
| `/dashboard` | Static | Implemented | Profile summary, practice snapshot, next action, reset controls |
| `/about` | Static | Implemented | Positioning and operating principles |
| `/credits` | Static | Implemented | Full attribution and limits |
| `/help` | Static | Implemented | Getting started, keyboard, microphone, local data, troubleshooting |
| `/privacy` | Static | Implemented | Keys table (horizontally scrollable on mobile), microphone, controls |
| `/terms` | Static | Implemented | Local-preview terms and disclaimers |
| `/_not-found` | Static | Implemented | Route back to modules, tools, and help |
| `error` | Client boundary | Implemented | Recovery copy and reset link |

The build output reports **29 generated routes** including `/_not-found`, `/icon.svg`, the `/learn/[slug]` base route, and ten concrete lesson paths.

## Landing sections

1. **Hero / CHAOS** — live Decision Engine scene (procedural Three.js), scroll-linked camera and paper motion, WebGL poster fallback, “Example decision” pill, annotated stage, desk edge, and three real feature links (`#learning`, `#interview`, `#career`). Copy sits on a cream calm zone.
2. **Narrative beats** — five scroll-scrubbed strips between the main sections, with branch labels spanning the beat edges. Height `clamp(120px, 15vh, 168px)`; the full sentence is the accessible label.
3. **Signal test / SIGNAL** — ten conflicting evidence cards, pinned scene, pointer select and full keyboard operation, Isolate/Skip two-step flow, verdict/justification, persistence, reset.
4. **Learning path** — single-column ten-module curriculum list with the legend below it, plus a procedural paper cluster; both read real `pmforge.learning.v1` progress; module dialog links to lessons.
5. **Project workbench / DECISION** — dusk desk, scenario switch, phase tabs, artifact inspection, sprint checks, pressure choice with meters and review point, and a 1040 px written decision record with a real DOM stamp and copy/reset actions.
6. **Interview lab** — voice and text modes, microphone permission on explicit action, live level meter and compact waveform, two-minute countdown, text fallback, deterministic seven-criterion rubric, copy result.
7. **Career board / IMPACT** — 5/7 layout, sticky profile card, target role, LinkedIn validation, evidence checklist, profile summary, copy, and a six-tile example artifact shelf with accordion details.
8. **Decision blueprint** — warm-graded mountain plate, cream copy wash, procedural model house and hand-note, eight validated fields, prefilled where prior work exists, saved draft, copy, Markdown download, clear.
9. **Footer / drafting sheet** — light `--paper-deep` sheet with a slanted top edge, CHAOS → SIGNAL → DECISION → IMPACT progress strip, preferences fieldset, title block, back-to-top, local-data note, legal and credits links.

The old chapter rail was removed. Section state now comes from scene/section observers, so there is no duplicate navigation and no scrollspy underline on the landing page.

## Feature verification

| Feature | Evidence |
| --- | --- |
| Hero renders | 1440, 800, 390, and 320 screenshots; one `<h1>` and one sticky layer in the DOM; status pill and three feature links present |
| Poster fallback | `useWebGLSupport` and reduced-motion paths; static fallback DOM when WebGL is false |
| Reduced-motion hero | 1080 px at 1440 (was `300vh`); 1100 px at 390; 1149 px at 320 |
| Signal test | Two-step isolate/skip state machine; card inspect/select, verdict, help copy, metric meters, decision-card swap |
| Keyboard signal flow | Arrow keys move between cards; Enter/Space selects; results announced in an `aria-live` region |
| Learning progress | Real `pmforge.learning.v1` state drives list and cluster; module dialog opens with focus trap and restores focus |
| Project workbench | Scenario 02, phase change, checklist checks, pressure decision; record expands from the 148 px empty state to 591 px; copy feedback |
| Decision record width | 1041 px at the 1440 viewport (1040 px cap plus the green spine) |
| Interview text mode | Deterministic rubric scores the written answer; missing criterion and improvement rendered; result copied |
| Interview dictation | Web Speech API with interim transcript, consent, language picker; only submitted text is stored locally |
| Career board | Role selection, invalid/valid LinkedIn, summary copy, six example tiles, accordion details |
| Blueprint | Validation, prefill, save, reload, copy, download, clear; cream wash keeps copy off the photograph |
| Footer preferences | Reduced motion, sound, and haptics apply immediately and persist |
| Search | “checkout” returns exactly one result, “Project · Marketplace Checkout Recovery”; input focused on open; mobile close returns focus to “Open menu” |
| Copy feedback | Every copy action uses a fallback utility and reports success or “Copy failed” in a live region |
| Responsive layout | 390 px: `scrollWidth === 375`; 320 px: `scrollWidth === 305`; no page-level horizontal overflow |
| Type size | Automated CSS/TSX scan found **no `font-size` below 12 px / 0.75 rem** |
| CLS | **0.0215** at 1440 and **0.0051** at 390 on a fresh normal-motion load (target < 0.05) |
| Wood/pixel check | Darkest sampled pixel `(11, 6, 3)`; no pure black block; ~1% of the wood crop below 25/255 |
| Accessibility audit | `axe-core` 4.10.3 recorded **0 violations** at 390 and 1280 px in the earlier pass. Not re-run in the final layout-only pass; required again before launch |

## Data and persistence

All data is browser-local. There is no API route, database, server action, or auth provider in this build.

| Key | Contents |
| --- | --- |
| `pmforge.user` | Name, email, goal, creation and last-seen timestamps |
| `pmforge.signal.v1` | Selected evidence card, verdict, strength, impact, time |
| `pmforge.learning.v1` | Completed module slugs and checked drill indexes |
| `pmforge.projects.v1` | Scenario, phase, sprint checks, pressure decision |
| `pmforge.interview.v1` | Overall score, band, missing criterion, word count, time (not answer text) |
| `pmforge.career.v1` | Target role and optional LinkedIn URL |
| `pmforge.blueprint.v1` | The eight submitted blueprint fields |
| `pmforge.motion`, `pmforge.sound`, `pmforge.haptics`, `pmforge.reducedMotion` | Preference flags |

Events are dispatched in-page as `pmforge:analytics`; development logs them to the console. They are not sent to a vendor.

## Accessibility implemented

- Semantic `header`, `nav`, `main`, `section`, `footer`, headings in order, and labelled landmarks.
- First-focusable “Skip to content” link; `main` receives focus.
- Native buttons, links, inputs, selects, textareas, `details/summary`, fieldsets, and legends.
- Dialog focus trap, Escape close, focus restoration, and first-field focus.
- Mobile menu focus trap, Escape close, scroll lock, and focus restoration.
- Search dialog focus restore to the persistent menu button on small screens.
- Visible `:focus-visible` outlines; no hover-only information.
- `aria-live` result/status regions for signal, interview, copy, blueprint, and form state.
- Reduced-motion switch and OS preference; Lenis, GSAP choreography, and 3D motion are disabled, and static states are shown.
- Reduced-motion CSS also removes animation and transition delays, so nothing waits behind a hidden stagger.
- WebGL fallback for unsupported or unavailable contexts.
- Touch targets at least 44 px for buttons, rows, tabs, toggles, form controls, and navigation, with the WCAG inline-link exception for links inside running prose.
- Tables have a labelled, keyboard-focusable horizontal scroll region on narrow screens.
- Colour pairs use the token palette; `--muted` is `#5f5a51` (5.19:1 on `--warm`, 6.45:1 on `--paper`) and `--brass-ink` is `#7f5c2b`.
- Small phase numbers, the record button, sticky note, footer local-data note, and dark-surface helper text were raised to AA in the earlier audit.
- Intentional sub-44px targets are limited to inline prose links (WCAG inline exception) and 17–18 px checkbox inputs inside full-size labels.

## Final verification (2026-10-26)

- `npm run typecheck` passes with no diagnostics.
- `npm run build` passes and generates **29 routes** (10 SSG lessons).
- Production preview served at `http://localhost:3001` and loaded with HTTP 200.
- Desktop reviewed at **1440 × 1080** through a temporary same-origin iframe (the Review pane is 800 px wide), plus direct 800 px normal-motion checks.
- Mobile reviewed at **390 × 844** (375 px content) and **320 × 844** (305 px content); no page-level horizontal overflow on either.
- All landing sections and the footer were screenshotted in reduced motion at 1440; the projects record, career board, blueprint sheet, and footer were also checked in their expanded/mobile states.
- CLS measured after fresh loads: **0.0215** at 1440 and **0.0051** at 390.
- Temporary QA harnesses were removed from `public/` before delivery. Full record: [`QA_CHECKLIST.md`](QA_CHECKLIST.md).

## QA and build commands

```text
npm run typecheck   → pass
npm run build       → pass, 29 routes, 10 SSG lessons
npm run start       → production preview (set PORT=3001)
```

The full manual record is in [`QA_CHECKLIST.md`](QA_CHECKLIST.md). Known gaps and unavailable inputs are in [`BLOCKERS.md`](../BLOCKERS.md).
