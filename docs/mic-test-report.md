# Microphone verification — 9 November 2026

## What changed

Hot Seat no longer uses browser SpeechRecognition. A single controller owns getUserMedia, an AudioWorklet capture gate, permission cancellation, pre-roll, meter, bounded clips and release. An explicit download prepares English Whisper tiny.en q8 on the device. First model download is not microphone capture. A separate preparation button was verified to reach “dictation ready” with the microphone off before entering the round. Voice input remains a draft until Send. Typing works without model or mic access.

Tap latches capture; tap again finishes. Holding closes on release with a short tail. Space works outside inputs and on the mic button; Enter activates its ordinary action. Cancel, tab hiding, capture loss, pause, route exit and switching to typing release capture. Processing already-captured audio can finish into its original saved run. Mic live/off is shown truthfully; a warmed hardware stream may remain live between explicit voice turns until typing/pause/exit. No microphone recording is retained.

## Checks that actually ran

- Nine controller/quality tests plus actual worklet VM test: repeated start/finish, one acquisition between turns, late grant after cancel, denied access, hold/tap/cancel, no audible local echo, exact 500 ms pre-roll, flush, recognition failure, exit during recognition, resampling, obvious text-loop rejection. These are deterministic boundary tests, not a hardware matrix.
- Built app in Chromium in-app browser on Windows: three-second input test detected actual microphone input and stopped. The on-device model downloaded/loaded. Dictation remained listening until finished/time cap and completed recognition into the draft. No browser speech-vendor request was used. No worker error was present after the self-contained runtime correction.
- A 60-second capture took **23.3 seconds** to recognize in this browser during the test. Background audio produced poor/repetitive output. The result was not sent to any AI provider; the test draft was replaced locally with fictional text. A new rejection check blocks obvious loops. This is **not** a clean speech accuracy or realtime-speed pass.
- Switching to typing showed Mic off; a clean fictional typed draft survived pause/lobby/resume, was submitted to local guided practice and reached the debrief without external inference. The old stored runs remained available.
- Composer and Send remained in bounds at 320, 375, 768, 1024 and 1440 px, each at 900 px viewport height; [measurements](production-verification/responsive.json). This is not mobile keyboard/iOS hardware verification.
- Separate actual-model CPU smoke test recognized the authored four-second synthetic preview with zero word errors; [raw timing/fixture report](speed-verification/dictation-cpu.json). Different runtime from browser WASM.

The test did not use a person's private speech as an evaluation fixture. Operational reports contain no captured background transcript or audio.

The final browser check also confirmed separate Bella/Sarah cache paths and successful Sarah playback after returning from a paused round. Resuming the device took about 1.6 seconds in that sample. This is recorded, not hidden behind a sub-second claim.

## Still required

Chrome/Edge/Firefox/Safari real device matrix, iOS/Android keyboards, Bluetooth/wired switching, unplug during speech, permission revocation, locked-screen behavior, noisy/accented speech quality, slow-network model download recovery and automated fake-audio browser regression. No universal mic-compatibility claim is made. Premium LiveKit microphone/ForceEndTurn/TURN tests remain blocked by unconfigured approved services.
