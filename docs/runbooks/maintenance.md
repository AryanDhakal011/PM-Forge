# Maintenance ownership

No recurring reminders or external jobs were created by this change. Assign a named owner and monitored channel before launch.

- Daily during the first seven launch days: actual vendor spend, failed sessions, delivery failures, backup age and disk capacity.
- Weekly: dependency update PRs, security advisories, scrubbed error/latency dashboards, support and abuse queue. Dependabot opens reviewable PRs; it does not deploy unreviewed changes.
- Monthly: test recovery email, inspect accounts/2FA, check region/provider/model notices, verify backup expiry and data-rights handling.
- Quarterly: restore an encrypted off-host backup on a separate host, rehearse key rotation and rollback, run a capped voice quality/load test and review actual processor terms.
- Immediately on a provider deprecation notice: record the deadline, assign migration and run regression tests before changing models. Do not infer a particular expiry date from example text in the handoff.

A managed host removes much server administration. It does not remove credentials, abuse, costs, privacy, model changes or security maintenance.
