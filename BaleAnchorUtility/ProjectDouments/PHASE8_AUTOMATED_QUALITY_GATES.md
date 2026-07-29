# Phase 8 Automated Quality Gates

## Scope delivered

Phase 8 adds repeatable quality gates across unit, integration, contract, end-to-end API flow, accessibility baseline, and security regression checks.

## Server test expansion

Added ASP.NET Core host-level integration harness based on `WebApplicationFactory<Program>` with Development environment bootstrapping for seed-backed test data.

### Integration and contract coverage

- `Phase8ApiContractTests`
  - Validates RFC 7807 error envelope fields and required extensions.
  - Verifies typed response payload shape for reminder preferences endpoint.

### End-to-end API flow coverage

- `Phase8EndToEndApiFlowTests`
  - Login + onboarding progress flow (seed onboarding resident).
  - Resident readings -> latest calculation -> statement period listing flow.
  - Admin pending approvals flow (seed admin actor).

### Security coverage

- `Phase8SecurityIntegrationTests`
  - Resident cannot access admin pending approvals endpoint (403).
  - Authenticated write without trusted origin is blocked by CSRF middleware (403 ProblemDetails).

## Client test expansion

### Unit and contract checks

- Routing guard tests expanded for notifications path protection.
- Portal API client tests expanded for reminders and push endpoints.
- New shared utility tests:
  - `formatters.test.ts`
  - `problemDetails.test.ts`

### Accessibility baseline checks

- `criticalScreens.a11y.test.tsx` performs static render checks for critical screen landmarks/labels/status regions:
  - Login
  - Onboarding
  - Notifications dashboard

These are baseline checks and should be followed by browser-driven accessibility scanning in a future enhancement pass.

## How to run gates

Use `ProjectDouments/phase8-quality-gates.ps1` from repo root.

The script runs:

1. Server test suite (unit + integration + contract + security + API flow)
2. Client unit/accessibility tests
3. Client production build

## Exit criteria mapping

- Critical flows are covered at service/controller/integration levels.
- Error contracts are verified for shape and required metadata.
- Authorization and CSRF protections are regression-tested.
- Client behavior and formatting/parsing helpers have broad unit coverage.
- Accessibility baseline assertions exist for key user-entry screens.
