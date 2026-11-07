# PMForge interview experience

The supplied contract is preserved verbatim in `PMFORGE_INTERVIEW_LIVE_HANDOFF.txt`. This implementation adds a conversational room to all 63 briefs while retaining their workbenches, evidence allowances, decision records, and weighted scoring. It does not represent expert review or participant success criteria as completed.

## User experience

The interview has three persistent macro phases: Framing & Discovery, Solution & Defend, and Synthesis & Feedback. Detailed stages remain within these phases. A continuously available interviewer pane accepts voice or Fast-Typing input. Enter commits a thought, Shift+Enter inserts a line, and Esc cancels an uncommitted thought. Markdown emphasis is previewed safely. The candidate's words are not overwritten by structure assistance.

New runs start in voice mode with an explicit microphone/transcription consent and a three-second local input check. Typing is available immediately without microphone consent or a speech-provider account. Existing runs receive a backward-compatible live session in typing mode when opened. The first guided run stays shortened.

The interviewer uses 63 individually authored probes plus bounded assertion triggers for recommendations, metrics, segments, and ownership. The optional Interview Mode tightens the soft timebox and permits more follow-ups. A Pivot Bell/caption identifies an interruption. The main candidate clock and workbench pause until the candidate chooses Defend, Adjust, or Pivot and gives a response of at least eight words after at least twenty seconds of consideration. Response drafts, interruption state, and resolved responses survive reload. This is an authored, keyword-driven interviewer, not unrestricted LLM conversation or an official employer interview.

The workspace saves committed actions immediately and typing drafts after a short debounce. A resume panel in the library opens the exact saved run. Existing revision-conflict and snapshot recovery remain in place.

## Speech and privacy

`/api/interview/voice` reports capabilities without exposing keys. Optional Deepgram Nova-3 handles short independent audio chunks, with filler preservation and domain keyterms. Original recognized tokens and punctuated display text are retained separately. A curated 390-term vocabulary is content-owned. Scenario-relevant requests select up to ninety terms within a conservative character budget rather than exceeding the provider's documented keyterm token limit. The browser speech fallback uses phrase bias when the browser supports it; it cannot promise equivalent jargon accuracy or filler preservation.

Microphone analysis is local. A silent test warns after three seconds; active practice also warns on prolonged near-zero input. After 3.5 seconds of speech inactivity, a non-punitive wrap-up prompt appears. Provider upload failures and unsupported browsers offer typing; existing text is retained. Silent chunks are not sent for cloud transcription. Pausing or spoken interviewer playback stops candidate capture; starting capture again is an explicit action. Tracks, recognition, timers, workers, object URLs, and audio contexts are cleaned up.

Cloud speech is disabled by default. To enable it, configure these server-only environment values and restart:

```text
PMFORGE_VOICE_ENABLED=true
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
```

Browser speech/captions and typing remain available without those keys. ElevenLabs provides optional natural interviewer audio; browser synthesis/captions are the fallback. Origin checks, bounded request bodies, rate limits, short timeouts, explicit consent, and no-store responses apply to voice requests. No transcript logging is added to the API.

Recording is separately opt-in. Audio clips live in a dedicated IndexedDB table, have playback/download/discard controls and a per-run storage cap, and are deleted when the local profile is cleared. They are not included in cloud sync or JSON workspace backups. Conversation and outline text are excluded from account sync unless the candidate opts in; explicit local workspace exports retain them. Existing structured story and decision fields retain their established save/sync behavior. A Portfolio save explicitly copies accepted outline notes into that decision record.

Provider references: [Deepgram keyterms](https://developers.deepgram.com/docs/keyterm), [ElevenLabs speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).

## Structure assistance

RCA, Product Sense, Strategy, Metrics, Estimation, AI/Technical, and Behavioral each have a native framework. Raw words and the candidate's outline appear side by side. Literal support checks flag absent sections and wording absent from the source. These checks are conservative text checks, not factual or semantic verification.

Easy exposes a complete category framework with instructional placeholders and source-linked population. Medium exposes the skeleton and only fills explicit candidate statements. Empty sections stay empty. Hard and Interview Mode disable generation and permit one ten-second, read-only scaffold glance; the candidate organizes their own notes. Acceptance saves a separate outline. Generation and edited/unedited acceptance are recorded as local experience events.

## Category reality checks

- RCA requires two clarification topics before paid evidence. Topics can be selected or detected from explicit spoken/typed questions.
- Easy warm-ups are category-specific rather than the former shared three questions.
- Strategy requires a numerical baseline market size and an explanation of its population/assumptions.
- Metrics requires a counter-metric, responsible team, and consideration of second-order harm; primary-metric selection triggers a follow-up.
- Hard Product Sense requires a defensibility response after a competitor copies the feature.
- Estimation adds a safe arithmetic scratchpad, percentages/magnitude notation, unit checks, and a sanity check. It retains the existing dials. An optional local OCR worker reads a single-line handwritten equation and requires explicit verification before use. The drawing is saved locally when within the bounded note size. Printed-equation fixture recognition is tested; varied human handwriting accuracy is not certified.
- AI/Technical adds model tiers with clearly labeled illustrative cost/latency floors and an explicit defense. These numbers are exercise constraints, not vendor benchmarks.
- Behavioral highlights sentence-initial “We” and prompts for specific ownership without treating that pronoun as proof of dishonesty.

## Feedback, replay, and next steps

The existing numerical rubric is unchanged. Voice delivery contributes no scoring bonus or penalty. Timed voice transcripts support approximate words/minute, early-recommendation markers, pronoun balance, possible filler density, and guardrail signposts. Without timed voice, the UI declines to infer pacing or spoken quality. Pacing/filler references are practice heuristics, not validated hiring cutoffs. Replay retains raw words, punctuated/edited versions, outline, and optional local clips.

Self-calibration flags large positive deltas against recorded coverage as potential blind spots, without changing the user's self-grade. Expert traces and alternatives remain authored and retain draft/expert-review-pending labels. Targeted retries explicitly name the weak dimension and require a new check; they remain full scenario retries with a focus, not automatically generated remedial lessons. Next-scenario suggestions stay within the category and adjust suggested level using the provisional band. Users can save/edit/copy/download/print a Portfolio decision record.

## Verification and remaining evidence

Commands:

```text
npm run test:interview-live
npm test
npm run typecheck
npm run build
node --import tsx scripts/verify-interview-live.mjs
node scripts/interview-experience-report.mjs path/to/workspace.json
node scripts/interview-experience-report.mjs path/to/workspace.json path/to/stt-benchmark.json
```

The experience-report tool produces aggregate signals without printing conversations. An optional STT corpus must provide human reference, generic-provider transcript, and domain-provider transcript from the same audio. It does not generate an accuracy result without samples.

Automated verification includes original scoring regression tests, new save/structure/gate/privacy/provider-contract tests, completion paths for every brief, local OCR, browser microphone fixtures, mobile overflow, accessibility scans, interruption recovery, voice diagnostics, and typing fallback. Browser fixtures use synthetic audio, not the operator's microphone. Provider contract tests use mocked upstream responses; no cloud credentials are configured in the local preview.

Recorded checks: the original suite passed 50 tests; the live-interview suite passed 19 tests, including a completion sweep of all 63 briefs. The browser run passed 73 checks, 10 WCAG A/AA scans, and 17 desktop/mobile captures, with no console errors. It exercises silent and audible synthetic inputs, mid-rep silence, local clips, OCR, real save/reload, a pending twenty-second response, continuous spoken interruption defense, late-transcription draft preservation, Hard-mode outline replay, failed STT upload, typing recovery, replay diagnostics, and the resume panel. Production build and TypeScript compilation pass. The CI workflow is configured to run both interview test suites and upload browser evidence from `docs/interview-live-verification/`.

Natural cloud speech still requires the environment configuration above. Live provider end-to-end accuracy, varied speech/accent and handwriting trials, Safari/iOS/Firefox testing, manual screen-reader testing, and real candidate realism/completion/drop-off measures remain external validation work. The >80% spoken completion target, improved jargon accuracy, and reduced abandonment are not claimed from implementation tests. All 63 content briefs remain draft pending the existing expert-review process.

Subframe MCP inspiration was consulted (Office Commun's quiet editorial layout). Existing PMForge Inter and DM Serif Display typography and interaction conventions were preserved. No Subframe project was modified or external site published.

Final local preview: `http://localhost:3002/app/practice`, pinned to production build `Zq77vHH8AUwRY19ZEXt_o`. Cloud speech capabilities report disabled until provider configuration is supplied. No external deployment or commit was made.
