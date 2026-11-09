# Voice bake-off — honest baseline

9 November 2026. **No live bake-off has been run. No provider is a measured winner.**

| Candidate | Verified integration evidence | Account access | Kathmandu / worker p50 / p95 | Listening / failure / cost result |
| --- | --- | --- | --- | --- |
| Inworld TTS-2 | Official Node plugin and stream types; provisional reference adapter compiles | Missing | Unmeasured | Unmeasured |
| Kokoro GPU | Existing browser WASM path is not a GPU baseline; no GPU endpoint deployed | Missing endpoint | Unmeasured | Existing Bella/Sarah preference is user feedback, not a blind panel |
| Eleven v4 Turbo | Official model docs confirm `eleven_v4_turbo` and Text-to-Dialogue WebSocket; no adapter selected | Missing | Unmeasured | Unmeasured |
| Cartesia challenger | Not yet verified/implemented for this comparison | Missing | Unmeasured | Unmeasured |
| Gemini TTS reference | Not used for realtime or benchmarked in this change | Existing text key is not speech access approval | Unmeasured | Unmeasured |
| Cerebras gpt-oss-120b | Installed official LiveKit plugin and streaming types; provisional reference | Missing | Unmeasured | Human follow-up review pending |
| Other LLM shortlist | No account entitlements or comparative evaluation | Missing | Unmeasured | No winner selected from blog numbers |
| Flux / alternative STT | Flux STTv2 compiles; alternative STT adapters not selected | Missing | Unmeasured | No consented accent corpus or WER result |

The handoff's published model speeds, Elo scores and cost estimates are hypotheses to test. They are not copied into PMForge performance claims. The older user preference for two female voices takes precedence over the handoff's three-persona script: Ellis is not reintroduced. “Mm-hm” is replaced by spoken words such as “Got it.”

## Reproduce the independent preparation

From `services/hot-seat-agent`, run `node --import tsx src/bakeoff.ts`. This writes a review sheet under `reports/` with 24 fictional interviewer lines and 10 fixed candidate answers. It makes no provider calls and contains no synthetic latency numbers. Audio/metrics outputs are ignored by Git until an operator explicitly reviews permitted test artifacts.

The initial **primary-TTS-only** smoke measurement is opt-in using `--live`, a separate positive `PMFORGE_BAKEOFF_APPROVED_USD`, `INWORLD_API_KEY`, `PMFORGE_BAKEOFF_VOICE`, `PMFORGE_BAKEOFF_LOCATION`, and a run count capped at 30. It uses the plugin WebSocket stream and records first audio-frame time. That is not end-user first audible playback. It does not select a comparative winner, run a blind panel, evaluate STT, or establish LLM quality. Review current account prices before invoking it; its budget precheck uses the documented on-demand TTS-2 rate as a planning estimate.

## Required completion procedure

Deploy in the intended region, then run independent measurements from Kathmandu and that region. Complete 30 TTS trials/provider, 50 timed LLM trials/model, and the ten interview cases with human ratings. Use the fictional 24-line script for a shuffled, blind panel of 8–10 target listeners. Collect a separately consented/licensed 20-answer accent corpus with ground-truth text and PM vocabulary; never scrape or repurpose production transcripts.

Keep training material separate from evaluation samples. Record exact model/voice/version, account tier, region, warm/cold status, failures, first frame, first audible playback, duration/RTF, usage, rate snapshot, naturalness, robotic rate, trust, WER, and human follow-up/grounding judgments. Commit only authorized fictional samples and reviewed aggregate results. Do not fill missing columns with mock output, vendor claims, or model self-scores.

Success gates remain those in the supplied handoff: naturalness ≥4/5 and robotic rate <15%; deployment TTS first-audio p95 <400 ms; full conversational first-audio p50 <1.5 s/p95 <3 s from Kathmandu; barge-in <250 ms, caption alignment within150 ms, failure/connection limits and 2×-peak load proven. All currently remain **not measured**.
