# Hot Seat latency — measured versus unverified

9 November 2026. No hosted premium voice stack or pilot load was available. All numbers below are local checks, not p50/p95 service guarantees.

| Path | Actual result | Interpretation |
|---|---|---|
| Authored 3.97-second speech → Whisper tiny.en q8, Node CPU | 1,594.7 ms inference; 6,345.6 ms initial load | Exact public preview recognized with 0 WER; not browser/WASM |
| 60-second real capture → browser on-device recognition | 23.3 seconds | Target missed. Background audio quality poor; obvious repetition now rejected |
| Local cached introduction → playback scheduling | 173 ms for the first measured Nora introduction; 51 ms cached nudge and 70 ms device replay (individual local samples) | Scheduling is not first physical speaker sound; no percentile/load claim |
| Post-pause Sarah preview on the final build | 1,593 ms scheduling; AudioContext running | Recovery works, but device resume adds latency; not a speed-target pass |
| Premium EOT → first sound / T0–T8 | Not measured | Requires configured providers, regional host, actual playback anchors and capped live load test |
| Banked/spliced premium turns, barge-in, cold-start, restrictive TURN | Not measured | Not implemented/tested sufficiently to claim requested targets |

## Implemented improvements

Session entry no longer awaits the 90 MB live TTS model. Predictable local introductions, samples and a few system lines use an exact-text/voice/profile matching WAV cache. WAV files are hashed with immutable headers; the manifest has a short TTL. Existing browser audio keys now include model/dtype/settings so older clips cannot masquerade as the new profile. Uncached speech still requires local synthesis and may be slow. Interrupting pending synthesis now terminates its worker so it cannot keep competing with local recognition; idle warm workers are retained. Explicit playback gestures resume the audio device after pause, with bounded error recovery if the browser blocks it.

Local playback emits metadata-only `pmforge:voice-timing` and a debug timing entry: path, requested-to-scheduled delay, device-reported output latency and AudioContext state. It does not log the spoken text. Worker recognition returns actual inference time shown in the UI. Premium server metrics already record selected provider stages, but complete synchronized OTel T0–T8 spans/dashboard/alerts and nightly regional synthetic audio are still missing. Never sum unrelated server/client clocks.

## Requested targets

The supplied 400/800 ms entry, 300/500 ms acknowledgement, 700/1,100 ms banked turn, 700/1,200 ms splice, 1,200/2,200 ms generated turn, mic 50/100 ms, release 100/200 ms and barge-in 150/250 ms p50/p95 targets are **unverified**. No controlled before/after baseline was available and no fabricated baseline is supplied. The local ASR result explicitly misses realtime expectations. Cache rendering removes inference from matching lines; it does not make an uncached conversation instantaneous.

Next: run the fictional 10-answer suite on a configured staging worker from Singapore and Kathmandu, at an agreed load and approved spend. Record actual quotas, bytes/tokens, cache hit rate, browser first-frame anchors and failures. Do not use hedged/speculative paid requests without a separately approved budget.
