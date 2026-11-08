# Account email setup

Verification and recovery use a shared branded cream/forest HTML layout, original PMForge mark, plain-text fallback, explicit expiry and copyable single-use link. Existing encrypted queue/retries remain. No tracking pixels or remote fonts are added.

## Local testing

Use `AUTH_EMAIL_MODE=preview` with a local auth secret and `npm run dev` on port 3002. Sensitive messages are saved privately in `mail-preview` beside the configured database. Never publish them. Production refuses preview mode. Automated auth tests use an isolated temporary database and inbox, with no external delivery.

The sample HTML in `docs/email-preview` has fictional tokens, not live account links. Its localhost logo is visible while the local server runs.

## Public email

Use a durable owner inbox, a domain you own and a sending-only Resend API key restricted to that domain. Set `AUTH_EMAIL_FROM`, optional `AUTH_EMAIL_REPLY_TO`, `RESEND_API_KEY`, and matching HTTPS `BETTER_AUTH_URL`/`SITE_URL` privately in host settings. Add the exact DNS records returned by Resend, review DMARC and disable provider click/open tracking for account messages. Test real verification and recovery after DNS succeeds.

A free website subdomain does not provide DNS ownership of the parent domain or an email identity. Resend's shared test sender only sends to the email on its account. A disposable recipient inbox does not replace a verified sender or durable recovery/support address. No temporary account was created and no real email was sent in this pass.

[Test sender restriction](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain) · [Domain verification](https://resend.com/docs/dashboard/domains/introduction)
