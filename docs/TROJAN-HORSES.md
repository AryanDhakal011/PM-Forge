# The Trojan Horses — completed simulation

Updated 4 November 2026. Entry: `/app/projects/trojan-horse`; direct play alias: `/app/projects/trojan-horse/play`.

The previous scene runner ended at the first public-message consequence. Its sound control did not play recordings, resume restored only an index, and the payout sliders were disconnected from the legacy outcome engine. The active route now uses a complete, deterministic 19-beat simulation in `src/lib/trojan-horse/simulation.ts` and the componentized scene runner. The older `TrojanHorseExperience`/`engine.ts` prototype is not mounted by either route.

## Player flow

1. Choose recorded voices or captions; optionally enable Calm effects. Enter or resume. A Projects card opens with GSAP Flip; modified clicks retain native link behavior.
2. Party cold open: fivefold signup growth, finite Canvas confetti, sequential Kavya/Dani dialogue. Skip stays available.
3. Compare $120k on stage with $410k in the payout ledger: $290k in circular rewards was omitted.
4. Place Ana/Ben in Pay once, Pay twice or Don't pay. Every option immediately explains what it means. No choice is treated as proof of fraud.
5. Meet your role and finance/growth/CEO partners. Answer Kavya; exact words enter the case file.
6. Spend three evidence pulls across seven reports. Rereading is free. Each report has an immediate recorded character reaction and persistent evidence receipt.
7. Use the Loop Lens: devices, purchases and location reveal useful patterns. Account age consumes an inconclusive check. Repetition never spends twice. Chips, graph drop target, tap and keyboard alternatives provide the same findings. The lens ring follows the pointer and supports arrows.
8. Adjust reward, circular multiplier, per-account cap and vesting delay. All four change the real forecast. Committing advances a week; adjusting does not.
9. Hear the first consequence. Choose exact public wording, then receive Tomas's Guild call. Guilds represent businesses, repeat purchases and signed promises.
10. Assign Fraud, Gamers and Guilds to Cut, Sunset, Keep or Formalize. Drag, select/tap destinations and native keyboard menus are equivalent. Shares apply to the **$290k circular pool**, not all payouts; the three groups total 100%.
11. Set notice in the Grandfather Gate. Review all policies, the earlier promise, burn, runway and partner trust on one confirmation. Change something or Lock it.
12. Hear Dani acknowledge the flawed growth claim. Compose reason, tone, channels and rollout timing. The announcement preview and community feed use the actual selected inputs.
13. Screenshot Hunter compares the exact saved promise with actual rollout/notice. A contradiction produces a real trust penalty; acknowledging it softens the consequence.
14. Publishing advances four weeks. The palette and original sound bed drain to the hangover treatment. Hostile/abrupt policies can trigger revolt. Low runway triggers a $2M bridge for 8% dilution; healthy paths avoid it.
15. Allocate one recovery team to community, partners, finance, or a split. The resulting trust changes are explicit before committing.
16. Debrief starts with a short causal conclusion and outcome readouts. Before/after graph slider, visible expandable evidence tells, decision receipts and reflection follow. Gardener requires cutting fraud, formalizing Guilds and keeping relationships healthy.
17. Finish a specific reflection; export JSON or return to Projects. Hindsight creates a separate run, clears later choices and preserves the original. Preserved originals can be reopened from the entry screen.

## Presentation and accessibility

- PMForge typography, muted plum workspace, brass primary actions, separate voice utilities, visible progress and Goal strip. Desktop debrief widens to a readable conclusion rather than another narrow tool rail.
- All six characters have distinct static SVG portraits, readable at avatar size. Only Neutral, Thinking, Annoyed and Approving are displayed. No speaking-mouth animation.
- 45 caption-matched MP3s are prerecorded. Captions always remain visible; there is no timed auto-advance. Replay and pause operate on the current clip. Missing/blocked audio never blocks progression.
- Voices use existing Kokoro production tooling and distinct cast presets. Emotion directions affect pacing/pauses; these are synthetic recordings, not human actors or native acted-emotion synthesis.
- Six original offline-rendered WAVs provide party/hangover ambience and subtle cues. Ambient sound ducks beneath dialogue and pauses on hidden tabs or overlays. Sound defaults off and is remembered.
- Reduced motion removes particles/movement. Calm effects is separate and persistent. There are no continuous visual animation loops, strobes, or full-screen shakes. Confetti is finite and never restarts after pausing the same beat.
- GSAP animations live inside component-owned contexts and revert on cleanup. Current scene timeline names are inspectable with `window.__trojanMotion.names()`; `finish(name)` is available for QA. The registry is removed on navigation.
- The loading boundary shows a constellation and a two-second warming-up label. The error boundary uses this installed Next version's `retry` API. Both cover the viewport before content is available.
- Standard PMForge `Dialog` handles Escape, focus trapping and restoration. The level uses z-index 80 so dialogs at 90 remain physically clickable. Gate perspective is bounded and clipped.
- Mobile keeps cash, runway and relationship readouts visible, uses full-width tools and has no hover-only instructions. A polite live region announces decisions and discoveries.

## Model and storage boundaries

This is an authored training simulation, not a calibrated business forecast or a score of free-text judgment. Overhead, payout response, lost Guild revenue, notice/rollout costs, trust changes and the bridge threshold are explicit deterministic rules. Weekly cash consumption includes the committed first three weeks and the following four policy weeks. No numerical candidate score is shown.

Local storage is optional. Corrupt saves are validated; absence of storage starts a fresh run. Saving occurs after hydration and only for an entered run, so loading the entry cannot overwrite an existing save. Storage failure offers export; a fork is refused when the original cannot be archived. Existing v1 prototype saves are left intact rather than silently mapped to incompatible new scene semantics. Runs remain local and are not account/cloud synced.

## Design reference and verification

Consulted the **Subframe MCP Motion Library**, searching for constellation/dashboard transitions and reading [Allocation ring](https://www.subframe.com/motion/allocation-ring) for meaningful animated data, selection feedback and reduced-motion parity. The implementation is original SVG/GSAP; no Subframe example source was copied and no Subframe project canvas was edited.

Commands:

```text
npm run test:trojan-horse
node --import tsx scripts/check-trojan-horse.ts
npm run build
PRODUCT_URL=http://localhost:3002 node scripts/verify-trojan-horse.mjs
```

The build verifies every voice caption/file; CI runs the simulation tests. **115 automated tests passed** across product/account, Ghost Metric, Sacred No and the new 14-test Trojan suite. **91 browser assertions passed**, using a disposable Chrome profile, real rendered controls, 320/390px layouts, actual audio playback and the complete Gardener path. The hostile branch also produced a real screenshot contradiction, revolt and emergency financing. QA checks resume, reflection, archive-preserving forks, reduced motion, unavailable recordings, modal hit targets and twenty soft navigation cycles. After those cycles, global listener counts were identical and no audio elements remained. Total DOM counters are recorded as diagnostics rather than used as a proxy for owned listeners. **313 route responses and 111 asset responses** returned 200 from the verified production build. Reports and representative screenshots are in `docs/trojan-horse-verification/`.

The addendum's precise mid-mobile p95 frame-time targets have not been certified on physical devices. This delivery uses a small SVG graph and finite Canvas2D particles instead of a continuously rendered WebGL scene. The handoff's exact cinematic choreography (including reverse card Flip, an automatically timed 20-second alternate montage and all 26 developer-triggerable timeline names) is not claimed: replay is an explicit interactive branch, and the registry exposes implemented scene timelines. Real-user playtesting and acted voice review remain useful follow-up work.
