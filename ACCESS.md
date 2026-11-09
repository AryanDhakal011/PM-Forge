# Access handover

Deployment owner: project owner (Aryan); second administrator: **not assigned**. No vendor account access or 2FA configuration was changed. Public launch is blocked until two named admins can recover each production account.

Use a project-owned durable inbox and password-manager vault. Keep recovery codes offline, two independent 2FA devices and least-privilege deploy credentials. Never store credentials in this repository. Record access and recovery procedures in the vault, not public documentation.

Offboarding: revoke host/Git/email/database/vendor access, revoke sessions, rotate shared secrets, audit deployed integrations and verify remaining admins can restore a backup. Owner must test the recovery procedure; documentation alone is not evidence it works.
