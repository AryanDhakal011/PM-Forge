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
