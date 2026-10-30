# Spatial, responsive and landing polish

Verified against the production build on 30 October 2026.

## Delivered

- Reading surfaces use a 1200px inner cap; Practice and Projects grids cap at 1320px. Desktop padding is 32px, smaller desktop padding 24px, and phone padding 20px. The existing desktop navigation rail is included in the available width.
- Practice and Projects use three columns from 1280px, two from 768px, and one below 768px. Practice search, filter controls, count and sort now share one toolbar. Phone status tabs wrap without expanding the viewport.
- Mission cards are shorter, with a smaller illustration area. The constellation has larger link targets, a mission caption and a visible highlight on the corresponding card.
- The decision canvas pairs Evidence/Assumptions, Options/Tradeoffs and Metrics/Next check on desktop; every field stacks on phones. Existing records resolve their real interview or project origin. New manual records say “Independent decision.”
- Hero pillars are quiet text links. The desktop scene remains interactive; phones use the illustrated composition. Learning is labelled as a reference shelf, with honest reading previews. Mobile Projects retains the decision, constraints and Engineering/Sales/UI controls in a stacked layout. Footer spacing is tighter.
- The interview preview now demonstrates Clarify → Investigate → Defend a call → Reflect using the Easy RCA scenario. It cites four observable category checks. Free text does not affect feedback. A 90-second spoken rehearsal uses a timer without recording or speech analysis. Self-grading reveals the lesson; the next action opens the actual guided run.

## Loading and scrolling

Critical desktop textures and the first below-fold background are preloaded. The first narrative transition uses opacity and transforms instead of animated blur. Initial scroll measurements wait for fonts, the hero frame or illustration, and removal of the loader veil. Later dimension changes are measured after scrolling settles.

Phones use native scrolling and do not initialise a graphics context. Accelerated desktops retain Three.js and Lenis. Known software rasterizers use the illustrations rather than paying a multi-second shader compilation cost. The loader has a native wall-clock deadline, and its pre-hydration watchdog clears inert/scroll locks and publishes completion even if hydration fails.

The desktop diagnostic did exercise the watchdog on a slow graphics start. The final check confirmed a ready hero, no remaining overlay, and no inert or scroll lock afterward. A main-thread shader compile cannot be interrupted by a JavaScript timeout; the safety path runs as soon as the thread is available.

## Measurements

Same 1440px viewport, first card/form sheet, before versus after:

| Surface | Before | After |
| --- | ---: | ---: |
| Practice grid width | 1069px | 1120px |
| Practice card height | 294px | 234px |
| Projects grid width | 1069px | 1120px |
| Projects card height | 445px | 365px |
| Decision sheet height | 984px | 861px |
| Phone decision sheet height, 390px | 1400px | 1218px |

At 1920px, the grids remain bounded at 1320px and three columns.

The final 390px / 4× CPU first-scroll sample recorded a 33.3ms 95th-percentile frame interval, no tasks over 50ms, and no horizontal overflow. An earlier diagnostic recorded 1366.5ms and multiple long tasks; an intermediate check recorded 50ms. These are short Chromium emulation samples, not a guaranteed 60fps result or a physical Android test. Physical Android validation remains outstanding.

## Verification

- Production build and TypeScript passed; 191 routes generated.
- All 47 engine, calibration, project and account tests passed.
- `docs/verify-spatial-pass.mjs`: 98 passing checks, 27 layout samples at 320, 390, 767, 768, 1024, 1280, 1440, 1600 and 1920px; no runtime exceptions. Includes record save/readback, map highlight, structured feedback, free-text independence, reflection, spoken timer, mobile stakeholder controls and loader release.
- `docs/verify-product.mjs`: 25 passing checks, including the complete guided interview and debrief/reflection workflow.
- `docs/verify-scroll-story.mjs`: desktop, mobile and reduced-motion profiles passed with no failures. Desktop scenes rendered, offscreen scenes stopped, at most two visible scenes rendered together, and mobile used zero graphics contexts. Signal selection gating, learning progress, project decisions, interview review and counters remained functional.
- Desktop and phone screenshots were inspected for Practice, Projects, the decision canvas and the affected landing sections. Screenshots are local ignored artifacts; JSON reports are committed.

Reproduce with `npm run build`, `npm run start -- --port 3001`, then `node docs/verify-spatial-pass.mjs`. Set `PRODUCT_URL=http://localhost:3001` for the product harness. The browser harnesses require Chrome at their configured Windows path.
