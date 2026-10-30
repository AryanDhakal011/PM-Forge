# Deadlock prototype: decisions, conflicts and unfinished acceptance work

Source: `PMForge_Deadlock_Prototype_Handoff_v1.txt`, dated 30 October 2026. The supplied cast, company, narrative, starting variables and decision rules were adopted for this prototype. No founder approvals, external reviews or playtest results are implied.

## Rule conflicts and interpretations

1. **Veto is unreachable under the specified exposure sets.** Exposure R = D1+D2+D4 and exposure S = D2+D3+D4, so their difference is always −1, 0 or 1. The required difference ≥2 cannot occur. The engine retains that exact rule, with defensive unlock handling; it does not invent another exposure mechanic.
2. **D3 has conflicting arithmetic in §6.4.** The prose says +6h followed by −3, but the explicit net expression says +3h−3. This implementation uses the explicit net expression `3h − 3`, rounded half up after the event. D4 uses `4h − 3` for Software, as supplied.
3. **Interventions count supervision twice in §7.2.** Each intervention adds one immediately; the final adjustment adds the number of interventions again. Both supplied operations are implemented. This materially affects the balance distribution.
4. **Intervention recovery/learning bonuses are underspecified.** An intervention prevents the event's incident/failure, pays its stated Wow cost and adds supervision. It does not also earn the autonomous recovery/learning bonus for the step the player handled. Normal run bonuses apply to LET IT RUN. This follows the explicit PAUSE/manual-clear example.
5. **No 0.8 m/s stopping-distance measurement is supplied.** D3's values are 0.5, 1.0+curtain and 1.2. The UI shows `? · 0.8 m/s was not tested`, even after D3; acceptance and incident rules still use the supplied ≤0.8 threshold. E-stop latency is also shown as unmeasured, rather than invented.
6. **Software-only agreement cannot truthfully say “both signed.”** With Dev absent, the scene uses Ines's authored acceptance line, and Dev's reaction lines are suppressed. The normal two-signature line remains for two present, accepting leads.
7. **Focus reservation needs an event before the evidence is pinned.** `BEGIN_INSPECT` reserves a bolt on the first manipulation. Closing before touching costs nothing. Closing afterward retains an unfinished inspection; reopening it is free, and other objects cannot consume its reserved bolt. `INSPECT` pins the completed evidence. This closes the free-browsing loophole without adding a new resource.
8. **Runway below two is unreachable from the default budgets.** The engine preserves both the two-week proposal reserve and the Quiet Room runway check. Quiet Room is reachable through readiness; the prototype does not introduce an unmentioned runway penalty to make the other branch occur.

9. **Auditor watch runs after the second projection only.** Adjourning with zero or one dataset does not trigger the flag under the supplied rule. This loophole is retained rather than adding an unannounced penalty.

## Balance gate: not passed

`docs/deadlock-verification/simulation.json` records 200,000 seeded policies using the unchanged supplied numbers. All six endings and all six archetypes are reachable. INFORMED reaches Shared Ground; BOLD reaches Standing Guard; LEAN reaches Steady Hands; AVOIDANT reaches Quiet Room.

Three requested distribution checks fail under the documented sampling policy:

- Shared Ground: **0.0075%**, below the requested **0.2%–4%**.
- Standing Guard: **0.2615%**, below the ordinary-ending minimum **3%**.
- Steady Hands: **2.981%**, just below the ordinary-ending minimum **3%**.

Babysitter dominates at 82.195%. Quiet Room is 10.241%; Fracture is 4.314%. These are results of a specific reproducible policy generator, not estimates of human outcomes. The final sampler includes available Forge defenses, independent second proposals, and equiprobable available push/revise and run actions. The earlier diagnostic sampler is retained separately as `baseline-simulation.json`; its rates must not be substituted for the final report. No knobs have been silently changed to make the report green. `npm run deadlock:sim` intentionally exits nonzero when its distribution gate fails. Tuning and human playtesting remain acceptance work.

## Deliberate implementation boundaries

- The existing Next.js repository remains one application. The pure engine lives in `src/lib/deadlock`, shared stage/audio helpers in `src/components/deadlock`, and the eleven content files in `content/projects/deadlock`. No second app/monorepo, Zustand store or duplicate IndexedDB library was introduced; React and the existing Dexie dependency provide UI and persistence.
- Boiler-room plates, avatars, instruments and arm rig are original code-authored SVG/CSS placeholders, as permitted by §13.6. There is no Blender file or pre-rendered panorama. Camera pans, room grading, needles/trails, paper states, chart reveals and arm motion are implemented. The full specified steam/shimmer/shatter effect library and final cinematic art pass are not complete.
- Sound uses procedural WebAudio and optional device speech. The settings name actual device voices. Kokoro weights, studio recordings, three narrator recording sets and fake audio files are not shipped. The manifest explicitly records `not-rendered`; no model/voice license or listening test is falsely claimed. Final recorded dialogue, separate character volume, focused-option narration, full ambient stem/effect matching and word-timed caption polish remain.
- Events save locally after every act, with revision conflict protection, original-preserving forks, a six-branch limit, explicit export and memory fallback. **Deadlock logs are not yet part of account cloud sync or the general workspace backup/import.** Export them from the simulation. No migration rewrites old project history; old Deadlock decision-form URLs redirect to the new entry.
- Transcript metadata and optional notes are device-local. Echo prompts are saved as data only. The progression layer does not award generic project completion/XP for this prototype; the hub reports its own saved simulation status.
- The content version is pinned to 1.0. Future rule versions must preserve this reducer/content as an immutable version; do not change saved runs by editing v1 rules in place.

## Acceptance still requiring external validation

Physical Android/iOS and Safari/Firefox testing; actual screen-reader walkthrough; real device voices/audio routing; total process-memory profiling; cinematic-marker timing within ±150ms; recorded milestone videos; cross-device sync/merge; and the six-to-eight-PM experiment. The production component-boundary compressed budgets pass (see `DEADLOCK_QA.md`); total cold-page transfer and final art/audio budgets still require measurement when those assets exist. Browser emulation and screenshots do not substitute for those checks. The playtest packet is prepared in `DEADLOCK_PLAYTEST.md`; no participants have been recruited or messaged.
