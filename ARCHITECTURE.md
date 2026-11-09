# PMForge architecture

Current: Browser (IndexedDB practice/profile/drafts, AudioWorklet microphone, local Whisper and Kokoro) → Next.js Node API → one local persistent SQLite database. Optional voice: browser → LiveKit → long-lived agent → Deepgram / Cerebras / Inworld. Worker callbacks are signed and validated by the API. AI output does not control recorded scores or evidence eligibility.

See [existing application map](docs/ARCHITECTURE.md), [voice contracts and threat boundaries](docs/hot-seat-realtime-architecture.md), [hosting choice and limitations](docs/HOSTING-DECISION.md), and [production audit](docs/prr.md). Singapore is a proposed host region, not a measured deployment. The reference Postgres/Redis/object-storage architecture is not implemented.
