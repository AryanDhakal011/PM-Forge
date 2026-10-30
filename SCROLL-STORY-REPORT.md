# PMForge scroll storytelling verification

Date: 2026-10-29. Base: `fe3cf18` (`perf: optimize WebGL rendering lifecycle and asset delivery`).

## PASS

- Hero: the existing instrument, evidence, copy, and camera move from unresolved to settled through section-scoped `--calm`.
- Signal: desktop sticky storytelling adds 1.5 viewport heights of scroll. Scrolling alone stops at calm 0.58; selecting the strongest real evidence permits calm 1 and “Decision justified.” Inspection and weaker selections retain intermediate states. Selection survives layout refresh/resize.
- Learning: all 18 existing blocks remain a single instanced draw. Staggered foundations, intermediate, and upper tiers establish a hierarchy. Instance matrices update only when the story state changes; the existing module cards and interactions remain available.
- Projects: existing sheets square up as the desk enters. Only a real pressure choice gives the written decision record its emphasis and short settling transition.
- Interview: the actual timer, answer state, and actual rubric feedback drive short transitions. The waveform is flat at idle and animates only during active speech recognition, using speech-event activity; it is not an audio amplitude meter. No microphone permission or recognition result is simulated.
- Career/final: artifact reveals, short counters using the real displayed values, restrained depth, and final action settling. Counter animation is hidden from assistive technology; accessible values remain stable.
- Shared ScrollTrigger registration, section-scoped effects and cleanup, font/loader refresh, debounced layout refresh. Existing Lenis ticker retained. No added permanent RAF loop; the existing interview waveform loop now runs only for a visible live recognition session.
- Typecheck and production build pass. Production Chromium checks cover 1440×860, 800×766, 390×844, and reduced motion at 1440×860, with DPR 1.25 and software WebGL.
- Zero runtime exceptions/console errors in the browser sweep. Development still emits the existing Three.js/SwiftShader shader compiler precision/division warnings; this is not a warning-free console claim. Screenshots inspected for layout, hierarchy, and the existing visual direction.

## FAILED

No known implementation failure in the completed checks. Detailed assertions and measurements are recorded in `docs/scroll-story-verification/results.json`.

## DEFERRED

- Live human microphone/dictation validation and physical mobile-device/GPU testing. The automated interview test exercises the real text → timer → submission → rubric path and does not claim to verify live speech services.
- Previously accepted performance deferrals remain unchanged: shared WebGL context, shader compile elimination, cold-network timings, and asset pipelines. See `PERF-REPORT.md`.
- Routing, authentication, CTA restructuring, product pages, backend, and security remain outside this pass.

## MEASUREMENTS

The comparison uses the accepted production measurements in `PERF-REPORT.md` as the **before** reference; it is not a fresh checkout/build of the checkpoint. Both the baseline and the matching current run use 800×766 CSS pixels, DPR 1.25, software WebGL. Draws are instrumented directly at WebGL draw methods; each current sample lasts approximately two seconds. Small differences in draws per second track frame-count variation rather than additional scene draws.

| Measurement | Accepted before | Current production |
| --- | --- | --- |
| Hero, matching 800×766 viewport | ~3,744 draws/s | 3,716 draws/s |
| Signal, matching viewport | 421 draws/s | 421 draws/s |
| Learning, matching viewport | ~901 draws/s | 902 draws/s |
| Offscreen scenes | 0 draws/s | 0 draws/s in every sampled profile |
| Signal/Learning overlap, matching viewport | 420 / 901 draws/s | 423 / 907 draws/s |
| Rendering scenes | Normally 1, max 2 in overlap | Normally 1, max 2 in measured overlap |
| Allocated WebGL canvases after full visit | 3 | 3, stable on return to Hero |
| Initial WebGL canvases | 1 | 1 |
| Reduced-motion idle | 0 draws over 2 s | 0 draws over each ~2 s sample, all three scenes |
| Frame rate, matching viewport | 60.1–60.6 FPS | 59.9–60.4 FPS |
| Median frame interval | 16.7 ms | 16.7 ms |
| p95 frame interval, matching viewport | ≤17.0 ms | 16.8–17.1 ms |

Across the full production sweep, the highest sampled p95 interval was 17.6 ms (desktop Career, with all WebGL scenes paused). The archived ≤17.0 ms timing ceiling was therefore **not reproduced in every sample**. These short software-renderer samples support preservation of the draw budget and lifecycle; they do not prove identical tail latency on hardware GPUs. The complete raw results retain this variation rather than filtering it out.

The regression harness completed with **zero failed assertions** in all four profiles. It checks real Signal gating and persistence after resize, Learning progression, real project-choice output, advancing interview timer/submission/feedback, final counter values, horizontal overflow, rendering-scene limits, offscreen draws, and reduced-motion idle draws.

Development cross-check (`?perf=1`, `window.__pmPerfReport()`): both desktop and the matching tablet viewport completed with zero failed assertions. At 800×766, the registered per-frame counts are **62 / 7 / 15** for Hero / Signal / Learning, exactly the accepted baseline. Triangles also match at **15,558 / 8,464 / 7,296**. DPR remains **1.25**. Every offscreen scene publishes `frameloop: "never"`; the overlap publishes only Signal and Learning as active. Development startup/long-task measurements include compilation and shader warmup and are not used as production latency comparisons. Raw diagnostics are in `docs/scroll-story-verification/dev-results.json` and `dev-tablet-results.json`.

All eight implementation/review steps are complete; no work is blocked. The GSAP changes remain uncommitted on top of the existing checkpoint, ready for review.

## Responsive and reduced-motion decisions

Signal pinning is enabled only at width ≥1180 and height ≥860. Shorter desktop windows, tablets, and phones keep natural flow so the physical board does not crop the evidence controls. Reduced motion removes the pin and scroll choreography, presents the settled Learning hierarchy, keeps the real Signal decision requirement, and has zero WebGL draws at idle.

The headless captures use a viewport height of 860 or less to avoid the previously observed tall-viewport SwiftShader screenshot ghosting. These are browser emulations, not physical-device captures.

## Reproduce

1. Run `npm run typecheck` and `npm run build`.
2. Run `npm run start -- --port 3001`.
3. Run `node docs/verify-scroll-story.mjs` with Chrome installed at its standard Windows location.
4. Inspect `docs/scroll-story-verification/results.json` and the local PNG captures. PNGs are intentionally ignored by Git.

For a development metrics run, stop production first, start `npm run dev -- --port 3000`, and set `STORY_URL=http://localhost:3000/?perf=1`, `STORY_PROFILES=desktop`, `STORY_RESULTS=dev-results.json`, and `STORY_NO_SHOTS=1` before running the same harness. Production and development must not run together against the same `.next` folder.
