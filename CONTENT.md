# Hot Seat content and speech

Edit fictional companies, persona text and opening variants in `src/lib/hot-seat/content.ts`; deterministic turn rules live in `model.ts`. Version prompts independently in `src/lib/hot-seat/realtime/config.ts` and the prompt module. Never reuse personal transcripts as training examples without explicit licensed consent.

`npm run hot-seat:audio:build` renders the currently authored local lines in Bella and Sarah using Kokoro-JS 1.2.1, q8, speed .98, 24 kHz mono. It downloads public model weights and consumes local CPU; it does not call a paid speech API. It is intentionally not run during every CI build. Commit hashed WAV assets and the generated manifest together. `npm run hot-seat:audio:check` verifies hashes and PCM structure. Listen to at least 10% of changed clips before release. Automated pronunciation/WER and LUFS QA are not yet implemented.

The local library is not compatible with configured Inworld speech. Never splice these voices. Future premium cache generation requires a separate exact provider/model/voice/settings fingerprint and an approved budget. The requested 630-clip premium library and opener-splice grammar are not implemented by this smaller local library.

Model/runtime notices are copied by `scripts/setup-hot-seat-voice.mjs`. Local dictation uses the MIT-licensed Whisper tiny.en checkpoint, pinned to revision `2575352d61be1bf7225cf8f8b268a4678025fc58`, through Transformers.js 3.8.1. First use downloads model files from Hugging Face after the user's explicit choice; inference runs on the device. Check current model cards and licenses before commercial redistribution.
