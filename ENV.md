# Environment register

No live values are included. Install production secrets in the host/worker encrypted environment store; local values belong only in ignored `.env.local`. Owner: project owner plus a second admin before launch. Staging and production need separate secrets/data. Rotate on exposure/offboarding and per vendor policy; rehearse before launch. Browser-public settings must never hold secrets. See `.env.example` and `.env.production.example` for context; test/development controls must remain disabled on public hosts.

| Variable | Purpose / source | Scope | Owner / rotation |
|---|---|---|---|
| `AUTH_EMAIL_FROM` | Email signup, verification and password recovery. Server-only. | Server / worker / local tooling as used in source | Project owner; review each release |
| `AUTH_EMAIL_MODE` | Local development only: set AUTH_EMAIL_MODE=preview and a local auth secret. Emails are written privately beside the configured database, not sent. | Server / worker / local tooling as used in source | Project owner; review each release |
| `AUTH_EMAIL_REPLY_TO` | Optional durable support inbox. Leave empty until one is owned and monitored. | Server / worker / local tooling as used in source | Project owner; review each release |
| `AUTH_TRUSTED_IP_HEADER` | A reverse proxy must overwrite this header; do not expose the app port. | Server / worker / local tooling as used in source | Project owner; review each release |
| `BETTER_AUTH_SECRET` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `BETTER_AUTH_URL` | Guest mode works with no environment variables. Configure OAuth before advertising account sync. Do not commit real secrets. | Server / worker / local tooling as used in source | Project owner; review each release |
| `CHROME_PATH` | Runtime/operations setting; see `scripts/measure-landing.mjs`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `CI` | Runtime/operations setting; see `scripts/verify-auth-ui.mjs`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `DEADLOCK_POLICIES` | Runtime/operations setting; see `scripts/deadlock-sim.ts`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `DEEPGRAM_API_KEY` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `ELEVENLABS_API_KEY` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `ELEVENLABS_VOICE_ID` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `FF_INCIDENT_ONLY` | Runtime/operations setting; see `scripts/verify-feature-factory.mjs`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `FF_RESOURCE_ONLY` | Runtime/operations setting; see `scripts/verify-feature-factory.mjs`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `GEMINI_API_KEY` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `GITHUB_CLIENT_ID` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `GITHUB_CLIENT_SECRET` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `GOOGLE_CLIENT_ID` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `GOOGLE_CLIENT_SECRET` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `INWORLD_API_KEY` | Runtime/operations setting; see `services/hot-seat-agent/src/bakeoff.ts`. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `LIVEKIT_API_KEY` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `LIVEKIT_API_SECRET` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `LIVEKIT_URL` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `NAVIGATION_SMOKE_ONLY` | Runtime/operations setting; see `scripts/verify-feature-factory-navigation.mjs`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `NEXT_PUBLIC_SITE_URL` | Runtime/operations setting; see `src/app/layout.tsx`. | Browser-public | Project owner; review each release |
| `NODE_ENV` | Runtime/operations setting; see `src/app/api/auth-config/route.ts`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PLATFORM_FUZZ_RUNS` | Runtime/operations setting; see `scripts/fuzz-shared-platform.ts`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PLATFORM_SNAPSHOTS` | Runtime/operations setting; see `scripts/verify-shared-platform.mjs`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_ALLOWED_REGIONS` | Comma-separated ISO region codes approved against current provider terms. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_BILLABLE_OUTPUT_TOKEN_RESERVE` | Paid mode only: verified maximum billed output including reasoning tokens; 0 blocks production AI. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `PMFORGE_AI_DAILY_SESSIONS_PER_USER` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_FREE_TIER_VERIFIED` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_INPUT_USD_PER_MILLION` | Explicit production-only prices, USD per million tokens (including reasoning). | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_KILL_SWITCH` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_LOCAL_TEST` | Local review only; public deployments must leave this false. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_MAX_CONCURRENT_SESSIONS` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_MAX_TURNS` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_MODE` | AI interview — guided is the $0 default; a key alone never enables inference. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_MODEL` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_MONTHLY_BUDGET_USD` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_OUTPUT_USD_PER_MILLION` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_PERSONAL_DATA_APPROVED` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_PROJECT_RPD` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_PROJECT_RPM` | Copy actual project limits from AI Studio. Zero keeps external admission closed. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_PROJECT_TPM` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_TERMS_APPROVED` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_TEST_PROVIDER` | Runtime/operations setting; see `src/lib/interview-ai/config.ts`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_TIMEBOX_SECONDS` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_TIMEOUT_MS` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_AI_TRANSPORT` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_APP_ORIGIN` | Runtime/operations setting; see `services/hot-seat-agent/src/agent.ts`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_BACKUP_DIR` | Runtime/operations setting; see `scripts/backup-data.mjs`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_BAKEOFF_APPROVED_USD` | Runtime/operations setting; see `services/hot-seat-agent/src/bakeoff.ts`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_BAKEOFF_LOCATION` | Runtime/operations setting; see `services/hot-seat-agent/src/bakeoff.ts`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_BAKEOFF_RUNS` | Runtime/operations setting; see `services/hot-seat-agent/src/bakeoff.ts`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_BAKEOFF_VOICE` | Runtime/operations setting; see `services/hot-seat-agent/src/bakeoff.ts`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_DATABASE_PATH` | Provider redirect: {BETTER_AUTH_URL}/api/auth/callback/google (or /github) The local Node deployment uses .data/pmforge.sqlite. Cloudflare D1 needs its adapter. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_DEPLOYMENT` | Runtime/operations setting; see `src/app/api/health/route.ts`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_DOMAIN` | Copy to .env.production. Do not commit the filled file. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_FEATURE_FACTORY_ENABLED` | Runtime/operations setting; see `src/components/feature-factory/Page.tsx`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_HOTSEAT_GEMINI_TTS_ENABLED` | Hot Seat shares the above text AI limits. Local Kokoro speech makes no inference API calls. Optional Gemini speech is OFF; enable only after separately verifying free speech access and quotas. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_HOTSEAT_TTS_FREE_VERIFIED` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_HOTSEAT_TTS_MODEL` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_HOTSEAT_TTS_RPD` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_HOTSEAT_TTS_RPM` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_INVISIBLE_WALL_ENABLED` | Runtime/operations setting; see `src/components/invisible-wall/Page.tsx`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_LEGACY_FRACTURE_ENABLED` | Runtime/operations setting; see `src/components/legacy-fracture/Page.tsx`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_PAID_SPEECH_APPROVED` | Paid speech stays off even when legacy keys exist. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_PIVOT_POINT_ENABLED` | Runtime/operations setting; see `src/components/pivot-point/Page.tsx`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_PREVIEW_DIR` | Runtime/operations setting; see `scripts/dev-preview.mjs`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_DAILY_SESSIONS` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_ENABLED` | Hot Seat realtime architecture — independent of the legacy Gemini pilot. Copy the non-secret limits and matching LiveKit/worker credentials to the app. Provider API keys belong on the agent worker, not in browser/public variables. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_KAI_VOICE` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_KILL_SWITCH` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_LLM_MODEL` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_MAX_CONCURRENT` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_MAX_SECONDS` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_MAX_TURNS` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_MONTHLY_BUDGET_USD` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_NORA_VOICE` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_PROVIDERS_VERIFIED` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_SESSION_RESERVE_USD` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_STT_MODEL` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_TERMS_APPROVED` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_TTS_MODEL` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_WORKER_REGION` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_REALTIME_WORKER_SECRET` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `PMFORGE_SHARE_SECRET` | Optional stable signing secret for portfolio links. Without one, a persistent random secret is generated in the application SQLite database. Server-only. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `PMFORGE_SILENT_CHURN_ENABLED` | Runtime/operations setting; see `src/components/silent-churn/Page.tsx`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_VOICE_ENABLED` | Optional interview speech. Server-only keys; typing/browser voice need no keys. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PMFORGE_VOICE_MONTHLY_BUDGET_USD` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `PRODUCT_URL` | Runtime/operations setting; see `scripts/verify-auth-ui.mjs`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `RESEND_API_KEY` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; secret policy above |
| `SITE_URL` | See the environment example and source for this setting. | Server / worker / local tooling as used in source | Project owner; review each release |
| `TROJAN_LEAK_ONLY` | Runtime/operations setting; see `scripts/verify-trojan-horse.mjs`. | Server / worker / local tooling as used in source | Project owner; review each release |
| `VERIFY_OUTPUT` | Runtime/operations setting; see `scripts/verify-auth-ui.mjs`. | Server / worker / local tooling as used in source | Project owner; review each release |
