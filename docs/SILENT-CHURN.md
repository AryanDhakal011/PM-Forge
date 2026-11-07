# The Silent Churn

The Silent Churn is a standalone PMForge project at `/app/projects/silent-churn/play`. Meridian Mutual, its people and its customer data are fictional. The player has 21 working days and five attention points per day. The clock advances only when closing a day.

## Player journey

1. Choose Guided, Standard or Sharp, plus sound or captions. Enter a staged office introduction, sort one lost account as a hypothesis, meet Elliot, then try Request, Rapport, Pre-wire and Answer in a Day Zero sandbox with no campaign cost.
2. Meet the committee and Marta, then use the desk. Quick, Standard and Deep requests differ in sample coverage, confidence, wait and access; at most two run at once. Ask any of eight people about six topics, build rapport with Marta or Tobias, inspect the inbox and use owned findings to name a pattern.
3. In the coalition, inspect the declared influence links, listen before pitching, bring concern-matched evidence or offer costed concessions. Build a five-block pre-read with one or two owned cards per block, then enter three committee beats. Bypassed executives bring more objections. A mismatch remains recoverable and appears in the decision log.
4. A mandate allows 5%, 20% or 100% scope. Lock a specific method, start day, five-day window and rollback boundary. Friday freezes phased or batch changes. Incidents use a saved seeded risk draw; prior disclosure, rollback and isolation change the actual response. Promises are checked against delivered scope and method.
5. The Quarterly Review shows the player's 26-week modeled trust and churn curves next to full seeded Coalition-first and Bold replays. It traces receipts, numeric before/after values, broken promises and a short reflection. A completed reflection can be exported with the run. A separate balance log exports only choices and numbers.

The pre-read's numeric figure is **artifact coverage**, not a calibrated candidate ability score. Recovery curves are model projections, not observed client outcomes. Eight portraits have static neutral, thinking, annoyed and approving expressions; voices do not drive mouth motion. The ledger illustration uses one 2D canvas, pauses in a hidden tab and does not represent acquired evidence.

## Content and audio

The source of truth is `content/silent-churn/`: eight people, 48 topic records, eight dataset families loaded by chapter, 11 commitments, 25 objections, 32 conditional events, 19 scene records, three mood templates and 151 short dialogue lines. Pre-rendered Kokoro recordings are shipped with matching captions and a licence under `public/projects/silent-churn/audio/`. The engine never synthesizes speech at runtime. Dynamic figures and the player's own words appear as typed follow-ups. The voices are synthetic and not acted human performances.

Subframe MCP inspiration was consulted before design: Griffin's institutional editorial style and the animated-beam, proposal-ledger, expandable-ledger, seat-picker and chart-crosshair examples. The PMForge layout and assets are original; no example code was copied.

## Saves and limits

Local saves use a versioned checksum with pending and last-good records. They are limited to the `pmforge.silent-churn.v1` namespace. Exported run backups **include the player's written headline, reasons and reflection**. The separate balance log excludes free text. A browser may remove local guest storage; export is offered at the moment of review. No account or server sync is implied.

The 21-day model is deliberately simplified. Approval, trust and customer outcome formulas are transparent in the Why receipts and should be calibrated with expert reviewers before being presented as an assessment. The synthetic cast and prose need a human voice and editorial pass before launch.

## Verification

`npm run test:silent-churn` runs 22 reducer and storage tests, validates every content reference and recording, then completes ten seeded policies. The generated `docs/silent-churn-verification/balance.json` lists fired and unfired event and objection IDs. The browser check captures entrance, onboarding, desk, mobile, coalition and review views. The route has an independent `PMFORGE_SILENT_CHURN_ENABLED=false` switch.

Final local production audit on 2026-11-05: Lighthouse performance 90, accessibility 100, largest content 1.07 s. The browser journey passed 81 checks; 20 soft reentries left 173 global listeners before and after. All 161 tested routes and audio assets returned 200. These are local measurements, not field data.
