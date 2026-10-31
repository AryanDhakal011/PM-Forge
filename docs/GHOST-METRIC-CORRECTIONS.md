# Ghost Metric experience corrections — 1 November 2026

This pass changes the presentation and interaction layer. The deterministic engine, story outcomes, budgets, saved event schema and original run logs remain unchanged.

## What changed

- The opening introduces Elena, Ravi, Marcus and Joyce, then explains the player's role, the discrepancy, the three-day assignment, audit/prep hours and credibility. It is skippable, captioned and fully recorded. The retry exercise follows the brief. Joyce's “probably nothing” invitation appears only after that exercise. A completed briefing is remembered per run on this device.
- Conversations now have a portrait/name header, dialogue, a prominent primary action, a separate Replay/Pause row, and a compact Captions / Sound / Auto-advance cluster. Sound defaults off; captions stay on. Automatic advancement requires the actual recording's ended event plus 600ms. A failed recording leaves manual advancement available. Ambient mute is also available inside conversations and guides.
- First-use guides use recorded character lines plus Goal / Do this / Watch for references. Guides can be replayed or disabled persistently. Replayed guides and frequently repeated reactions select from three or four authored variants, avoiding the previous two choices. This selector is separate from scoring and deterministic outcomes.
- Progress sits above the Goal / Now / Costs strip. A small, state-dependent line explains what remains possible, including affordable drawers and remaining fix hours.
- The redundant drag bench and form were replaced with one source-to-target picker. Open a drawer, inspect its identifiers, then choose **Join this with…**. Both columns and their meaning are visible before confirmation. Dragging selects a pair; it never charges an hour. Confirming charges once. Valid joins align and highlight rows; invalid joins separate the rows and explain “No shared key.” Feedback stays open and can be replayed. All choices work by click and keyboard.
- The join dialog keeps its action row in a fixed footer. Feedback scrolls into view, and Change columns restores focus to the first source chip. An already completed check makes Return to the audit the primary action.
- Resource counts, proved mass and retrospective growth animate over approximately half a second. The uncertainty bar keeps a short residual trail, and proved evidence produces a restrained bubble acknowledgement. Reduced motion shows final states without these transitions.
- Shader uniforms are explicitly synchronized with the animated values; the inflated film is removed when the reveal completes instead of remaining around the real-growth core.
- **Edit rule** is aligned with the rule-card heading. It opens real, budgeted control patches. Full changes to the original unit or scope use a clearly labelled new replay branch, preserving the original definition and trace.
- The debrief reading shell is capped at 1200px, with a 36px anatomy/distinction gap. Tool surfaces are capped at 1280px. Phone layouts collapse the rails without horizontal overflow.
- “What I could have noticed” is now four visible, expandable tell cards with source callbacks. The strongest missed signal can be opened directly. Reflection has a specific question, comfortable padding, amber focus and a clear Save / Export / New audit hierarchy.

## Voice and ambience

There are 150 caption-matched, prerecorded lines. Ravi now uses `en-IN-PrabhatNeural` at a controlled pace, replacing the British voice. Microsoft lists this as an [English (India) neural voice](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts). Other characters keep their established offline Kokoro voices. These are synthetic recordings, not human actors; no voice model or synthesis runs in the product.

The lab has an original 16-second seamless room-tone asset, enabled by default independently of spoken dialogue. It starts when browser autoplay rules permit, normally at the first interaction. Ambient gain drops from 0.045 to 0.009 while any dialogue voice plays, and returns afterwards. The persistent control stores mute preference. Pause and hidden tabs stop the bed; autoplay or asset failure leaves the interface usable. Speech remains off by default.

## Design references

Subframe is still configured and authenticated globally, but its tools are not exposed in this running chat. Public [Subframe Dialog](https://www.subframe.com/library/components/dialog) and [Primer's dialog guidelines](https://primer.style/product/components/dialog/guidelines/) informed the action hierarchy. No private Subframe canvas or MCP inspiration search is claimed.

## Verification

- 29 Ghost Metric tests: the original 23 engine/path tests plus six presentation, briefing, guide-coverage, paraphrase-history, resource-hint and asset/casting checks.
- 50 existing product/account/reset tests and 22 Sacred No tests.
- Production compilation, TypeScript and recording coverage checks.
- Isolated Chromium exercises the full brief, actual audio-ended advancement, pause, blocked audio, ambient ducking/mute, keyboard focus, guide preferences and variants, both join outcomes and exact costs, animated mass/model changes, rule editing, missed tells, reflection recovery, replay isolation and the unchanged crisis ending. It checks 1440px desktop, 390px/320px mobile and reduced motion.
- The completed pass contains 58 passing browser assertions, with no runtime errors. An engine source-hash comparison confirms that its rules did not change.

Run `node scripts/verify-ghost-corrections.mjs` against the preview (`PRODUCT_URL` overrides the default port). Reports and representative captures are in `docs/ghost-corrections-verification/`. These checks do not claim human think-aloud playtests or a professional screen-reader audit.
