# Today page

## Data model

The Today store lives in `pmforge.today-progress.v1`. It is versioned at `schemaVersion: 1`, guarded by try/catch, and contains lit stars, in-progress state, the daily pick, daily activity, backup time, and replayed stars.

Real scenario and run data come from IndexedDB. Lit decisions are completed runs. In-progress cases are unfinished runs. Coverage, activity, streak, and recency all derive from real runs, not placeholders.

## Daily pick

Daily selection is seeded with `localUserId + YYYY-MM-DD`. The unlit pool is weighted toward rooms with the fewest lit scenarios. Days one through three prefer easy scenarios. A stored reroll offset advances a stable seeded sequence. The daily pick never changes on reload until `Pick another` changes the offset.

An unfinished run overrides the recommendation and becomes Resume mode. In that state, `Pick another` becomes `Start something else` and the unfinished case remains intact.

## Constellation geometry

There are seven arms and nine stars per arm, 63 stars total. The layout is deterministic: each arm is offset from the center, each star advances along its arm, and a small authored sine wobble creates the hand-drawn zigzag.

Dark stars use paper fill with a forest stroke. Lit stars are ochre with a forest stroke. Today's target is the ochre ringed star linked to the case room. Table view reports the same seven-room totals.

## Motion timeline

Chrome stays immediate. Greeting and case paper rise first, the chart line draws at 0.55 seconds, metadata appears after, the constellation settles as a separate panel, and the threaded path reconnects when the selected case or viewport changes.

The status stamp, deck change, chart crosshair, target pulse, local backup popover, lit replay, reduced-motion fallback, and card interactions remain CSS or native DOM driven. Navigation to a scenario prefers the View Transition API and falls back immediately to normal routing.

## Adding a room or state

Add the room to the master category list in `src/lib/product/content.ts`. Then add the same room ID and visible short code in `roomCodes` inside `DecisionDesk.tsx`. The constellation geometry and table derive their arm count from `CATEGORIES`.

`CATEGORIES` must keep a maximum of nine scenarios per room for the literal 63-star geometry. If a room gains or loses scenarios, update the constellation capacity and coverage totals deliberately. New case states should branch at the stamp, resume card, greeting, and daily-lit calculations in `DecisionDesk.tsx`.
