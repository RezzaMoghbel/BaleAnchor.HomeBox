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

## Admin Role Management

Admin role changes are available via `POST /api/v1/admin/roles/{targetUserId}` in `BaleAnchorUtility.Server`.

- Access gate: authenticated `Admin` or `SuperAdmin` (plus bootstrap email fallback for first-time setup).
- Enforcement: only `SuperAdmin` can change roles.
- Safety rule: `SuperAdmin` cannot remove their own `SuperAdmin` role.
- Validation: role and reason are strictly validated and return RFC 7807 validation payloads on HTTP 400.
- Audit: every role change is written to `AuditLogs` with category `ADMIN_ROLE` and action `CHANGE_ROLE`.

## Billing Input APIs

Resident billing input endpoints are available under `POST/GET /api/v1/billing/*` in `BaleAnchorUtility.Server`.

- `POST /api/v1/billing/readings`: submit combined cold-water, hot-water, and electricity readings.
- `GET /api/v1/billing/readings/latest`: fetch the latest submitted readings for the authenticated user.
- `POST /api/v1/billing/tariffs`: add a dated tariff version for water and electricity.
- `GET /api/v1/billing/tariffs/active?onDate=yyyy-MM-dd`: fetch the applicable tariff for a date.

Validation and behavior:

- Only `Active` user accounts can submit or retrieve billing inputs.
- Reading dates must be strictly increasing and readings must not roll back.
- Tariff entries are append-only by effective date; duplicate effective dates are rejected.
- Conflict/business-rule failures return RFC 7807 ProblemDetails with domain-specific `errorCode` values.

## Calculation Snapshots

Latest-period calculation snapshot endpoints are available under `api/v1/billing/calculations/latest`.

- `POST /api/v1/billing/calculations/latest`: runs server-side deterministic calculation for the latest period and stores an immutable snapshot.
- `GET /api/v1/billing/calculations/latest`: returns the most recently generated snapshot for the authenticated user.

Calculation behavior:

- Requires at least two combined readings.
- Uses dated tariffs within the period and marks split segments as estimated when tariff changes occur without a boundary reading.
- Uses boiler assumptions from onboarding utility setup for boiler electricity derivation.
- Persists engine version, input hash, and equation summary for auditability and statement reproducibility.
