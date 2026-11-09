# Vendor register — unprovisioned release

Owner for account setup/billing, renewal checks and DPAs: project owner. Second admin, organization identity, billing cards, exact plans/quotas and review dates are **not supplied**. Never infer them from a key or SDK installation.

| Capability | Current/proposed supplier | State / terms / limits |
|---|---|---|
| Web + API | Render Singapore Docker + disk | Proposed paid pilot; not created; plan/backup retention/region must be checked |
| Persistent data | SQLite on one local disk | Implemented; managed Postgres/PITR not implemented |
| Auth | Better Auth | Maintained self-hosted library; managed-auth migration not implemented |
| Transactional mail | Resend | Adapter present; production sender, delivery and DNS unverified |
| Realtime transport/TURN | LiveKit Cloud | Adapter present; project, regional TURN tests, quotas and DPA missing |
| Streaming STT | Deepgram Flux | Adapter present; production credentials/terms/capacity unverified |
| Conversation | Cerebras gpt-oss-120b | Adapter present; current account model access/capacity unverified |
| Streaming speech | Inworld TTS-2 | Adapter present; approved female voices/account/terms unverified |
| Local model download | Hugging Face | Whisper tiny.en q8 and Kokoro q8; download after user choice, local inference |
| Legacy optional inference | Google Gemini | Existing gated fictional pilot; not unlimited; no production data approval inferred |
| Legacy paid speech | Deepgram / ElevenLabs | Explicit separate cost gate; not enabled by local mode |
| DNS/domain | Not selected | No domain owned/configured in this task |
| Error tracking, uptime, status | Not selected | No live alerts or synthetic staging jobs established |
| Payments | None | No checkout or charge feature; not applicable to this release |

Use vendor documentation and consoles for exact limits/support/status links when provisioning. Record RPM, TPM, concurrent streams, regional endpoints, retention, training use, DPA, named two admins and renewal dates before opening the corresponding external feature. Do not turn on speculative/hedged requests using a guessed price.
