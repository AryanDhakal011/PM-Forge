# QA Checklist

Last verified: **2026-10-26**
Scope: local production candidate in `C:\Users\aryan\Desktop\Beta PM Leetcode`
Verdict: **pass for the local production build, with the limits listed at the end**

This is the record of what was actually exercised in a browser. It is not a claim that every browser, input device, or assistive technology has been covered. Where a path was simulated, the simulation is named.

## 1. Environment and method

| Item | Value |
| --- | --- |
| OS | Windows (win32) |
| Node / npm | Node 24.4.0 / npm 11.4.2 |
| Framework | Next.js 16.4.3, App Router, production build served by `next start` at `http://localhost:3001` |
| Browser | Chromium-based browser driven through the OpenCode browser tool |
| Desktop viewport | **1440 × 1080 CSS px** (reviewed through a temporary same-origin `1440` iframe at `zoom: 0.55`, because the Review pane is 800 CSS px wide) |
| Direct desktop spot checks | 800 × 1080 CSS px in a normal browser tab (normal motion) |
| Mobile frame | 390 × 844 (content width 375 px) |
| Narrow frame | 320 × 844 (content width 305 px) |
| Data state | Browser `localStorage`; keys listed in [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md) |

Method:

1. Load a fresh production build and wait for the loader (`pmforge:loader-done`).
2. Walk the landing sections in order at 1440, 390, and 320, taking screenshots and reading bounding boxes.
3. Toggle `localStorage.pmforge.reducedMotion` to `reduce` for deterministic desktop screenshots; use normal motion for CLS and for the 800 px header/hero spot checks.
4. Exercise search, mobile search focus return, dialogs, and the landing interactions touched by the final pass.
5. Scan CSS and TSX for sub-12 px type and for page-level horizontal overflow.
6. Measure layout shift with `PerformanceObserver({ type: "layout-shift", buffered: true })` after a fresh load.
7. Repeat after each fix. Record the failure, not only the final pass.

**Harness note:** at 1440 the scaled iframe produced duplicated sticky/parallax layers in some screenshots. DOM geometry confirmed one hero, one header, and one decision-record element; the duplication is a compositing artifact of the scaled iframe. Layout evidence therefore uses reduced-motion screenshots plus bounding boxes, and the direct 800 px tab for normal-motion checks.

The temporary QA pages (`public/__qa.html`, `public/qa-frame.html`, `public/qa-mobile.html`) were removed before delivery. They were tooling only and never part of the product.

## 2. Static checks

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | Pass, no diagnostics |
| Production build | `npm run build` | Pass, **29 routes**, 10 statically generated lessons |
| Type-size scan | CSS + TSX scan for `font-size` below 12 px / 0.75 rem | **No sub-12 px declarations** |
| Console | Browser console during the landing walk | No uncaught errors or hydration warnings observed |

## 3. Route coverage

The full route walk was completed in the previous pass. The final pass re-ran the build (29 routes) and re-walked the landing page and the routes reached from it. Every route listed below was loaded directly at least once, not only through client navigation.

| Route | Rendering | Primary check |
| --- | --- | --- |
| `/` | Static | Hero, eight landing sections, beats, footer, anchors |
| `/learn` | Static | Ten modules, empty and populated progress, next module |
| `/learn/[slug]` | SSG (10 paths) | Lesson content, drills, previous/next, unknown slug |
| `/practice` | Static | Interview lab, question bank, rubric |
| `/projects` | Static | Scenario, phase, checks, pressure decision, record |
| `/career` | Static | Role, LinkedIn validation, summary |
| `/tools` | Static | Evidence check and tool index |
| `/resources` | Static | Question bank, rubric, reading paths, templates |
| `/signup` | Dynamic (search params) | Validation, consent, local profile creation |
| `/login` | Static | Invalid, mismatched, valid, demo |
| `/dashboard` | Static | Signed-in summary, signed-out state, reset |
| `/about` | Static | Content and links |
| `/credits` | Static | Attribution, `credits.txt` link |
| `/help` | Static | Sections, anchors, microphone guidance |
| `/privacy` | Static | Storage table, scroll region, controls |
| `/terms` | Static | Local-preview terms |
| `/_not-found` | Static | Recovery links |
| `error` boundary | Client | Recovery copy and reset action |

## 4. Landing cohesion (v1 handoff)

### P1 — Hero

| Test | Result |
| --- | --- |
| Continuous warm room | Pass. Cream hero with a graded paper/stage scene; no bare black and no hard colour cut into the signal section |
| Example decision pill | Pass. Text reads “Example decision” with “Evidence strength High · Impact High”; it fades in when the hero scroll reaches the justified state |
| Feature links | Pass. Three real anchors to `#learning`, `#interview`, `#career`; the old fake proof points are gone |
| Desk / ledge seam | Pass. `.deskEdge` closes the hero before the signal section |
| Text off the scene | Pass. The copy column uses a radial cream calm zone; the status pill sits on its own paper chip |
| Hanging cards not cropped | Pass at 1440, 390, and 320. The mobile hero is `auto` height (1100 px at 390, 1149 px at 320) and shows the full card column |
| Reduced motion | Pass. The hero collapses from `300vh` to `100svh` on desktop (measured 1080 px at 1440) and to `auto` below 1024 px, so the pin leaves no empty scroll |

### P2 — Signal test / learning

| Test | Result |
| --- | --- |
| Two-step state machine | Pass. Isolate first, then Skip; helped/no-credit copy appears when the interaction is skipped |
| Readable cluster | Pass at 1440 (signal section 1031 px tall) |
| Curriculum list | Pass. One column with a legend below the list; module preview dialog opens and closes |
| Dropdown alignment | Pass. Legend and list share the same left edge |

### P3 — Project workbench

| Test | Result |
| --- | --- |
| 1040 px record | Pass. `.recordBar` measured **1041 px** at the 1440 viewport (1040 px cap plus the 3 px green spine); 591 px tall when written |
| Aligned labels / values | Pass. Subgrid rows keep Context / Evidence / Decision / Consequence aligned |
| “WRITTEN” stamp | Pass. Header reads “Decision record · written”; the angled `v1.0` stamp is a DOM element, not an image |
| Ink-write sequence | Pass. The record intro, fields, and stamp animate in order; reduced motion shows the final state immediately |
| Copy feedback | Pass. Shared clipboard utility; visible “Copy failed” on rejection; live status |
| No pure black | Pass. The section is a graded dusk desk. Darkest sampled pixel in the wood/record crop is `(11, 6, 3)`; pixels below 25/255 are about **1%** of the crop, so there is no black block |
| Copy off the grain | Pass. The intro copy has its own dusk calm-zone wash above the wood plate |

### P4 — Career board

| Test | Result |
| --- | --- |
| 5/7 layout | Pass at 1440; the left column is sticky on tall desktops |
| Profile card left | Pass. Role, avatar, stats, evidence, LinkedIn, copy |
| Six artifact tiles | Pass. Six original SVG tiles with real example names, not stock images |
| Accordion details | Pass. `details/summary` keeps the shelf compact; keyboard operable |
| LinkedIn placeholder | Pass. `linkedin.com/in/your-name`; validation accepts only real LinkedIn profile URLs |
| Button hierarchy | Pass. One primary (copy profile), one secondary (Add a decision), one text action (view career tools) |
| Mobile shelf | Pass. Two-column tiles with a 176 px minimum height; titles clamp to two lines; no clipping at 390 or 320 |
| Benchmark labels | Pass. Column widened to 104 px; `Prioritization`, `Experimentation`, `Stakeholder`, `Roadmapping`, `Execution` are not truncated at 390 or 320 (scrollWidth = clientWidth = 104 px) |

### P5 — Decision blueprint

| Test | Result |
| --- | --- |
| Warm-graded mountain | Pass. The photo is graded toward the cream/dusk palette |
| Text on cream wash only | Pass. Copy uses a radial cream calm zone; no word sits on the photo |
| Two-line headline | Pass. “Build your / instincts.” |
| Opaque paper sheet | Pass. The final-decision sheet is paper, not glass |
| One EXAMPLE tag | Pass. A single tag in the sheet header |
| Model house and paper tag | Pass. Procedural model house, base, trees, and the rotated hand-note render at 1440; the hand-note also renders at 390 and 320 (162 × 78 px) |

### P6 — Footer

| Test | Result |
| --- | --- |
| Light `--paper-deep` sheet | Pass. `#ede3cf` with ink text |
| Slanted top edge | Pass. `::before` clip-path rises 30 px on the left |
| Progress strip | Pass. CHAOS → SIGNAL → DECISION → IMPACT, four linked nodes |
| Preferences fieldset | Pass. Reduced motion, sound, haptics; state applies immediately and persists |
| Title block | Pass. PROJECT / SHEET / REV / STATUS |
| “Credits” in the bottom bar only | Pass. It appears with Privacy and Terms in the bottom bar, never in the title block |
| Mobile progress strip | Pass. 2 × 2 grid at ≤767 px (measured 167.6 px columns at 390 and 132.4 px at 320); no cramped single row |

## 5. Reveal system and motion

| Test | Result |
| --- | --- |
| One observer | Pass. `src/components/ui/Reveal.tsx` owns a single shared `IntersectionObserver` |
| `html.js-ready` gate | Pass. Hidden states only apply after the client effect confirms `IntersectionObserver`; content is visible without JavaScript |
| Variants | Pass. `fade-up`, `paper-settle`, `ink-write`, `draw`, `node-snap` |
| Loader gate | Pass. Above-the-fold nodes wait for `pmforge:loader-done` |
| 2.5 s failsafe | Pass. Only reveals nodes currently intersecting the viewport |
| Once only | Pass. Nodes unobserve after their first reveal |
| Reduced motion | Pass. `300vh` hero pin removed, beats visible immediately, transitions/animations zeroed (including delays), Lenis disabled, poster/static 3D states used |
| Beats | Pass. `clamp(120px, 15vh, 168px)` and 162 px measured at 1440; centred, scroll-scrubbed, non-interactive; full sentence in the accessible label |
| Branch labels | Pass. PIVOT / STAY span the beat edges (1040 px wide at 1440) and are no longer clipped by the old 26% width |

## 6. Navigation and search

| Test | Result |
| --- | --- |
| Header | Pass. Fixed, 68 px, cream `rgba(243, 235, 221, 0.97)` with a blur declaration and an opaque fallback; content does not read through it |
| Scroll-progress line | Pass. 2 px brass line |
| Scrollspy on landing | Pass. Underline suppressed on `/`; section state still drives the mobile menu |
| Search results | Pass. Query “checkout” returns 1 result, “Project · Marketplace Checkout Recovery”; input receives focus on open |
| Search close | Pass. Escape closes; on desktop focus returns to the search trigger |
| Mobile search focus | Pass. On small screens the mobile trigger is inside the menu and unmounts with it, so the close handler returns focus to the persistent “Open menu” button. Verified: after Escape, `document.activeElement` is the menu button with `aria-expanded="false"` |

Keyboard delivery through the browser tool was intermittent in this session, so the mobile Escape close was also verified by dispatching the same `keydown` event the dialog listens for. The handler and focus target are what were tested; a physical keyboard pass is still recommended.

## 7. Responsive and overflow

| Scope | Result |
| --- | --- |
| 390 px landing | `scrollWidth === 375` (no page overflow); hero 1100 px |
| 320 px landing | `scrollWidth === 305` (no page overflow); hero 1149 px |
| Interview at 390 / 320 | Fits; textarea and context readable; compact wave in text mode |
| Decision record at 390 / 320 | Fits; fields stack; copy and reset remain reachable |
| Career board at 390 / 320 | Fits; tiles 2-up, labels 104 px, bars 159 px / 89 px tracks |
| Footer at 390 / 320 | Fits; 2 × 2 strip; title block wraps without clipping |
| `/privacy` | Table scrolls inside its labelled, focusable wrapper; page itself does not overflow |
| Auth pages | `/signup` and `/login` fit without horizontal scroll |

## 8. Cumulative layout shift

Measured on a fresh production load, normal motion, no user input.

| Viewport | CLS | Entries | Largest source |
| --- | ---: | ---: | --- |
| 1440 (iframe) | **0.0215** | 3 | Header nav links after font settle (~0.0107) |
| 390 (iframe) | **0.0051** | 2 | Header actions during settle (~0.0045) |

Both are below the **0.05** target. The remaining 1440 shift is the header link row re-measuring once when the display/body fonts finish; it is a single small shift and does not move the hero copy or the interactive sections.

## 9. Failures found and fixed in the final pass

| Failure | Fix | Re-test |
| --- | --- | --- |
| Reduced-motion hero kept 200vh of pinned scroll | `html[data-reduced-motion="true"] .hero` is `100svh`; `auto` below 1024 px | Hero 1080 at 1440, 1100 at 390, 1149 at 320 |
| Beat branch labels clipped by a 210 px box | `.branches` spans the beat width | PIVOT / STAY visible at both edges |
| Footer journey row cramped at 320 | 2 × 2 grid at ≤767 px, connectors hidden | 167.6 / 132.4 px columns |
| Career benchmark labels truncated | Mobile column 92 → 104 px | No truncation at 390 or 320 |
| Career tiles cropped two-line titles | `aspect-ratio: auto`, 176 px min height, 2-line clamp | Titles readable at 390 and 320 |
| Hand-note hidden on mobile | Shown at ≤1023 px with a mobile margin | 162 × 78 px at 390 and 320 |
| Projects heading collapsed to “Build.Ship.Learn.” | Real spaces in the JSX | Accessible text “Build. Ship. Learn.” |
| Project scenario buttons 40 px tall | 44 px minimum | Pass |
| Scenario switch stayed two-up at 320 | One column at ≤420 px | Pass |
| Header let 4% of the content through | Opacity 0.96 → 0.97 | Opaque against passing content |
| Reduced-motion delays still staggered reveals | `animation-delay` and `transition-delay` forced to 0 ms | Static states render immediately |
| Mobile search close dropped focus to `<body>` | `closeSearch` returns focus to the menu button | “Open menu” focused |

## 10. Known limits

These are scope limits, not hidden failures.

- No physical microphone test. Permission, mute, stop, denied, and absent-device paths were simulated earlier. Real hardware, Safari/Firefox prompts, iOS, and device switching remain unverified.
- No screen-reader session with NVDA, JAWS, VoiceOver, or TalkBack. Semantics are recorded; real AT output is not.
- No Safari, Firefox, or mobile Safari run. All browser evidence is Chromium.
- `axe-core` was **not re-run** in this final pass (the bundle is not installed locally). The previous pass recorded 0 violations at 390 and 1280 px; the final changes were layout-only, but a fresh axe run is required before a public launch.
- No automated visual regression or unit test suite. Verification is manual plus build/type checks.
- The 3D scenes are procedural Three.js, not Blender/GLB assets. See [`BLOCKERS.md`](../BLOCKERS.md).
- The page still uses separate WebGL canvases for the hero, signal instrument, and learning cluster, plus the 2D wave canvas in the interview lab.
- Photography is one Pexels mountain plate plus CC0 wood textures; the remaining plates are CSS/SVG art direction.
- CLS was measured in the local production build, not on a throttled mobile network. A field measurement is still required.

## 11. Re-run before a release

```bash
npm install
npm run typecheck
npm run build
npm run start   # PORT=3001 on Windows: $env:PORT=3001; npm run start
```

Then repeat at minimum:

1. Load every route at 390 px and desktop; confirm no console errors.
2. Run the 390 px and 320 px overflow scan.
3. Run axe at 390 px and 1440 px.
4. Exercise signal, project, interview text path, career, and blueprint end to end.
5. Re-test search focus return with a physical keyboard.
6. Re-measure CLS on a throttled profile.
7. Re-test the microphone on real hardware and at least one non-Chromium browser before claiming device support.

Sign-off: **2026-10-26**, local production candidate. Not a claim of hosted production readiness.
