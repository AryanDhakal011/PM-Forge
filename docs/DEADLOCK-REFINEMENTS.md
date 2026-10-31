# Deadlock follow-up refinements — 31 October 2026

Implements the user's feedback on animation, natural delivery, evidence clarity, project navigation and an overwhelming debrief. The decision engine and saved-run rules are unchanged.

## What the player now sees

- **Static character portraits.** Mouth/eyelid overlays and the audio animation-frame loop are removed. Four expressions remain available as still images.
- **Grounded conversation.** Dev's introductions, defensive responses, data reactions and live-demo remarks use complete, relevant sentences. Forced shelf/leash/bake-sale jokes and clipped dramatic one-liners are removed. Theo's endings now sound like a stakeholder evaluating a product, with enough context for the voice model to deliver a normal sentence.
- **A readable demo review.** It is clearly labelled a reconstruction. Scrubbing near the marked moment moves the illustrated technician into the moving arm's path, with an explanation of the 0.4m near-miss. Show the near-miss is a shortcut, not a mystery hotspot. The player sees the finding before selecting Save this finding to the case file.
- **A timely case-file cue.** New discoveries and the table/build steps highlight the case-file button and show a small evidence reminder. Opening the file clears the cue. It does not keep nagging at the ending or conclusion.
- **Specific evidence questions.** Six context-aware prompts ask about speed, jam recovery or confirmation. The old repeated “Based on what?” is gone. Variation avoids consecutive repeats.
- **An explicit team response.** The consequence screen lists the three choices the player just made, then explains each lead's reaction. The dialogue states which plan it is discussing. Reaction text uses the original table calculation rather than attributing later resentment changes to that first plan.
- **Clear quantities.** Safety narration says “twenty-two centimetres,” “forty centimetres,” “half a metre per second” and “one metre per second.” Numeric measurements remain in the data graphics. Audio and caption scripts match.
- **An explained Event 2.** Ines says that a technician has entered the robot's path, forty centimetres away, while the arm is moving. Both the diagram and the paused decision explain the situation. Native dialog/scene scrollbars use the application's dark and brass palette.
- **A quiet ending.** One conclusion leads with the result, followed by at most three choice → observed-result links. It does not claim untested counterfactuals. Chapter assessments, archetype labels, exact numbers and replay tools sit behind an optional decision-trail disclosure. The duplicate final chapter-review stop is removed, and the instrument bar is hidden on the conclusion screen to give the explanation space.
- **Whole project cards work as links.** All twelve gallery cards expose one full-surface native link. Pointer clicks on the artwork/title/empty card surface work, as do keyboard activation and normal browser link actions. The Enter/Resume label remains as an affordance.

## Voice production

Mara remains **af_heart at 0.96**, with the same sentence/clause timing. The approved `INT-01.mp3` is byte-identical to the previous commit (Git blob `f7f15b7f3f21920b114ada155e2c64fc2bdcf9dd`). Rewritten Mara lines use that same casting and delivery recipe.

Dev now uses **am_puck**, with a 1.00 base pace and restrained per-line delivery. Theo uses **am_fenrir** with a reflective 0.98 base pace. The Northgate letter uses **af_bella**, a warmer voice in the same model family as Mara. Ines keeps **bf_emma**, with rerecorded measurement explanations.

Each line has an emotion-direction tag and explicit speed/pause metadata. These tags drive offline pacing for the recast Kokoro voices; this model does **not** implement fully acted emotions from tags. No tags are read aloud, no DSP pitch gimmicks are used, and synthesis still never runs in the product. The existing ElevenLabs path remains available for native expressive delivery when licensed casting and credentials are supplied.

The choice to remove very short punchlines and use fuller utterances is informed by the [model's own voice guidance](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md), which identifies short-utterance weakness. Pronunciation and direction follow the general principles in [ElevenLabs' speech guidance](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices); the shipped provider remains Kokoro, not an untested claim of an ElevenLabs performance.

Audio URLs carry their recording signature, and the static cache version is updated. Existing browser caches therefore cannot silently pair the new captions with old recordings after refresh.

## Verification

The full engine/content suite passed **22 tests**, including canonical script/recording alignment, contextual reaction variation, static portrait checks and causal-summary attribution. The **47 existing product/account tests** also passed. The browser report records both complete playback modes, all twelve stretched-link geometries and actual card navigation, the footage explanation/save interaction, case-file cues, the team response, the default collapsed decision trail, and actual playback of all **191 MP3s**. The two-mode run passed **88 browser checks** with zero exceptions. The final captions-only/mobile smoke passed **47 checks**, and voice-preview checks passed **17 checks**. The production build and all five JavaScript budget checks passed: **320,777 bytes gzip** for the Deadlock boundary plus lazy scenes. The 191 on-demand recordings total **10,653,105 bytes**. Reports are in `deadlock-v2-verification`.

Voice resemblance, perceived emotion and naturalness are subjective casting checks; automatic playback tests cannot certify them. Physical-device and actual screen-reader validation remain outstanding. The historical v1 balance gate and account-sync limitations are unchanged.
