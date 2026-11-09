# Verification record — 9 November 2026

- Hot Seat tests: **43 passed**, including realtime configuration gates, signed worker authentication, ownership, admission reservations, replay protection, pause/reconnect, turn limits, configuration changes, traceable observations, deletion, and route origin/authentication checks.
- App and separate agent TypeScript checks passed.
- Production app build passed. Local preview pinned to `31iynptoEFUe7bDGj5gIF`, port **3002**.
- Root and worker dependency audits: **0 vulnerabilities**. The worker module imports without starting providers.
- Bake-off preparation ran without external calls: 24 fictional voice lines and 10 candidate cases. All performance and listening results remain unmeasured.
- Operations status showed realtime disabled, a $0 configured budget, $0 reserved, and zero latency samples (null p50/p95 rather than fabricated values).
- Browser startup check: clear disabled realtime disclosure, legacy Gemini unchecked by default, existing saved-run entries preserved, no console warnings/errors observed.
- Startup document width checked at 320, 375, 768, 1024 and 1440 px with no horizontal document overflow. The 768 px check was repeated separately after a viewport update initially reported the preceding width. Temporary viewport overrides were reset.
- No microphone capture, live RTC room, provider generation, actual speech playback, quality panel, regional timing, worker deployment or load test was performed for this architecture change.
- Screenshot: `startup.png`.

The full connected experience is **not certified** by these offline/startup checks. See `../hot-seat-realtime-architecture.md` for the exact incomplete release gates and `../voice-bakeoff.md` for the unmeasured comparison table.
