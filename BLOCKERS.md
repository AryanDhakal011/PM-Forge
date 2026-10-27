# Blockers and Limits

Last updated: **2026-10-26**

This file lists what is missing, simulated, or deliberately out of scope. Nothing here is hidden behind marketing copy. Each entry states the impact, the current workaround, and what would actually unblock it.

## Summary

| Area | Status | User-visible consequence |
| --- | --- | --- |
| Blender / GLB source art | Missing | 3D scenes are procedural Three.js |
| Photography and art direction | Partial | One Pexels photo, two CC0 wood textures, CSS/SVG plates |
| Physical microphone and browser matrix | Untested | Mic paths are simulated in Chromium only |
| Server auth, database, sync | Not built | Profiles and progress are browser-local |
| Transcription / AI grading | Not built | Written answers scored by a deterministic rubric |
| Email and social channels | Not connected | Placeholder address; no social links |
| Deployment domain | Not provided | Metadata falls back to localhost |
| WebGL contexts | Not consolidated | Three R3F canvases plus the 2D wave canvas |
| Git repository / CI | Absent | No history, rollback, or automated checks |
| Legal review | Not performed | Privacy and terms are local-preview copy |
| Curriculum validation | Not performed | Lessons are original practice material, not certified training |

---

## B1. No Blender source or GLB assets

**What is missing:** A Blender file, exported `.glb`/`.gltf`, or any licensed 3D model for the hero Decision Engine or the learning paper cluster.

**Impact:** The scenes are built from React Three Fiber primitives, custom geometry, and canvas textures. They are real and interactive, but less sculptural than a purpose-built asset. Scene changes require code changes.

**Current workaround:** Procedural geometry in `src/three/`, deterministic materials, and a static poster fallback. The visual language uses paper, pins, and a board rather than photorealism, so the procedural look is intentional.

**To unblock:** Provide a Blender source plus an exported GLB with a documented licence, polygon budget, and material setup. Then add a `useGLTF` path with Draco/meshopt compression, preserve the poster fallback, and re-check initial load on mobile.

---

## B2. Limited photography

**What is missing:** A commissioned or licensed photo set for the project, interview, career, and learning plates.

**Impact:** Two photographs are used — a mountain image by Eberhard Grossgasteiger via Pexels (`public/assets/images/plates/final-mountains.jpg`) and a warm workspace plate whose provenance is unrecorded (`public/assets/images/plates/Cozy Sunlit Workspace Backdrop.png`). The wood surface uses Poly Haven's CC0 `wood_table_001` diffuse and roughness maps. Every other plate is a CSS/SVG composition. Four further candidate plates remain in the folder but are not referenced by the app.

**Current workaround:** Art-directed CSS/SVG plates that match the paper-and-ink system. They are original, lightweight, and licence-clear.

**To unblock:** Provide a photo set with signed releases, source files, and a written licence that covers web use. Update [`docs/ASSET_MANIFEST.md`](docs/ASSET_MANIFEST.md) and `public/credits.txt` before swapping anything in.

**Also missing:** The exact Pexels item ID/source page for the mountain photo was not preserved. The creator profile and Pexels License are recorded. If the image is reused commercially, re-locate the item page and archive the licence evidence.

---

## B3. No physical microphone test

**What is missing:** A real microphone, a real permission prompt, and a non-Chromium browser run.

**Impact:** The mic path is verified with a mocked `getUserMedia` and an oscillator stream: live level (28%), mute/unmute with `aria-pressed`, stop and track release, `NotAllowedError` fallback to text mode, and `NotFoundError` messaging with focus moved to the textarea. No physical device, Safari/Firefox prompt, iOS audio session, or Bluetooth switch has been exercised.

**Current workaround:** The interview lab always works in text mode. Audio is never recorded, stored, transcribed, or uploaded, so a failed mic cannot lose an answer. Dictation uses the browser's Web Speech API; where it is unavailable, the control reads “Voice unavailable” and text mode remains.

**Also untested:** Speech recognition language coverage, interim-transcript accuracy, and behaviour when the browser loses the speech service mid-answer.

**To unblock:** Test on Windows Chrome/Edge with a real mic, macOS Safari, Firefox, iOS Safari, and one Android browser. Check permission denial, “don't ask again,” device unplug mid-session, and Bluetooth switching. Record results in [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md).

**Deployment note:** `getUserMedia` requires a secure context. It works on `localhost` and HTTPS, but will fail on a plain-HTTP deployed origin. Serve over HTTPS.

---

## B4. No server auth, database, or sync

**What is missing:** An auth provider or password system, a database, server sessions, password reset, email verification, and cross-device sync.

**Impact:** “Sign up” creates a browser-local profile in `pmforge.user`. “Log in” matches an email against that local record. Clearing site data deletes the profile and all progress. There is no account recovery, and two devices cannot share state.

**Current workaround:** The UI, help page, privacy page, and README state that this is a local profile. The dashboard exposes reset controls. No copy claims account security.

**To unblock:** Choose an auth provider and database, define ownership and deletion, add server-side validation, rate limiting, session expiry, and a migration path for existing `localStorage` drafts. Do not enable public signup before privacy and retention are settled.

---

## B5. No transcription, recording, or AI feedback

**What is missing:** Speech-to-text, audio storage, a model call, and a labelled evaluation set.

**Impact:** The interview score comes from a deterministic seven-criterion rubric over the written answer. It rewards the presence of specific evidence (context, constraint, trade-off, metric, etc.), not semantic quality. A keyword-stuffed answer can score well. The hero says “Structured feedback,” not “AI-powered.”

**Current workaround:** The rubric is visible and explainable. The result names the missing criterion and gives a concrete improvement. Users can copy the result.

**To unblock:** Add a transcription pipeline with explicit consent, retention, and deletion; evaluate a model against human-scored answers; publish accuracy and failure modes. Until then, do not market the score as AI judgement.

---

## B6. No monitored email or social channels

**What is missing:** A real support address and any PMForge social accounts.

**Impact:** `hello@pmforge.example` is a placeholder and no inbox is monitored. The footer no longer links to social icons because those accounts do not exist. The only real destinations are in-product pages and the credits file.

**Current workaround:** Help and credits content lives in the app. The footer explicitly states that no social or mailing channels are connected.

**To unblock:** Provide a monitored mailbox and verified social URLs. Add them only after someone owns responses; otherwise the links become another dead end.

---

## B7. No deployment target or production domain

**What is missing:** A hosting decision, a domain, and `NEXT_PUBLIC_SITE_URL`.

**Impact:** `metadataBase` falls back to `http://localhost:3001`. Canonical and Open Graph URLs will be wrong in production if the variable is unset. The Open Graph image is a static generated PNG, not per-page art.

**Current workaround:** The fallback keeps local development correct; README documents the variable.

**To unblock:** Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin at build time, verify canonical/OG tags, and add the domain to any future auth or email configuration. Re-run the build after setting it.

---

## B8. No Git repository or CI

**What is missing:** Version control history, a remote, pull-request review, and automated checks.

**Impact:** There is no blame, rollback, or branch protection. A regression can only be caught by re-running the manual checklist. This document and [`DECISIONS.md`](DECISIONS.md) are the audit trail.

**Current workaround:** Typecheck and build are run locally; QA evidence is recorded.

**To unblock:** Initialise a repository, add a CI job for `npm ci`, `npm run typecheck`, `npm run build`, and a Playwright + axe smoke suite. Add the QA checklist as a release template.

---

## B9. Testing gaps

**What is missing:** Cross-browser runs, real screen-reader sessions, and automated regression tests.

**Impact:** All browser evidence is Chromium. axe reports zero violations at 390px and 1280px from the earlier pass, but axe was not re-run in the final layout-only pass, and axe cannot judge text over textures or gradients; those pairs were checked manually. No NVDA, JAWS, VoiceOver, or TalkBack session was recorded. No Safari/Firefox run exists. CLS was measured on the local production build (0.0215 at 1440, 0.0051 at 390), not on a throttled field connection.

**Current workaround:** Native semantics, visible focus, live regions, a shared dialog primitive, and documented manual passes.

**To unblock:** Run NVDA + Firefox, VoiceOver + Safari, and TalkBack + Chrome. Add Playwright keyboard tests for the signal card, dialogs, mobile menu, and blueprint validation. Record browser versions in the QA checklist.

---

## B10. Curriculum and claims are not validated

**What is missing:** Review by practising product managers, learning-outcome data, and certification.

**Impact:** The ten lessons are original practice material built around a judgment framework. They are not accredited, and no evidence shows they improve hiring outcomes. The site does not claim either.

**Current workaround:** Lessons are framed as practice with explicit principles, failure modes, drills, and artifacts. The interview rubric is described as structured, not predictive.

**To unblock:** Have three or more experienced PMs review each lesson, run a small pre/post study, and publish what changed. Keep the language at “practice” until then.

---

## B11. Legal copy is a local-preview draft

**What is missing:** Counsel review, a company entity, a data controller address, and jurisdiction-specific terms.

**Impact:** `/privacy` and `/terms` accurately describe the current local-only build, but they are not legal advice and may not satisfy a real launch. The privacy page correctly states that data stays in the browser and no analytics vendor is used.

**Current workaround:** Plain-language copy scoped to the local build; no claims of GDPR/CCPA compliance.

**To unblock:** Legal review before collecting any server-side personal data, adding analytics, or enabling payments.

---

## B12. Browser storage is fragile

**What is missing:** Durable storage, export/import of all state, and quota handling.

**Impact:** `localStorage` can be cleared by the user, private browsing, or browser cleanup. The blueprint downloads Markdown, but signal, project, interview, and career state have no export. Quota is typically a few megabytes; the current payloads are small but unmonitored.

**Current workaround:** State is versioned (`*.v1`), reset controls exist, and the blueprint can be downloaded.

**To unblock:** Add a full JSON export/import, catch `QuotaExceededError`, and consider IndexedDB if answer text or audio is ever stored.

---

## B13. Placeholder and fallback surfaces

**What is missing:** Real testimonials, customer logos, press, and social proof.

**Impact:** Those sections do not exist. The page argues from the product rather than invented proof. This is deliberate; see D11 in [`DECISIONS.md`](DECISIONS.md).

**Current workaround:** Working interactive sections and a documented credits page.

**To unblock:** Use only verifiable quotes with written permission and a link to the person. Never fabricate logos or metrics.

---

## B14. More than one WebGL context on the landing page

**What is missing:** A single shared WebGL renderer for the hero, signal instrument, and learning cluster (for example through drei `View`), plus disposal when a section leaves the viewport.

**Impact:** The landing page runs three React Three Fiber canvases at once (hero `DecisionEngine`, `SignalInstrument`, `LearningCluster`), plus the loading ripple during boot and the interview lab's 2D wave canvas. Each context carries its own GPU memory and draw loop. On low-end mobile hardware this is the most likely source of frame drops or a lost context; the page still degrades to posters when WebGL is unavailable.

**Current workaround:** Device-pixel-ratio caps, reduced-motion static states, procedural geometry with no external models, and poster fallbacks.

**To unblock:** Refactor the three scenes into one `Canvas` with drei `View` tracks (or another shared-renderer approach), portal each scene into its section, and pause rendering when a section is off-screen. Measure context count, GPU memory, and frame time on a mid-range Android device before and after.

---

## Before any public launch

1. Provide and verify the production domain; set `NEXT_PUBLIC_SITE_URL`.
2. Decide whether accounts are real. If yes, build auth, storage, deletion, and recovery before enabling signup.
3. Test the microphone on real hardware and at least Safari and Firefox over HTTPS.
4. Replace the placeholder support address or remove it.
5. Have privacy and terms reviewed.
6. Resolve the 3D and photography inputs, or keep the procedural/CSS direction and say so.
7. Add CI and a repeatable browser smoke suite.
8. Re-run axe at 390 and 1440 px, and measure CLS on a throttled connection.
9. Re-run [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) and update this file; do not carry stale “pass” claims forward.
