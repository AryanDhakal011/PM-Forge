# The Invisible Wall

Playable entry: `/app/projects/invisible-wall/play`. `/app/projects/invisible-wall` opens the same standalone entrance. The existing gallery card now opens this simulation.

## Experience

The player joins Halcyon Labs as PM, Model Platform. An airport-terminal cold open leads into an eight-hour night shift. A hidden process limits Vesper near index 74; the investor milestone is 78. The investigation reveals that the ward is both an agreed safety stop and a scheduler stabilizer.

The 29 authored scenes cover the full supplied manifest, including both S13 branches. The game has five illustrated characters, a PA/narrator channel and 89 prerecorded dialogue lines. Captions always remain visible, advancement is manual, and each action has a visible reading or character response. People, Case file, exact receipts, dialogue history, Guide and Pause stay available. Inline guides can be permanently skipped.

The playable tools are:

- Badge Scanner: drag or activate Scan; the 600ms scan grants Level 1.
- Facility map: real Floor hotspots, visible zone permissions and time costs. Read-only traces do not require physical hall access.
- Log Scanner: inspect a playhead and mark three benchmark-correlated dips within six seconds. Wrong marks spend five shift minutes; duplicates are free.
- Compute Tracer: a 14-node graph. The capability-crossing lineage exposes the ownerless `wardend` node.
- Access request: two selected, distinct clues earn a logged one-hour Level 2 permit. The permit expires on the actual shift clock. An unlogged route is an alternative.
- UV Lens: a single Three.js shader plane reveals the etched WARD seam in the main server-hall stage. Holding the lens over it for one second stores C3. Pointer, keyboard and Center lens use the same discovery rule. CSS masking completes the interaction when WebGL is unavailable.
- Route Builder: 9×6 grid, at most six straight hops, one or two cells each. Every traversed cell is checked against the deterministic camera sweep, so jumping over a camera does not avoid observation. Compute reservations can be reset; observed HEAT cannot be refunded.
- Clue Board: drag, tap or keyboard links connect real evidence to four hypotheses. Signed strengths drive visible strings and confidence bars; negative links falsify a theory. Bars measure evidence coverage, not the probability that a theory is true.
- Threshold inspection: compare requested capability with the 74 stop and 78 milestone.
- Staging Test: actual 20-second low/medium/high-load previews with pause and 2× speed. Only high load reveals C5.
- Interlock: preview Dismantle, Integrate or Defer; lift the guard before confirming. The raw capability, baseline stability and relationships change according to the engine.
- Stability Run: a deterministic 600-step, 30-second challenge. Damper, queue and cooldown affect amplitude, frequency and recovery. Three assists cover pause, slow motion and undo. Global Pause is free. Auto-stabilize completes the task with a 60% cap and never traps the player in a timed task.
- Glass Wall: causal conclusion, true versus missed evidence, exact decision trace, an engine-derived opposite-policy projection and a specific reflection. The comparison never fabricates a second observed run. A fork restores the real pre-policy checkpoint, preserving the original night, resources and seed.

HEAT produces a floor walk at 40, an audit at 70 and lockout at 100. An explanation must resolve the incident before ordinary actions resume. Discovery can lead to Exposed; an undiscovered successful workaround can lead to Operator. Other endings include Governed edge, Stable but safe, Fast and fragile and Meltdown. Cartographer requires all six clues, realistic-load testing, integration and completed safety evaluations.

## Clock decisions in the supplied script

The handoff combines a 03:00 cold open, a playable 22:00 start and two different Chapter 1 title times. The opening is explicitly labelled a glimpse ahead, then the playable clock begins at 22:00. Action costs control the actual clock. The explicit 03:10 Annex review window charges any waiting against the shift, so the earlier Cage C power observation is in the past. Titles never grant time. An escort does not fabricate the author commit-trail clue: flagged players must actually investigate it to earn C4.

The handoff also places a two-hour safety evaluation after a 05:40 investor preflight. To keep the governed path reachable without inventing extra hours, the player reserves and spends 120 minutes immediately after integrating, while time remains. Chapter 3 then reviews that completed evaluation before allowing index 78. Missing the reservation leaves capability at 74. Deferral spends review time and then allows the remaining window to expire; at six the player must choose a policy with fewer assists.

## Implementation and isolation

- Content lives in `content/invisible-wall/scenes/*.json`; the aggregate and individual files are checked for consistency. The importer preserves the supplied spoken lines and records conditional delivery. New fallback/readings are separate from the recorded script.
- The pure engine exports `applyEffects`, `nextScene`, `tick`, `hypothesisConfidence`, `stabilityScore` and deterministic simulation functions. Rendering does not independently score player prose.
- A dynamic client boundary isolates the experience from the main site. Three.js is imported only for the UV scene. At most one canvas exists: UV inspection, a waveform or finite glass shards. The renderer, geometry, material, context and animation callbacks are disposed when leaving the UV scene.
- Namespaced CSS scopes the fog/cyan palette. Only the root and play routes bypass the workspace shell/profile gate; older generic chapter/run routes keep their existing shell. The entrance works for a fresh visitor without creating an account.
- The existing PMForge Dialog, settings provider and established recording-player behavior are reused. Static parametric portraits have five expressions and character props; there is no mouth animation.
- Optional sound includes caption-matched synthetic voices, terminal ambience, a UV hum, footsteps, a heartbeat bed, shatter/settle and dry control cues. Assets are rendered offline. Nothing synthesizes speech in the browser. Short-utterance performance and perceived acting remain subjective review; these are not human actors.
- All effects respect reduced motion or Calm effects. Hidden tabs pause the shader, camera clock and simulations. The final shatter is finite and contains no flashes or strobes.
- Versioned local saves have a checksum, pending write and previous-good backup. Corrupt primary data can recover from backup. Saves are throttled during the real-time task; decisions and checkpoints save immediately. Storage failures leave the current run playable and offer export. Dedicated runs remain device-local and are not account/cloud synced.
- Route-level and beat-level error boundaries preserve saved work. `PMFORGE_INVISIBLE_WALL_ENABLED=false`, followed by a server restart, closes the entry with a calm return link without removing saves.
- Next tracing excludes `.data` and `.pmforge-preview`, preventing offline voice models, local databases and preview snapshots from entering deployable server traces. Runtime account storage on the device is unchanged.

## Verification

Final production-preview checks: 141 passing unit tests across the product and project suites; four engine smoke paths; 211 passing browser checks; 17 shared navigation checks; 314 routes and 161 assets returning 200. All 29 authored scenes are captured, with additional branch captures. Lighthouse accessibility scored 100 on the fresh entrance. Twenty UV entries disposed all twenty GPU contexts and preserved the global listener count (173). Raw DOM event-listener counters varied, so this is not a claim of identical heap usage. Exact build and results: `invisible-wall-verification/summary.json`.

```text
npm run test:invisible-wall
node --import tsx scripts/check-invisible-wall.ts
npm run build
PRODUCT_URL=http://localhost:3002 node scripts/verify-invisible-wall.mjs
```

The build linter checks all 29 scenes, word limits, speakers/expressions, goals, tools, conditional flags, receipt/next references and all 89 caption-matched recordings. CI runs the linter, engine tests and four end-to-end engine smoke paths. The explicit engine tests cover the handoff's P1–P10 paths, resource accounting, expiry, camera traversal, deterministic replay, bounded assists, save recovery and genuine checkpoint forks.

The browser harness uses a disposable Chrome profile. It performs a complete real-control run, including the real high-load test and 30-second Stability Run; additional branches use the documented test hooks. It captures every manifest scene at desktop and mobile sizes, checks the fresh-visitor entrance and modal hit targets, and tests fallback behavior. Twenty soft navigation cycles enter the UV scene and verify that all twenty GPU contexts are lost on disposal and global listener counts remain unchanged. Reports live in `docs/invisible-wall-verification`.

Lighthouse accessibility is checked on the actual fresh-visitor entrance. Desktop Chromium and mobile viewport emulation are exercised; physical iOS/Safari, Firefox and a representative mid-range Android GPU are not certified by this desktop run. Final human playtesting, expert review and subjective voice direction remain pending, as labelled in the product.

## Design and asset provenance

Subframe MCP inspiration search covered spotlight reveals and waveform interactions. [Ultraviolet ink pass](https://www.subframe.com/motion/spotlight-story) informed the discoverable pointer/keyboard reveal and explicit fallback. [Rolling signal](https://www.subframe.com/motion/rolling-signal) and [Phosphor trace](https://www.subframe.com/motion/phosphor-trace) informed readable waveform presentation. No Subframe project was edited and no example source or assets were copied. The SVG world, portraits, shader, graphs and soundscapes are original code-based assets.

Voice production uses Kokoro-82M v1.0 through kokoro-onnx. Casting and exact captions are in the checked-in manifest; the model licence and credits ship with the audio. Large models and Python production dependencies remain local tooling, outside the website bundle.
