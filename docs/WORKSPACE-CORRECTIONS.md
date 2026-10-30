# Workspace corrections and landing performance

Date: 30 October 2026. The workspace handoff is treated as a product brief. This update retains the existing Next.js repository, authentication and persistence model.

## What changed

- Landing: one resize authority for Lenis, resize refreshes deferred until a gesture settles, and protection against refresh/ResizeObserver feedback. Navigation progress updates directly instead of rendering the navigation tree on every scroll. Narrative strips use cached ScrollTrigger geometry, cache their letter references and stop writing unchanged values. The pencil trail sleeps when idle.
- Scroll inputs use registered, non-inheriting CSS properties. Each consuming object receives the same numeric progress directly, including explicit inheritance on the two pseudo-elements that need it. The original movement, selection gating, textures, scene geometry and DPR policy remain intact. Moving Signal cards receive compositor hints only while visible. Upcoming scenes prepare two viewports ahead without adding continuous offscreen rendering.
- WebGL support is checked once and the temporary test context is immediately released. The five-minute lifecycle check found that the previous check retained one additional context on every visit, even though actual instrument geometry was disposed correctly.
- Footer Preferences uses a normal fieldset with a separate flex wrapper. Every control and its help text stays inside the fieldset, with a positive gap before the following container at desktop, tablet and narrow phone widths.
- Sidebar: Today, Practice, Projects, Progress and Portfolio, with Settings and Help below. Its saved collapse preference, named icon rail, active indicator, waiting indicators and mobile destinations share the same navigation. The device menu provides storage information, backup export and account entry. Repeated guest notices and utility-page Back to Home links are removed.
- Saved lives inside Practice. History lives inside Progress. Old routes return server-level HTTP 308 redirects, preserving query parameters. A page redirect alone was insufficient because streamed rendering could return HTTP 200 with a client redirect.
- Today: a readable 7/5 hero, release chart, persistent resume strip, short warm-up, paper decision shelf, seven room identities and a surprise brief. The procedural coverage instrument contains seven rings and 63 instanced beads tied to actual scenario IDs. The chrome material uses one generated environment, and the scene renders on demand. Mobile, keyboard and reduced-motion users retain all 63 named links in the SVG composition and the shared coverage table. The next-edge caption derives from recorded reasoning dimensions; first light is remembered per workspace.
- Practice: compact heading, category multiselect, custom keyboard listboxes, level/length filters, status segments, removable filters, result announcements and a sort order that begins with an Easy scenario from each room. Cards, list and map share the same filtered data. Small filter changes use GSAP Flip. Cards use content visibility and memoization. Saved has separate scenario/project views, conditional filters and Undo feedback.
- Projects: walnut gallery, linked 12-waypoint route, proper category names, real progress, honest recommendations, chapter pips, explicitly estimated remaining time, and twelve distinct finite SVG poster animations. Existing opened-project palettes, chapter locks, mechanics disclosure and contrast remain intact.
- Progress: the shared coverage table and project constellation, a first-win stepper that stays dismissed after reflection, example bars for missing evidence, provisional bands and plain rubric limits. Activation diagnostics are available only in Settings with `?debug=1` or the local debug flag. History has neutral controls, date groups, category nodes and explicit resume/debrief/retry actions; project trails show three chapter nodes and recorded decisions.
- The first completed guest debrief's Keep this run prompt has a persistent dismissal. Portfolio, Saved, filters and History have different empty illustrations.
- Project controls no longer become interactive while the opening scene is still loading. A preparing state holds their place until the decision phase begins. The regression check exposed this real timing issue while testing the larger UI.

## Verification

The automated browser scripts use isolated temporary profiles, never the user's browser data. PNG captures are local QA artifacts and are ignored by Git.

- Production build and TypeScript pass.
- 47 engine, calibration and signed-account tests pass.
- `docs/verify-workspace.mjs`: navigation, seven-by-three coverage table, 63 bead links, custom filters, saved persistence, redirects, 12 mission illustrations, palette switching, responsive layout, command focus, reduced motion and footer containment.
- `docs/verify-product.mjs`: a complete real guided run through pause, synthesis, spoken timer, band feedback, reflection, expert trace, record export, progress and account rejection checks.
- `docs/verify-project-cards.ts`: all 12 opened projects at 1440, 390 and 320px, including title layout, contrast, locked chapters and exact resume state.
- `docs/verify-project-ux.ts`: evidence readiness, intentional IndexedDB write failure, retry, keyboard recovery, chapter review and all 12 decision surfaces at three widths.
- `docs/verify-scroll-story.mjs`: desktop, tablet, mobile and reduced-motion profiles, including selection after resize, exact numeric progress on every painted object, offscreen rendering, actual decisions and final counter values. Results: `docs/scroll-story-verification/optimized.json`.
- HTTP route checks include explicit 308 status and Location assertions for both legacy workspace routes.
- Five-minute app navigation: 21 resource snapshots; one active instrument context on Today, stable 8 textures / 87 buffers / 7 programs, and zero remaining contexts, textures, buffers or programs after leaving it. See `docs/workspace-verification/memory-stability.json`. These are allocation counts, not a direct measurement of driver VRAM bytes.

## Performance limits and decisions

The source retains all existing landing scenes and interactions. An asynchronous shader-precompile experiment increased cold startup cost under software rendering and was removed. Baking the career paper texture added substantial image bytes without removing its cold paint spike, so that experiment was also removed; the original SVG remains.

The wheel profile in `docs/workspace-verification/performance.json` uses headless Chromium with SwiftShader. Median frame intervals were about 16.7ms. Signal occasionally reached a 33.5ms p95 interval, and a cold Career paint still produced a roughly 157ms task in this software-rendered environment. The strict no-long-task and 12ms physical desktop budgets are therefore **not certified**. This is an optimization pass, not a claim that every device has a flawless frame trace. Mid-mobile LCP, full screen-reader operation and driver memory still need physical-device checks. Browser resource transfer totals include cache/service-worker effects and are not a certified 150KB route/250KB WebGL gzip result.

The app has a single WebGL instrument; room scenes, project posters and the route map use SVG. A fixed shared drei View canvas for these SVG elements, extra ambient loops and reversible full-page card expansion were not added. The existing authored project entrances remain, and filtering uses Flip. This keeps the workspace quiet while preserving the product's visual identity.

Missing production OAuth credentials and independent expert review remain launch prerequisites, as described in the earlier product reports. No deployment, expert ratings, account credentials or public portfolio publication is fabricated.

## Research used

[Chrome's CSS property benchmark](https://web.dev/blog/at-property-performance?hl=en) explains why disabling inheritance can limit style invalidation to the consuming element. This update explicitly binds those consumers and tests their values, including pseudo-elements, instead of changing the choreography.

[Three.js renderer documentation](https://threejs.org/docs/pages/WebGLRenderer) documents its WebGL2 requirement and context lifecycle methods. The capability probe now matches that requirement and releases its temporary context. [Three.js disposal guidance](https://threejs.org/manual/pages/how-to-dispose-of-objects.html) informed the resource lifecycle checks.
