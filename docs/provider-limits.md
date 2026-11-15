# Provider limits

Reviewed 15 November 2026. The launch budget is $0. Public documentation is a planning reference. An AI lane requires limits from its actual project console, including the lowest applicable organization and project limits.

| Provider | Existing account evidence | Published planning constraints | Launch disposition |
|---|---|---|---|
| Vercel | PMForge and its reader were deployed in AP-Java on Hobby. Current connector access to the workspace returns 403. | Hobby is for personal, non-commercial use. Check the account's usage dashboard before the pilot. [Hobby plan](https://vercel.com/docs/plans/hobby) | Existing deployment |
| Supabase | The organization connector reports Free. Project-specific usage still needs a dashboard check. | 500 MB database per project, no automated daily backups, possible inactivity pause. [Free plan](https://supabase.com/pricing) | Existing managed backend |
| Groq | No PMForge quota or free account status verified | Limits vary by model and apply across the organization. Check RPM, TPM, RPD, TPD, and separate audio windows if enabling transcription. [Groq limits](https://console.groq.com/docs/rate-limits) | Pooled inference and audio off |
| Cerebras, OpenRouter, Cloudflare Workers AI, Gemini | No current project-specific quota, selected model or terms approval recorded | Record data terms, regions, effective quotas and observed throttling before choosing a model. | Pooled inference off |
| GitHub Actions / Backblaze B2 | Private backup bucket, scoped key and encryption recipient pending | Confirm runner minutes, storage and transfer in the chosen accounts before scheduling. | Backup workflow awaits owner configuration |
| Cloudflare Turnstile | Widget and production host configuration pending | Challenge tokens require server validation. [Token validation](https://developers.cloudflare.com/turnstile/turnstile-analytics/token-validation/) | Anonymous cloud accounts and challenge integration pending |

For each admitted model record the verification date, owner, model ID, billing state, effective request and token limits, any shared organization budget, terms review, supported regions and measured request sizes. Estimate pilot concurrency from rate limits and measured turn pacing. Record all fallbacks and retries in usage accounting. Leave capacity unpublished until these inputs are known.
