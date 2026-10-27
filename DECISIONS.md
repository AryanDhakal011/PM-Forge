# Decisions

Architecture and product trade-offs for the PMForge build in this directory. Each entry records what was chosen, why, and what it costs.

Status: local production candidate, 2026-10-25. This directory is not a Git repository, so these are not commit-linked ADRs.

## D1. Static-first Next.js App Router

**Decision:** Use Next.js 16.4.3 with the App Router and render every content route statically. `/signup` reads search params; `/learn/[slug]` is statically generated for ten lessons. There are no API routes, server actions, or middleware.

**Why:** The product is a practice surface, not a multi-tenant service. Static rendering gives fast first paint, predictable deploys, and no infrastructure to fake. Search params are used only for intent copy and redirect targets.

**Cost:** No server-side personalisation, no cross-device state, no protected routes. A signed-in user is a `localStorage` record, not an authenticated principal.

## D2. Local-first data instead of a backend

**Decision:** Profiles, progress, and preferences live in versioned `localStorage` keys (`pmforge.*`). Signup and login validate against the local profile. The dashboard can reset it.

**Why:** It keeps the demo honest. A real auth provider, database, password reset, and privacy programme were out of scope; a mocked server would have implied guarantees the build cannot meet. Local data also lets every interactive section work without a network.

**Cost:** Clearing site data loses everything. There is no password, OAuth, recovery, session expiry, or sync. “Login” means “reopen the profile on this browser,” and the UI and help copy say so.

## D3. Procedural Three.js instead of a GLB pipeline

**Decision:** Build the hero Decision Engine and learning paper cluster from React Three Fiber primitives, custom geometry, and canvas textures. There is no Blender source or `.glb` file.

**Why:** No Blender toolchain or licensed model was available. Procedural geometry keeps the bundle self-contained, avoids opaque asset licences, and lets motion and colour respond to state. It also made the poster fallback straightforward.

**Cost:** Less sculptural detail than a purpose-built model, and scene changes require code rather than an asset swap. Documented in [`BLOCKERS.md`](BLOCKERS.md).

## D4. WebGL is an enhancement, never a requirement

**Decision:** Detect WebGL support and render a static poster when it is unavailable. Reduced motion disables camera/paper choreography and Lenis smoothing. No content or action exists only inside the canvas.

**Why:** Canvas-only landing pages fail on low-power devices, in remote desktops, and for motion-sensitive users. The narrative and every CTA must survive without the scene.

**Cost:** Two visual paths to maintain, and screenshots differ between them.

## D5. CSS Modules and tokens, no Tailwind

**Decision:** Style with CSS Modules plus global custom properties in `src/styles/tokens.css` and `src/app/globals.css`. No utility framework.

**Why:** The design depends on layered paper, texture, and editorial typography rather than a utility scale. Named component classes keep long, stateful surfaces readable, and tokens made the contrast corrections a single-place change.

**Cost:** More CSS files and no utility-first speed. Design changes can touch several modules.

## D6. Lenis owns scrolling; one place intercepts anchors

**Decision:** `SmoothScroll` is the single scroll authority. Same-page anchors are intercepted there, `/#top` maps to the hero, and `src/lib/scrollTo.ts` exposes the instance to non-React code. Reduced motion bypasses smooth scrolling.

**Why:** Mixing native anchor jumps, GSAP ScrollTrigger, and Lenis produced double-scroll and broken deep links. Centralising the handler fixed `/dashboard` → `/#blueprint`, the skip link, and mobile navigation at once.

**Cost:** Any future anchor must go through the same path; ad-hoc `scrollIntoView` calls can fight it.

## D7. Deterministic interview rubric, not AI grading

**Decision:** The interview lab scores seven explicit criteria from the written answer with a deterministic function. Audio is used only for a live input level and waveform; the answer text is required for scoring.

**Why:** There is no model call, transcription service, or labelled dataset. A transparent rubric can be explained, tested, and reproduced. Claiming “AI feedback” would have been indefensible.

**Cost:** The score rewards presence of evidence, not semantic quality. It can be gamed by keyword stuffing, which the help copy acknowledges. The hero lede was changed from “AI-powered feedback” to “Structured feedback” for the same reason.

## D8. Microphone permission only on an explicit action

**Decision:** Do not request `getUserMedia` on load. A labelled start control requests it, draws levels, and offers mute, stop, and a text fallback. Denied or missing devices switch to text mode and move focus to the answer field.

**Why:** Surprise permission prompts are hostile and often permanently denied. The lab must remain usable with no microphone at all. Audio is never recorded, stored, transcribed, or uploaded.

**Cost:** Live audio is ornamental until a transcription pipeline exists. Hardware and non-Chromium prompt behaviour remain untested; see QA limits.

## D9. Native controls and a shared dialog primitive

**Decision:** Prefer native `button`, `a`, `input`, `select`, `textarea`, `details/summary`, `fieldset`, and `legend`. All modal surfaces use `src/components/ui/Dialog.tsx` for focus trap, Escape, scroll lock, and focus restoration. The mobile menu has its own trap because it is not a dialog.

**Why:** Native semantics survive keyboard, screen readers, and browser quirks better than ARIA reconstructions. A single dialog primitive prevented divergent behaviour and made the “focus first field, not close” fix apply everywhere.

**Cost:** Some visual treatments need extra wrappers, and the menu trap duplicates a little logic.

## D10. Accessibility is a build constraint, not a polish pass

**Decision:** Treat 44px targets, visible focus, AA contrast, reduced motion, live regions, and no hover-only information as acceptance criteria. Run `axe-core` at 390px and 1280px and fix violations rather than suppressing them.

**Why:** The product asks users to make consequential decisions under pressure; an inaccessible practice ground contradicts the premise. Automated checks also caught real structural mistakes such as nested `<aside>` landmarks.

**Cost:** Some compact editorial layouts had to grow. Inline prose links remain below 44px under the WCAG inline exception, and checkbox inputs are 17–18px inside full-size labels.

## D11. Honest surfaces over simulated infrastructure

**Decision:** Do not ship fake social accounts, a fake monitored support inbox, fake testimonials, fake customer logos, or a fake AI badge. Remove the footer social icons; state that no channels are connected. Keep `hello@pmforge.example` only as a clearly labelled placeholder. Record asset and capability limits in `BLOCKERS.md`.

**Why:** Invented proof is the fastest way to lose trust, and it creates maintenance debt the moment someone clicks. The landing page’s argument is judgment under uncertainty; the build should demonstrate the same discipline.

**Cost:** The footer and about page are quieter than a typical SaaS marketing page. Some conversion affordances are deliberately absent.

## D12. One narrative page plus real task routes

**Decision:** Keep the CHAOS → SIGNAL → DECISION → IMPACT narrative on `/` with deep-linkable sections, and give each durable task its own route (`/learn`, `/projects`, `/practice`, `/career`, `/tools`). The landing sections are working previews, not screenshots.

**Why:** The narrative needs scroll continuity, while practice needs a stable URL, a title, and a place to return to. Duplicating the full workbench on both surfaces would double the state bugs.

**Cost:** Two levels of interaction to maintain, and some concepts appear in both a compact and full form. The compact versions persist to the same keys so the full pages agree.

## D13. Versioned storage keys and in-page events

**Decision:** Namespace state under `pmforge.*` and version the domain keys (`signal.v1`, `projects.v1`, and so on). Dispatch `pmforge:progress` for state changes and `pmforge:analytics` for behaviour; log analytics to the console in development only.

**Why:** Versioning makes a shape change visible instead of silently corrupting old drafts. In-page events let sections stay decoupled without a state library. Keeping analytics in-page avoids a vendor claim and a consent surface the build cannot support.

**Cost:** No funnel data leaves the browser, and migrations are manual. A future schema change needs a version bump and a cleanup path.

## D14. Local fonts and a small external asset set

**Decision:** Self-host DM Serif Display, Inter, and Caveat through `@fontsource`. Use one Pexels mountain photograph and two CC0 Poly Haven wood textures; build the remaining plates with CSS/SVG. Record everything in [`docs/ASSET_MANIFEST.md`](docs/ASSET_MANIFEST.md).

**Why:** Local fonts avoid a render-blocking third party and a privacy leak. A small, documented asset set is easier to license and audit than a stock-photo collage.

**Cost:** Font files add weight, and the CSS/SVG plates are less photographic than a fully art-directed shoot. The Pexels item ID was not preserved; only the creator and licence are recorded.

## D15. Zod at the boundary, plain state inside

**Decision:** Use Zod 4 for signup/login and the eight-field blueprint; use focused custom validation for the LinkedIn URL and derived rubric checks. Persist only validated shapes.

**Why:** Boundary validation catches malformed or stale drafts early, and Zod’s inferred types keep forms and storage aligned. A full form library would have been more machinery than these surfaces need.

**Cost:** Some validation logic lives outside Zod (LinkedIn, rubric, project completeness), so it must be tested separately.

## D16. Manual QA with documented evidence

**Decision:** Verify with build/type checks, route walks, in-page overflow scans, axe, and scripted interaction. Record failures and fixes in [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md). Do not add a test framework solely to claim coverage.

**Why:** The highest-risk failures here were visual, focus-related, and cross-section state bugs that a shallow unit suite would miss. The documented manual pass found and fixed real issues, including the privacy overflow and nested landmarks.

**Cost:** No regression suite. A future change can silently break a flow unless the checklist is repeated. Adding Playwright and axe CI is the obvious next investment.

## D17. Single-origin metadata with an env fallback

**Decision:** Set `metadataBase` from `NEXT_PUBLIC_SITE_URL`, falling back to the local preview origin (currently `http://localhost:3001`). Ship a generated 1200×630 Open Graph image and an SVG favicon.

**Why:** Canonical and social URLs must not guess a production domain. The fallback keeps local development correct and makes the missing deployment input explicit.

**Cost:** A deployment that forgets the variable ships localhost metadata. Deployment documentation must call this out.

## D18. No Git repository or CI in this workspace

**Decision:** Deliver the working directory as-is and document verification locally rather than initialising a repository or pipeline.

**Why:** The workspace was not a Git repository and no remote or CI target was provided. Creating one would have implied a hosting and review workflow that does not exist.

**Cost:** No history, blame, rollback, or automated checks. `DECISIONS.md`, `BLOCKERS.md`, and the QA record are the substitute audit trail.
