# PMForge release readiness - 2026-11-08

Current verification: [Pass 2 release review](PASS-TWO-RELEASE.md), build `Gkc6RjxJzZXiqlby3ZK1x`. Its reports supersede earlier browser/build measurements below.

The landing/Career Studio Pass 2 is implemented for local review at http://localhost:3002. The fictional localhost-only Gemini pilot is enabled for immediate testing with a $0 budget. Public launch still requires deployment configuration, actual quota verification and the review gates below. See [current Pass 2 decisions](PASS-TWO-DECISIONS.md).

## What is implemented

The landing page, verified email signup/login/recovery, guest import, account restoration, projects, progress and portfolio are integrated with the shared interview experience. The AI decision room reuses the native seven-category workbenches, evidence, scoring and saved runs. Its journey is Prepare, Frame, Investigate, Decide, Reflect.

Guided practice is the default with a $0 inference budget. The optional fictional free pilot uses server-only Gemini, validated structured output, encrypted recovery state, server-issued guest sessions, ownership checks, durable quotas, atomic sequencing, idempotent retries, one generation per run and shared kill/circuit controls. Personal behavioral stories remain guided without an approved production data configuration. Paid speech never activates automatically in $0 mode.

The application controls progression, evidence costs and scores. AI provides phrasing, grounded follow-ups and quoted qualitative reflection. It cannot publish work or change rubric results. Existing saves use an additive versioned state; imports preserve the transcript and detach old AI ownership.

## Verification

- All 15 release unit suites passed: core/accounts, auth, AI, native interviews/voice, portfolio, shared platform and project suites. [Suite report](release-qa/unit-suites.json).
- The final AI suite passed 21 tests, including provider request shapes, expired leases, import ownership, released-room admission and a real two-process SQLite admission race.
- All 28 held-out fictional evaluation fixtures passed offline. Deterministic outputs do not certify live model quality. [Offline report](ai-evaluation/offline.json).
- AI browser checks passed at 320, 375, 768, 1024 and 1440 px, including light/dark accessibility, consent, explicit Begin, private scratch preservation, a lost response after server commit, reload/retry without duplicates, turn cap, guided continuation and server deletion that retains local feedback. [26 checks](ai-interview-release-verification/browser.json).
- The standalone deployment passed landing checks at six widths, keyboard navigation, reduced motion and security headers. [21 checks](ai-release-landing/browser.json).
- All seven native interview categories and three levels passed preparation, Begin and responsive checks. [173 checks](ai-release-interview-ux/browser.json).
- Native live interviews cover typed and synthetic voice input, OCR, category workbenches, denial/failure fallback, local audio, interruption recovery and replay. [Browser report](ai-release-interview-live/browser.json).
- Today, Practice, Projects, Progress, Portfolio, Settings, Help, twelve project entry routes and accessibility checks passed. [75 checks](ai-release-surface/browser.json).
- Portfolio creation, resumes, tracked roles, progress, sharing and revocation passed. [36 checks](ai-release-portfolio/browser.json).
- Production build, TypeScript and client secret scan passed. The standalone contains public assets and dependency-free backup/AI operations tools; no private environment file is packaged. The production dependency audit reported zero known vulnerabilities.
- Existing authentication browser checks cover signup/verification, invalid credentials, reset/reused-link rejection, requested destinations, guest preservation and fresh-device restoration. Test mail was not delivered externally. [24 checks](auth-verification/browser.json).

Browser automation used Chromium and synthetic microphone input. Physical microphone coverage, Safari/Firefox verification, independent expert calibration and an independent security audit are not established by these checks.

## Measured live AI result

The owner confirmed a Free project. One controlled Gemini 3.1 Flash-Lite GenerateContent follow-up passed grounding validation in 2,735 ms, with 593 input tokens, 160 output tokens and 173 thought tokens reported by the provider. Earlier 3.8 attempts timed out or returned HTTP 503. A premature-debrief response was rejected, then the provider schema was tightened.

This is one usable sample, not a four-second p95 load-test pass, an interviewer-quality certification or a capacity claim. No more live generation is needed to repeat local tests.

## Launch gates

1. Supply the public HTTPS domain, generate the production auth secret and configure a verified email sender. Verify actual delivery, reset links, backups/restoration and any enabled OAuth callbacks on the host.
2. Verify the container build and HTTPS issuance on the hosting machine. The local Docker engine was unavailable; the standalone Node package was tested separately. Use persistent local storage for this single-host SQLite architecture.
3. Before opening AI, enter actual model-specific RPM, TPM and RPD from AI Studio, confirm billing remains disabled for the pilot, approve audience/region/data terms, replace the chat-shared credential through the owner console, complete expert review and run an agreed paced load test. No key/project rotation may evade quotas.
4. Keep provisional content/rubric labels until documented expert review supports removing them. Confirm operational privacy/support contacts and physical-device coverage.

The final build is `dzWZfu4VI1lsPxYJbtVrB`; its artifact and secret-scan record is [build.json](release-qa/build.json). The review preview is at http://localhost:3002. Guided remains the initial interview selection; the eligible AI interviewer now uses the real Gemini provider in the bounded local pilot. Other PMForge ports have been stopped. No public deployment has been performed.

See [AI-INTERVIEW.md](AI-INTERVIEW.md) for mode configuration, provider setup, privacy, quota/cost controls, measured results and evaluation. See [HOSTING.md](HOSTING.md) for deployment, backups, rollback and operations.
