# Hot Seat failure and recovery log

- Neural initialization failed with `_OrtGetInputOutputMetadata is not a function`: the prebundled Kokoro browser library required ONNX 1.22.0-dev.20250409-89f8206ba4, not 1.21.0. Pinned the matching runtime, rebuilt assets, and verified ready + actual speech playback.
- Arrival animation retained a clip path around a zero-height parent of the fixed room, hiding it visually while leaving accessible text. Removed the retained clip path and moved the active room to a body portal. Browser screenshot confirmed the room and working Send.
- Repeated silence reminders could loop: limited reassurance to once per prompt.
- Enabling voice used the prior disabled state: explicit playback bypass now honors the enabling click.
- Pause during synthesis could resume an AudioContext: paused state now survives late synthesis completion.
- Duplicate completion readout removed. Optional server speech cache now encrypts audio, not plaintext.
- Default Python 3.13 could not load the existing 3.12 offline voice dependencies. Used the existing isolated Python 3.12 runtime to render only fictional static lines; no deployment Python dependency.

No real user transcripts were used as training/evaluation examples. Offline checks reject unsupported IDs, invented numbers/quotes and early closes, but cannot guarantee semantic truth for every novel output. Expert review and multi-browser speech validation remain launch checks.

- Final production recovery walkthrough caught the resume caller converting a completed local session to paused before merging. Completed reviews now bypass active-session recovery; reopening and returning from Review were verified in the browser.
- A body-ported room at z-index 150 obscured shared dialogs at 90. The room now uses 60, above workspace chrome and below dialogs; a screenshot and hit-target check verified the visible End and review button receives pointer input.

Final verification: 11 Hot Seat tests, 22 existing AI tests, 52 general/account tests and 28 offline evaluation checks passed. Type checking and the final production build passed. Production dependency audit reported zero known vulnerabilities. Current preview is the verified final build on port 3002. No live speech API or paid service was called.

## Device-speech and recovery update

- Browser speech previously chose the same first English voice for every persona. Nora/Kai now resolve stable, separate installed voices where available; stale callbacks cannot overwrite a new preview. Ellis is retired for new sessions and retained only for save compatibility.
- Removed engine choices and the model-download requirement. Removed 37 packages; standalone output excludes archived neural speech assets.
- Missing-profile signup inherited a fixed, overflow-hidden onboarding wrapper. It now has its own naturally scrollable entry layout. Shared counted scroll locks avoid stale locks after auth navigation or storage loss. Departed Hot Seat instances do not flush their old transcript back into a cleared identity.
- Fixed mobile one-column choice overrides and wrapping action labels. Shared choices area has no inner scrollbars; primary action positions differ by no more than one pixel across the three exercised steps at 320/375/768/1024/1440 widths.
- Persistent dismissible popups cover blocking alerts, recognized legacy failure statuses, explicit AI timeout/network failures and unexpected errors. A deliberately malformed local backup was rejected before import and produced the visible popup; no workspace data was imported or deleted.

## Restore natural female speech

The browser/device voice simplification was a product quality regression. Restored Kokoro with Nora=af_bella and Kai=af_sarah; retired saves use Bella. Browser speech and automatic paid speech substitution are removed from the playback adapter. The cache namespace is now kokoro-female-v2 with actual voice ID and exact text. Old mixed/incorrect clips are not reused. Preview captions, model voice IDs and distinct mono 24 kHz audio are checked in tests.

Browser verification: both neural previews played; the matching WASM runtime prepared; a new, non-preview Sarah interview opening was synthesized, replayed with measured nonzero audio levels, paused and resumed. First WASM synthesis was slow on this device, so no realtime latency claim is made. No further Gemini inference or paid speech service was invoked. The 18 Hot Seat tests and production build pass; production dependency audit reports zero known vulnerabilities.
