# Projects experience — research-informed corrections

## Scope

The supplied handoff matches the source already preserved in this repository (SHA-256 `430B8965A54A26184FD38EFA832F4D4A976D2526177C4E37F34D405B9E6693CD`). This pass audits the implemented experience against that brief and the user's opened-card corrections. The document supplies product requirements; it does not independently authorise deployment or external messaging.

The existing 12 project palettes, textured landing panels, controlled title breaks, chapter-card hierarchy, authored consequences, local-first data and guest access are retained. The corrections below address specific usability and persistence gaps rather than adding more animation.

## Research and implementation

| Guidance | Applied correction |
| --- | --- |
| [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) recommends deferring secondary complexity while keeping primary tasks accessible. | On phones, the five state meters now start behind an Operating state disclosure. A compact summary remains visible and all meters are one action away. Chapter briefs can appear without scrolling through the entire dashboard. Desktop meters remain expanded. |
| [NN/g: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) covers visible system status, error prevention and recovery. | The runner distinguishes Unsaved changes, Saving, Saved and save failure. Shared engine/UI readiness checks explain evidence, direction and ranking requirements before confirmation. A locked consequence appears only after the local write succeeds. Save errors retain the decision draft and expose recovery controls. |
| [W3C: Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) explains how important updates can be announced without moving focus. | Save/readiness feedback has semantic status messages. Normal autosave does not interrupt the task. Save failure is an alert with a focused recovery area; the old decision surface remains available until persistence succeeds. |
| [W3C: Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) explains keeping keyboard focus visible around author-created overlays. | Chapter/consequence headings receive programmatic focus. Scrolling occurs only when needed to reveal the heading; scroll margins account for the header. The chapter tracker has visible focus styling, and closing a chapter review restores focus to its control. |
| [W3C: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) specifies 24 CSS pixels or permitted alternatives including sufficient spacing. | Project navigation and ranking controls use a more generous 44 px comfort target. Labels and icons jointly distinguish current, completed and future chapters. Future chapters have no fake navigation links. This is a design choice above the minimum, not a claim that WCAG universally requires 44 px. |
| [web.dev: prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion) explains respecting an operating-system request to reduce motion. | Existing reduced-motion entrances and consequences remain supported. The new navigation/disclosure needs no motion or WebGL to function. |

## Functional changes

- A three-chapter tracker shows the current room, opens earlier commitments in a read-only review, and leaves future rooms unavailable. Branching remains a separate explicit action, preserving the original timeline.
- Operating state is progressively disclosed on mobile; the compact summary is derived from actual run state. Expanding it preserves information parity with desktop.
- Commitment readiness is shared between the UI and state engine. Unknown evidence IDs and invalid evidence order cannot satisfy readiness. Optional rationale is still optional and is not secretly scored.
- Saving a lock or chapter advance is transactional from the user's perspective. A failed write cannot visually advance the world or claim the decision is locked. Controls are held while that transition persists.
- Save status distinguishes a pending draft from a persisted one. Recoverable errors retain the previous saved phase and the current draft; recovery export, reload and retry remain available.
- Project landing errors are now displayed rather than held in unused state. Bookmark saves disable duplicate input while pending and surface failure clearly.
- Stakeholder indicators include resentment and safety variables, so the two robotics teams and the courier constituency are not omitted simply because their variable names lack the word “trust”. Pressure variables are interpreted in the opposite direction from capacity: higher resentment dims capacity rather than presenting it as stronger trust.

## Evidence and limits

These are research-informed design decisions, not participant-study findings. No external experts or test participants were contacted, and no conversion, learning-effect or completion-time improvement is claimed. Automated checks and browser fault-injection results are recorded separately in `docs/project-verification/ux.json`; full campaign regression results are in `results.json`.

The existing launch limits remain: human review of authored content/state vectors, real OAuth credentials, deployed database acceptance, physical-device performance and assistive-technology acceptance. A browser layout check is not a full WCAG conformance audit.

Verification: 47 automated tests pass, including shared readiness validation and stakeholder-polarity checks. The full 12-campaign browser regression passes 41 assertions. The 50-check focused UX pass covers fault-injected storage failure/recovery, status honesty, keyboard focus/review restoration, mobile state disclosure and all 12 runner layouts at 1440/390/320 px. All 42 opened-card checks pass again. The final build passes a separate 17-check smoke test, including background-flush safety during a decision lock and correct rendering of high resentment as guarded capacity. Reports: `results.json`, `ux.json`, `cards.json` and `ux-smoke.json` inside `docs/project-verification/`.
