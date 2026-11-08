# Hot Seat microphone repair — November 8, 2026

## Changes

- Replaced the generic error/stop loop with a testable dictation lifecycle, shared by the Hot Seat microphone hook.
- Start browser recognition directly from the user gesture; report Starting until the browser emits start, then Listening.
- Separate the optional real-input meter from recognition. Meter failures do not terminate transcription.
- Allow thinking pauses. Removed the custom 1.2-second silence cutoff.
- Restart after ordinary browser segmentation/no-speech/abort only after the previous instance ends. Bound consecutive empty attempts to three; cancel scheduled reconnects on stop.
- Preserve final and interim words once when ending a segment, stopping, switching to typing, or encountering an error. Ignore callbacks from stale instances.
- Prevent Send/keyboard Send during active or pending capture; preserve newly captured words when pausing or ending the room.
- Space key release stops only an actual push-to-talk gesture, rather than stopping a mic button activated by keyboard.
- Display specific permission, network, capture, language, startup timeout, and empty-input messages; actual recognition failures also trigger the existing error notification.
- Stop capture when the page becomes hidden; tear down recognizers, tracks, timers and the meter on cleanup.
- Show setup microphone-test progress and results. The test explicitly distinguishes input detection from transcription availability.
- Replaced the active authored `Mm-hm.` acknowledgement with `Got it.`. Voice assignments and the TTS engine remain unchanged.

## Checks and actual limits

- `npm run test:hot-seat`: 29 tests passed, including 11 lifecycle tests with controlled recognition events/timers.
- Final production build passed, including TypeScript.
- Browser input test successfully detected actual microphone input and released it after three seconds. No audio recording was retained.
- In the conversation room, the mic entered Listening, explicit Finish stopped capture, switching to typing worked, and an unsent test draft survived pause/return to lobby.
- The embedded browser's speech recognition subsequently returned `network`. The UI displayed the precise service connection error and the error notification. No transcript was fabricated.
- **End-to-end spoken-word transcription has not been verified.** Input capture succeeds, but browser speech-service connectivity is a remaining environment dependency. Test in a normal supported Chrome/Edge window with microphone permission and a working speech service. A successful input-meter test alone does not establish transcription availability.
- No Gemini generation calls, model/provider changes, paid STT services, TTS fallback changes, quota resets, or latency claims were part of this repair.
- Test room was left paused in local history. Preview remains on port 3002 only.

## Browser API references checked

[SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition), [recognition errors](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionErrorEvent/error), and [start](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/start). Browser speech recognition has limited compatibility, and a network error identifies failure of the recognition service connection rather than proof that microphone hardware is unavailable.

The legacy `public/hot-seat/audio` caption manifest remains an archive for its original recordings. It is not used by the current neural-v2 speech adapter; changing its captions without rerendering its files would incorrectly label those recordings.
