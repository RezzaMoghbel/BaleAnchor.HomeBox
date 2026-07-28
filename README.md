# BaleAnchor.HomeBox

## Copilot Agent Setup

This repository is configured to use a project-scoped Copilot agent and instructions.

- Primary agent: `BaleAnchorUtility/.github/agents/BaleAnchorHomeBox.agent.md`
- Global guidance: `BaleAnchorUtility/.github/copilot-instructions.md`
- File-scoped rules: `BaleAnchorUtility/.github/instructions/claude-spec.instructions.md`

When editing core app files, prioritize `ProjectDouments/CLAUDE.md` requirements and keep API validation/error behavior aligned with the RFC 7807 ProblemDetails contract defined in the instruction files.

## SMTP Configuration

Server email transport is configured in `BaleAnchorUtility/BaleAnchorUtility.Server/appsettings.json` under `EmailTransport`.

- Non-secret SMTP settings are committed and publish-ready by default.
- SMTP password is intentionally not committed.
- Set password at deploy/runtime with environment variable `EmailTransport__SmtpPassword`.

This follows `ProjectDouments/CLAUDE.md` requirements to never store plaintext SMTP passwords while keeping VPS publish setup to one step.

## Admin Bootstrap Access

Admin approval endpoints are role-protected (`Admin`/`SuperAdmin`).

- For first-time setup, add one or more emails to `AdminAccess:BootstrapAdminEmails`.
- After promoting real admin accounts, remove bootstrap emails.

Example environment variable override:

- `AdminAccess__BootstrapAdminEmails__0=admin@example.com`
