# Production Plan — BaleAnchor Utility

> Status: active delivery plan
> Source of truth: `CLAUDE.md`
> Supporting context: `BUSINESS_PLAN.md`, current repository state, current client/server implementation
> Audience: project owner and delivery agents

## 1. Purpose

This plan translates `CLAUDE.md` into an execution order that can be followed from the current codebase state through to publish readiness.

This is not a replacement for `CLAUDE.md`.
If a task in this plan conflicts with `CLAUDE.md`, `CLAUDE.md` wins.

## 2. How this plan should be used

From this point onward, work should follow this sequence:

1. Complete the highest unfinished phase.
2. Validate each slice before moving on.
3. Do not skip production gates for convenience.
4. Keep development-only shortcuts isolated and removable.
5. Keep changes aligned to the architecture expected by `CLAUDE.md`.

## 3. Current observed state

Based on the current repository state, the following slices are already in place or partially in place.

### 3.1 Client status

- React + TypeScript + Vite + React Router shell is in place.
- Login, onboarding, overview, readings, payments, statements, and admin screens exist.
- Route-level resident/admin separation exists.
- Shared client contracts exist in `baleanchorutility.client/src/shared/contracts.ts`.
- Shared client transport exists in `baleanchorutility.client/src/api/portalClient.ts`.
- ProblemDetails parsing and field-error mapping exist.
- Shared formatters for en-GB date/date-time and GBP display exist.
- Focused client unit tests now exist for route guards and `PortalApiError` handling.

### 3.2 Server/API status

Observed and documented slices already exist for:

- Email OTP auth/session endpoints.
- Terms load/accept endpoints.
- Onboarding profile and utility setup endpoints.
- Admin approvals and role change endpoints.
- Billing readings and tariff endpoints.
- Latest-period calculation snapshot endpoints.
- Payment, balance, statement summary, statement period, statement export, and export history endpoints.
- RFC 7807 ProblemDetails responses and field-level validation patterns.

### 3.3 Important completed refactor foundations

- App UI is split across dedicated route components.
- Dashboard route views are extracted.
- Client transport logic is centralized instead of leaving raw `fetch` calls everywhere.
- Test seam exists for route access logic.

## 4. Main gaps versus CLAUDE.md

The codebase has moved well beyond a prototype, but it is not yet publish-ready against the full `CLAUDE.md` standard.

The biggest remaining gaps are:

- Development/demo seed access is not yet formalized.
- Frontend does not yet meet the full requested stack expectations for schema validation, server-state/query management, and PWA readiness.
- Broader automated test coverage is still thin.
- End-to-end publish checks and operational runbooks are not complete.
- Security and production hardening need an explicit finishing pass.
- Admin/CMS capabilities described in `CLAUDE.md` and `BUSINESS_PLAN.md` are still only partially complete.
- Notification, reminder, push, and installable PWA work still needs completion.

## 5. Dev seed access plan

`CLAUDE.md` requires passwordless email OTP authentication for production.
That remains the production design.

For local development, demos, and QA convenience, we should add a clearly temporary development-only seed access mechanism that is easy to delete.

### 5.1 Required rules

- Seed access must be enabled only in development or by explicit config flag.
- Seed access must never be active in production.
- Seed data must live in one obvious place and be deletable in one change.
- Seed accounts must be audit-neutral demo data, never real resident data.
- The code path must be removable without touching domain rules.

### 5.2 Recommended implementation

Implement a development-only seed pack with:

- one seed data file under a clearly named development-only path
- a dedicated config flag such as `SeedAccess:Enabled`
- a dedicated development seeder service
- either:
  - a temporary development password login endpoint, or
  - a temporary seeded OTP override with fixed visible passcodes

Because the product is OTP-based, the cleaner approach is a development-only seeded OTP override rather than introducing permanent password architecture.

### 5.3 Seed account pack to add

Use clearly fake demo accounts such as:

- `superadmin@baleanchor.local` — role: `SuperAdmin` — dev passcode/password: `Seed-SuperAdmin-123!`
- `admin@baleanchor.local` — role: `Admin` — dev passcode/password: `Seed-Admin-123!`
- `resident.active@baleanchor.local` — role: `Resident` — status: `Active` — dev passcode/password: `Seed-Resident-123!`
- `resident.onboarding@baleanchor.local` — role: `Resident` — status: onboarding incomplete — dev passcode/password: `Seed-Onboarding-123!`

### 5.4 Removal rule

Seed access must be removable by:

1. disabling the config flag
2. deleting the seed data file
3. deleting the dev-only endpoint or override implementation

## 6. Delivery phases from now to production

## Phase 1 — Seed access and developer workflow baseline

Goal: make the product easy to demo and easy to test repeatedly.

Tasks:

- Add the development-only seed access mechanism.
- Add seed flats, tenancies, readings, tariffs, payments, and statements where useful for demo coverage.
- Add a short seed reset/delete workflow.
- Document how to start the system with seed access enabled.

Current progress in this phase:

- Development-only seed account access is implemented.
- Fixed visible development OTP is implemented for configured seed emails.
- Representative resident demo data is now seeded for the active resident flow.
- Pending-approval seed coverage now exists for admin approval walkthroughs.
- Rejected and suspended seed coverage now exists for restricted-account walkthroughs.
- Development reset/reseed endpoints now exist under `/api/system/dev-seed`.
- Operational usage and removal steps are documented in `SEED_ACCESS_RUNBOOK.md`.
- Repeatable seed rehearsal is now available via `ProjectDouments/seed-smoke-check.ps1`.
- Seed smoke-check rehearsal has been executed successfully against the HTTPS Development server.

Exit criteria:

- A developer can sign in immediately with visible demo credentials/passcodes.
- Seed accounts cover resident, onboarding-incomplete, admin, and superadmin flows.
- Seed access is obviously disabled outside development.

## Phase 2 — Client form validation and UX hardening

Goal: align client-side UX with server validation without moving authority away from the server.

Tasks:

- Introduce schema-based client validation for:
  - login request flow
  - onboarding profile
  - onboarding utility setup
  - readings submission
  - tariff creation
  - payment recording
- Keep server validation authoritative.
- Display field-level errors consistently using current ProblemDetails mapping.
- Standardize loading, disabled states, empty states, and retry-friendly errors.

Current progress in this phase:

- Login request and OTP verify flows now use schema-based client validation with field-level feedback and unit-test coverage.
- Onboarding profile and utility setup flows now use schema-based client validation in `App.tsx` with consistent field-level feedback in `OnboardingView.tsx` and unit-test coverage.
- Readings submission, tariff creation, and payment recording now use schema-based client validation with field-level feedback in dashboard forms and unit-test coverage.
- Live field-level error clearing while users edit validated fields is now implemented for login, readings, tariffs, and payment forms.

Phase status:

- Phase 2 implementation is complete and ready to hand off to Phase 3 extraction work.

Exit criteria:

- All main forms provide immediate client-side guidance.
- Server validation errors still display correctly when they occur.
- No duplicate validation rule logic is hidden in multiple components.

## Phase 3 — Client architecture completion

Goal: reduce remaining App orchestration sprawl and align with a cleaner controller/application-service style.

Tasks:

- Extract remaining App orchestration into focused hooks or controller modules:
  - onboarding state/actions
  - billing state/actions
  - payments state/actions
  - statements state/actions
  - admin state/actions
- Keep route components presentational where practical.
- Preserve typed client transport and shared contracts.
- Introduce a server-state/query layer if we choose to close the full frontend stack gap from `CLAUDE.md`.

Current progress in this phase:

- Billing and payment field orchestration (state + field-error clearing handlers) has been extracted from `App.tsx` into a focused hook: `src/hooks/useBillingFormState.ts`.
- Statements workflow orchestration (state, API actions, selected snapshot flow, export flow, and statements-tab preload behavior) has been extracted from `App.tsx` into `src/hooks/useStatementsWorkflow.ts`.
- Onboarding workflow orchestration (terms/profile/utility/progress state and actions with validation + session refresh integration) has been extracted from `App.tsx` into `src/hooks/useOnboardingWorkflow.ts`.
- Admin workflow orchestration (pending approvals, decision actions, role updates, and admin action messaging) has been extracted from `App.tsx` into `src/hooks/useAdminWorkflow.ts`.
- Billing and payments API-action orchestration has been extracted from `App.tsx` into `src/hooks/useBillingPaymentsWorkflow.ts` while preserving existing validation and error behavior.
- Existing validation and submit behavior remains unchanged and verified by tests/build after extraction.

Phase status:

- Phase 3 implementation is complete.

Exit criteria:

- `App.tsx` is primarily route composition and shell wiring.
- Workflow logic is isolated by area.
- State transitions are easier to test without rendering the full app.

## Phase 4 — Admin and CMS completion

Goal: finish the operational surfaces expected by the product scope.

Tasks:

- Review `CLAUDE.md` admin scope against the currently implemented admin capabilities.
- Add missing admin workflows, prioritizing:
  - flat management
  - tenancy management
  - reading correction workflow
  - tariff management beyond resident input flows if still missing
  - boiler assumptions management
  - payment management edit/delete controls if not complete
  - tenant-gap allocation workflows
  - terms/declarations management UI
  - searchable CMS or system settings surfaces where required
- Ensure all financially relevant actions are audit logged.

Exit criteria:

- Core resident and admin lifecycle tasks can be completed end-to-end without manual JSON editing.
- Admin actions that affect billing correctness are auditable.

## Phase 5 — Production hardening on backend

Goal: close the security and reliability gaps required by `CLAUDE.md`.

Tasks:

- Verify and finish:
  - secure cookie session rules
  - CSRF protection
  - centralized exception handling
  - structured logging consistency
  - health checks
  - rate limiting
  - OpenAPI exposure rules
  - startup validation for critical options
- Verify JSON persistence guarantees:
  - atomic writes
  - temp-file recovery
  - backups before replacement
  - integrity validation
  - corrupt-document quarantine
  - concurrency protection
  - rebuildable indexes
- Confirm tenancy isolation and authorization boundaries everywhere.

Exit criteria:

- Security and resilience items from `CLAUDE.md` are either complete or explicitly accepted as deferred with owner approval.
- Server behavior is consistent under expected failure paths.

## Phase 6 — Statements, equations, and financial transparency audit

Goal: prove that resident-facing figures are reproducible and explainable.

Tasks:

- Review calculation outputs against `CLAUDE.md` billing rules.
- Verify estimated-period labeling.
- Verify tariff split behavior.
- Verify boiler assumption usage and equation traceability.
- Verify payment linkage and balance rules.
- Review statement PDF content for clarity, reproducibility, and export metadata integrity.

Exit criteria:

- A resident can follow a statement back to the stored inputs.
- All displayed totals can be reproduced from stored data and documented rules.

## Phase 7 — PWA, reminders, and notifications

Goal: complete the installable resident experience requested in `CLAUDE.md`.

Tasks:

- Add PWA manifest and service worker.
- Add installable mobile behavior.
- Implement reminder scheduling for readings/payments as required.
- Implement email notification workflows.
- Implement web push subscription management and push delivery.
- Verify notification preferences and failure handling.

Exit criteria:

- App is installable.
- Reminder workflows operate with clear user messaging and safe fallbacks.

## Phase 8 — Automated quality gates

Goal: move from selective validation to repeatable release confidence.

Tasks:

- Expand client unit tests beyond routing and transport.
- Add server unit tests for billing and domain rules.
- Add integration tests for key API flows.
- Add contract tests for ProblemDetails and typed responses.
- Add end-to-end tests for:
  - login/onboarding
  - resident readings to statement flow
  - admin approval flow
- Add accessibility checks for critical screens.
- Add security checks for auth, authorization, and route protection.

Exit criteria:

- Critical flows are test-covered at the appropriate layer.
- Release regression risk is materially lower than manual-only verification.

## Phase 9 — Publish readiness and operations

Goal: complete the final release checklist.

Tasks:

- Prepare production configuration matrix.
- Document environment variables and secrets handling.
- Prepare deployment steps for server and client.
- Confirm SMTP and notification credentials handling.
- Add backup/restore runbook.
- Add incident/support checklist.
- Add seed-data removal checklist.
- Add go-live verification checklist.

Exit criteria:

- A publish rehearsal can be executed without guesswork.
- Demo-only or dev-only features are excluded from production.

## 7. Suggested execution order for the next sessions

Use this order unless a blocker forces reprioritization:

1. Implement development-only seed access.
2. Add client schema validation.
3. Continue App orchestration extraction by workflow area.
4. Fill admin/CMS product gaps.
5. Complete backend hardening pass.
6. Deepen financial correctness and statement audit coverage.
7. Finish PWA/reminder/push features.
8. Complete automated release gates.
9. Run publish rehearsal.

## 8. Definition of publish-ready

The product is ready to publish only when all of the following are true:

- Resident login, onboarding, readings, calculations, payments, statements, and admin approval flows work end-to-end.
- Development seed access is disabled and removable.
- Production auth remains OTP-based.
- Tenant isolation is verified.
- Financially relevant admin actions are audited.
- Client and server validations are consistent and user-safe.
- Calculation outputs are reproducible and traceable.
- Critical automated tests pass.
- Build, deployment, backup, restore, and rollback steps are documented.
- Production configuration is explicit and no demo shortcuts remain enabled.

## 9. Immediate next implementation slice

If we resume coding from this plan, the best next slice is:

1. add development-only seed access
2. seed resident/admin/demo data that exercises the main flows
3. document how to remove the seed mechanism before production

That gives us a stable demo and QA baseline before continuing the remaining production-hardening phases.
