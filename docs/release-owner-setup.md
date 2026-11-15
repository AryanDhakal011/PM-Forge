# PMForge owner setup

Use the provider dashboards for secrets. Share completed item numbers, dated quota limits, and public contact information only. The guest beta remains available while these items are open.

| Item | Owner action | Engineering verification |
|---|---|---|
| O1 | In Supabase Auth, confirm the production site and callback, configure anonymous sign-in, manual linking and CAPTCHA together, and disable the upstream email provider. Keep anonymous creation gated until the application and RLS checks are ready. | Verify both Auth layers, CAPTCHA rejection, anonymous limits and account linking. |
| O2 | In Cloudflare, create a Managed Turnstile widget for the production hostname and local rehearsal. Install the site key in Vercel and the secret in Supabase Attack Protection and the Vercel server environment. | Verify the widget and bad-token rejection in WO-A1. |
| O3 | Create the Google web OAuth client, use the callback shown by Supabase, and configure the brand and consent page. Install the OAuth credentials in Supabase. | Verify new and returning Google sign-in. |
| O4 | Create the GitHub OAuth App, use the callback shown by Supabase, and enter the credentials in Supabase. | Verify new and returning GitHub sign-in. |
| O5 | Confirm access to Vercel, Supabase and GitHub. Add values to their intended environments. Current app names are `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Keep production secrets out of previews. | Check deployed revision, application flags, and deployment isolation. |
| O6 | Confirm free AI accounts and dated console limits. Install live keys in Vercel and separate evaluation keys in GitHub. Revoke the Gemini key previously shared in chat. | Run bounded provider probes, validate privacy terms, and enable only pilot-scoped flags after the drills pass. |
| O7 | Create a private backup destination, scoped credentials, and offline age recovery keys. Add the dashboard values listed in the [restore drill](restore-drill.md). | Upload encrypted bytes, independently restore, and then enable the nightly workflow. |
| O8 | Provide the public support/privacy inbox and operator name and country, plus whether a postal address will be published. | Add the operator and support information to the policy pages and test the contact route. |
| O9 | Set up free monitoring and Sentry accounts and confirm the contacts that should receive alerts. | Verify a scrubbed test incident is delivered to the support contacts. |
| O10 | Arrange Android, iPhone, Windows and Mac device access, plus Firefox, and recruit 8–20 consenting pilot users. | Run the device matrix and a 5–7 day pilot when the entry gates pass. |
| O11 | Arrange qualified review of the privacy policy and terms. | Record review and publish approved text before general release. |

Start with O1–O5 and O7. O8 unlocks support and consent-screen details. The [current checklist](release-status.md) carries the work-order evidence and remaining engineering.
