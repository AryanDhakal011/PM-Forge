# Deadlock: the guided, voiced experience

Implements the corrected v2 handoff and the user's follow-up refinements. See [the latest refinement report](DEADLOCK-REFINEMENTS.md) for the current verification and casting changes. This document supersedes the presentation/audio sections of `DEADLOCK_QA.md` and `DEADLOCK_GAPS.md`; their v1 balance report remains historical evidence, not a calibration of v2.

## What changed

- A single **Enter the lab** action follows two explicit playback options. Captions only is the initial default.
- Nine character introductions establish Mara, Dev and Ines as people. Seven case-briefing lines explain Halyard, TERN-1, Northgate, the disagreement, the user's role and the resources. A simple case map accompanies the briefing. Case file reopens a plain summary and offers the full introduction/briefing replay.
- An eight-step strip gives location and purpose. Character-led guides have Goal / Do this / Watch for, Replay, Mute and Got it. A persistent skip-all checkbox suppresses automatic guides; the question-mark button still opens them.
- One conversation index owns each displayed line and its audio request. Next is explicit. Auto-advance starts OFF and, when enabled, waits for a successful recording's `ended` event plus 600ms. Silent, failed or missing playback cannot trigger auto-advance. Old callbacks and duplicate end events cannot advance a newer line.
- Speaker name/role appear beside the portrait, separate from the words. Replies stay until the player advances; no guessed speech-duration timers or browser speech remain. Replay restarts the current recording. Pause/tab visibility pause playback, and returning from a guide replays the interrupted current line without resetting the conversation.
- Five distinct illustrated adults use four static expressions: Neutral, Thinking, Annoyed, Approving. Speaking and blinking overlays have been removed. There is no per-frame facial-animation loop. The mobile gallery preserves readable 80px portraits.
- Objects have short, explicit instructions. Demo footage is labelled as a reconstruction: moving the timeline shows the technician cross close to the moving arm. A shortcut reaches the same moment; Save this finding explicitly records what the player saw. Other completed object tasks still save their discovery directly.
- All four table choices remain readable, including the complete Leave for later explanation. A review-before-lock modal lists three choices and metric/resource deltas, with Change something and Lock it.
- Dataset selection immediately projects the dataset, matching the guide. The prototype has a plain Submit proposal action.
- Every demo event has an explanation. Events 1 and 5 are watch moments; only 2–4 offer decisions. Each decision explains the current build, evidence/unknowns, token cost, impact loss and supervision. The real engine's risk is used; the UI does not falsely mark every defended 1.0 m/s build unsafe.
- Chapter transitions give one compact takeaway with optional context. The ending leads directly to one brief conclusion, with at most three choice-to-result links. Detailed chapter notes, traces and replay tools are collapsed until requested; they do not lead the result screen.

## Shipped voice pack

**191 pre-rendered neural MP3 assets**, 44.1kHz mono / 96kbps, approximately 10.65MB total, generated offline using Kokoro-82M v1.0 through kokoro-onnx 0.6.1. Nothing is synthesized in the application and no model weights ship to the browser. Files load by line as needed; the service worker caches full clips rather than incomplete Range fragments. Missing playback leaves captions and Replay available.

| Speaker                        | Neural voice | Production speed |
| ------------------------------ | ------------ | ---------------- |
| Mara                           | af_heart     | 0.96             |
| Dev | am_puck | 1.00 base, directed per line |
| Ines                           | bf_emma      | 0.96             |
| Nadia                          | bf_isabella  | 1.00             |
| Theo | am_fenrir | 0.98 base, reflective delivery |
| Northgate letter | af_bella | 0.98 |
| Facility captions              | af_sarah     | 1.00             |

This is an actual neural recording pack, not a claim of human actors or exact perceived ages. The script's emotion direction is preserved as one tag per line. For the recast voices it controls offline speed and sentence/clause pauses. Kokoro does not provide native acted-emotion tag control; tags are not spoken aloud. Mara's approved casting and delivery settings are retained. Listening/casting approval for the requested mature/dry/energetic performances remains subjective review. The user can audition the real result in Sound + captions.

`content/projects/deadlock/audio-manifest.json` contains line ID, speaker, exact spoken caption, file, voice, expression, direction, duration, direction tag, delivery settings and archival amplitude envelope. The generated MP3s are in `public/deadlock/audio`; a copy of Apache License 2.0 is included. Model provenance: [official model card](https://huggingface.co/hexgrad/Kokoro-82M), [voice characteristics and limitations](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md), [inference implementation](https://github.com/thewh1teagle/kokoro-onnx). The voice documentation explicitly notes weaker short-utterance performance; very short lines need listening review.

## ElevenLabs production path

No ElevenLabs credential or account connection was present, so no paid generation request was made. `scripts/render-deadlock-voices.py --provider elevenlabs` supplies the offline replacement path. Set `ELEVENLABS_API_KEY`, choose licensed `ELEVENLABS_VOICE_MARA`, `_DEV`, `_INES`, `_NADIA`, `_THEO`, `_CONTROL` and `_NORTHGATE` IDs, optionally set `ELEVENLABS_MODEL` (default `eleven_v3`), then run the script in a separate production environment. Never use a `NEXT_PUBLIC` variable. It validates the complete cast before sending any requests, generates one directed line per MP3, stages the files, and recomputes the envelope from the resulting audio before publishing the pack. Rebuild and rerun verification after replacing it.

The integration follows [ElevenLabs' speech API](https://elevenlabs.io/docs/api-reference/text-to-speech/convert?explorer=true), [performance guidance](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices), and [dialogue guidance](https://elevenlabs.io/docs/overview/capabilities/text-to-dialogue). Consistent voice casting and limited direction matter more than stacking emotional tags. The supplied script uses one tag per line. This alternative provider path has not been exercised with real credentials.

For local reproduction, install `kokoro-onnx==0.6.1`, `soundfile==0.14.0`, `imageio-ffmpeg==0.7.0` into a separate Python environment. The script detects the task-local `.data/deadlock-voice-runtime`. Download `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the inference project's documented `model-files-v1.1` release to `.data/deadlock-model`, then run `python scripts/render-deadlock-voices.py`. Models and runtime dependencies stay ignored under `.data`.

## Illustration provenance

`public/deadlock/characters/cast-v2.webp` was generated with the built-in OpenAI image-generation tool, then encoded as WebP without changing its composition. The 4-column × 5-row atlas is 1122 × 1402 pixels, 236,560 bytes. Rows: Mara, Dev, Ines, Nadia, Theo. Columns: Neutral, Thinking, Annoyed, Approving. The production prompt is in `public/deadlock/characters/PROMPT.txt`. No external person's likeness or voice was cloned.

## Compatibility and limits

The optional `START.experienceVersion: 2` records the only numeric correction requested in v2: Slow loses 4 impact, Pause loses 6, Take over loses 10. Old starts without the marker retain Slow 6 / Pause 4, including forks; old saved results are not silently rewritten. Other supplied engine rules remain. V1's 200,000-policy distribution report does not certify v2 balance; the outstanding rule conflicts and expert/human validation remain in `DEADLOCK_GAPS.md`.

Playback design is informed by [W3C audio-control guidance](https://www.w3.org/WAI/WCAG21/Understanding/audio-control) and [pause/stop guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide); the handoff's manual-advance rule is stricter than merely supplying a mute control.

## Verification

Local production verification on 31 October 2026 (Nepal): production build passed; all 22 Deadlock engine/content/refinement tests passed; all 47 existing product/account tests passed. The two-mode browser suite records 88 checks, including the complete ordered introductions/briefing, the full scenario in both modes, 320/390px layout checks, guide persistence, actual audio-end timing, duplicate callbacks, keyboard advancement and failure/replay recovery. All 191 audio files were played through to `ended` in Chrome. Exact reports are in `deadlock-v2-verification`.

Final compressed component-boundary measurement: **320,777 bytes gzip**, with chapter increments **12,796 / 8,668 / 4,673 bytes**, plus **6,767 bytes** for debrief. All five supplied JavaScript budget checks passed. This includes shared dependencies at the Deadlock boundary; it excludes unrelated Next bootstrap scripts and does not represent a full cold-page transfer. Fonts are 37,016 bytes, the character atlas is 236,560 bytes, and the 191 on-demand voice assets total 10,653,105 bytes.

A historical sample from the preceding v2 build (not rerun for these refinements) measured **16.8ms p95 on desktop** and **33.3ms p95 at 390px with 4× CPU throttling**, with zero long tasks in both samples. JS heap estimates were approximately 24.5MB and 20.9MB. These are one-scene browser-emulation samples, not physical-device frame guarantees or total process-memory measurements. The reproducible probe is `docs/verify-deadlock-v2-performance.mjs`.

The current [screenshots](DEADLOCK-V2-SCREENS.md) are included for review; additional mobile images remain in the local verification directory.

After the final copy/settings cleanup, a separate captions-only smoke pass completed 47 checks and refreshed the seven screenshots. Seventeen additional voice-settings checks passed, including all five cast/letter previews while captions-only is selected, preserving that selection after auditioning, and starting recorded playback with the legacy device-voice “off” preference. Use `DEADLOCK_FAST_SMOKE=1` or `DEADLOCK_PREVIEW_ONLY=1` with the browser script to reproduce these focused passes; their reports are `smoke.json` and `voices.json`.

`npm run test:deadlock` includes the existing engine tests and the new voice coverage, four-expression, non-repeating reaction, guide/review and versioned-cost regressions. `node docs/verify-deadlock-v2.mjs` exercises both modes through the full introduction, briefing and scenario. Reports and screenshots are in `docs/deadlock-v2-verification`; seven review screenshots are tracked; additional local captures are ignored by Git. Compressed JavaScript and asset sizes are measured by `node scripts/deadlock-budgets.mjs` after a production build.

Physical Safari/iOS/Android, actual screen-reader and subjective cast listening checks, the “goal understood within ten seconds” observation, and real 8–10-second object timings require human/device validation. Browser emulation cannot certify those. Cloud sync and general workspace backup still exclude Deadlock logs; use the in-simulation export.
