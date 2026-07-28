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
- `DELETE /api/v1/billing/readings/latest`: delete the latest submitted reading only.
- `POST /api/v1/billing/tariffs`: add a dated tariff version for water and electricity.
- `GET /api/v1/billing/tariffs/active?onDate=yyyy-MM-dd`: fetch the applicable tariff for a date.

Validation and behavior:

- Only `Active` user accounts can submit or retrieve billing inputs.
- Reading dates must be strictly increasing and readings must not roll back.
- The latest reading cannot be deleted if that reading closes a paid period; delete the linked payment first.
- Tariff entries are append-only by effective date; duplicate effective dates are rejected.
- Tariff versions include unit rates, standing/day, and VAT percent for both water and electricity.
- Conflict/business-rule failures return RFC 7807 ProblemDetails with domain-specific `errorCode` values.

## Calculation Snapshots

Latest-period calculation snapshot endpoints are available under `api/v1/billing/calculations/latest`.

- `POST /api/v1/billing/calculations/latest`: runs server-side deterministic calculation for the latest period and stores an immutable snapshot.
- `GET /api/v1/billing/calculations/latest`: returns the most recently generated snapshot for the authenticated user.

Calculation behavior:

- Requires at least two combined readings.
- Uses dated tariffs within the period and marks split segments as estimated when tariff changes occur without a boundary reading.
- Applies standing/day once for cold-water and apartment-electricity components only.
- Applies VAT after component subtotal calculations per utility segment.
- Uses boiler assumptions from onboarding utility setup for boiler electricity derivation.
- Persists engine version, input hash, and equation summary for auditability and statement reproducibility.

## Payments And Balance APIs

Payment and balance endpoints are available under `api/v1/billing`.

- `POST /api/v1/billing/calculations/latest/payment`: records one payment for the latest calculated period.
- `GET /api/v1/billing/calculations/latest/payment`: returns latest period total, payment (if any), and period difference/status.
- `GET /api/v1/billing/statements/latest-summary`: returns latest statement-ready period summary with payment and all-time balance values.
- `GET /api/v1/billing/statements/summary`: returns selected statement summary by `snapshotId` or by `periodStartDate` + `periodEndDateExclusive` query.
- `GET /api/v1/billing/statements/periods`: returns newest-first statement periods with payment/difference status metadata for period selection UIs.
- `GET /api/v1/billing/statements/export-pdf`: exports selected period statement PDF using `snapshotId` or period date query selection.
- `GET /api/v1/billing/payments/history`: returns payment history ordered newest-first by period.
- `GET /api/v1/billing/payments/balance`: returns all-time calculated charges, total recorded payments, and current balance status.
- `PUT /api/v1/billing/payments/{paymentId}`: updates a payment record owned by the authenticated user.
- `DELETE /api/v1/billing/payments/{paymentId}`: deletes only the latest payment in user history.

Validation and behavior:

- Only `Active` user accounts can manage payments.
- Exactly one payment is allowed per period.
- Payment date must use `yyyy-MM-dd` and cannot be in the future.
- Payment amount must be greater than zero and stored with decimal-safe rounding.
- Earlier payments are not deletable; only the latest payment is eligible for deletion.
- Payment create/delete actions are audit logged with category `PAYMENT`.
- Latest statement summary includes period difference status and all-time balance status using clear labels: `Amount outstanding`, `In credit`, `Paid in full`.
- PDF export currently uses a placeholder PDF generator abstraction (`IStatementPdfGenerator`) so production renderer integration can be swapped in without API changes.
- Conflict and validation failures return RFC 7807 ProblemDetails with operation-specific `errorCode` values.
