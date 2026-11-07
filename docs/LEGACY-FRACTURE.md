# The Legacy Fracture

The Legacy Fracture is the standalone Granger & Sons freight simulation at `/app/projects/legacy-fracture/play`. The Projects card and project root both lead to its entrance. It is guest accessible before the workspace loads. The case and company figures are fictional; this is a practice simulation, not a calibrated evaluation.

## Player journey

1. Ring the bell and meet Cora, Oswald, Renata, Leif, Isaac and Alistair through sequential, captioned scenes. Guided, Standard and Sharp modes are available. Day Zero rehearses the reel, tape, migration wave and shadow comparison without spending campaign time. The introductory depot/code walk also occurs before the campaign clock; it is free, a deliberate interpretation of the handoff's conflicting S05 timing.
2. Spend attention to audit 40 delivery records. Correctly classify three distinct mismatches, inspect Oswald's oral history or the map margin, and uncover the undocumented `LEDGER_SYNC` consumer. The 24 module dependency map shows known links and the currently visible blast radius.
3. Decide whether to run a bounded proof of concept, expose the problem, or walk the system. Present three evidence cards actually held, win an operating or financial ally, order four migration waves and choose whether to compare old and new outputs in Shadow Mode. The nine week clock, six attention points per week, trust, mandate, parity, friction and budget carry between chapters.
4. Address all four cutover checklist items. Watch five live fleet moments: the first and fifth are observation only, and the middle three allow limited holds. The 900 truck Canvas2D map reflects the resulting motion or freeze. Each choice leaves a Why receipt with before/after values and the governing rule.
5. See the quarterly review, compare two alternatives computed with the same seed, inspect the decision trace, reflect, export a backup, or fork from the cutover. Local saves are namespaced, checksummed and backed up. The separate balance log excludes player-written text. One rewind per chapter costs five credibility.

The cutover draws once from the seeded generator and persists the draw. An overnight switch without the hidden ledger thread always produces 3–6 misbilling days and broken border clearance. Prepared rollback contains a failed cutover. Other routes can reach Clean handoff, Grind, Rebirth, Contained failure or Blackout.

## Presentation and access

The visual direction draws from Subframe inspiration consulted through the connected server: Atoms' restrained industrial gold and Vessel's warm editorial composition. PMForge type, controls and case file conventions remain. Portraits have five authored expressions and remain legible in the compact character panel. Scene settings use layered SVG; the fleet uses Canvas2D rather than a required 3D device path. GSAP entrance motion loads only when motion is enabled. The fleet stops animating while hidden, offscreen or paused and caps active drawing near 30 fps. Small screens reflow the tools, and reduced motion keeps the still state. Every audio line has a visible caption; sound starts only after the player opts in.

The 69 speech clips are pre-rendered with Kokoro-82M and six assigned voices, with authored emotion/pacing tags. They are synthetic; the voice model does not provide acted emotional delivery. The eight original sound cues and license/credits are in `public/projects/legacy-fracture/CREDITS.txt`. No live text-to-speech runs in the browser.

`PMFORGE_LEGACY_FRACTURE_ENABLED=false` sends visitors back to Projects without loading the simulation. The temporary `?qa=1` interface is for local automated checks only and is removed when the page unmounts.

## Verification

- `npm run test:legacy-fracture`: 15 engine/storage tests, content linter and ten seeded complete paths. The balance report records all outcomes and the 15 of 27 event types not reached by those ten paths. Those are content variations, not broken references.
- `npm run typecheck` and `npm run build` verify the Next application.
- `PRODUCT_URL=http://localhost:3002 node scripts/verify-legacy-fracture-routes.mjs` checks all 83 pages and media paths.
- `PRODUCT_URL=http://localhost:3002 node scripts/verify-legacy-fracture.mjs` checks entrance, all three chapters, cutover, review, mobile widths 390 and 320, save/resume, Projects card routing, ten soft navigation cycles and reduced motion. Screenshots and reports are in `docs/legacy-fracture-verification/`.

Expert scoring, real operator validation, and human voice acting remain future production work. The simulation does not present a numerical candidate score.

