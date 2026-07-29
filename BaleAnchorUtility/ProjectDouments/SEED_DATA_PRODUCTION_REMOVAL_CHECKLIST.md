# Seed Data Production Removal Checklist

## Objective

Guarantee that development/demo seed features are excluded from production.

## Checklist

1. Configuration
   - `SeedAccess:Enabled` is `false` in production configuration.
   - `SeedAccess:FixedOtpCode` is empty in production configuration files.
   - `SeedAccess:Accounts` is empty in production configuration files.

2. Runtime behavior
   - `/api/system/dev-seed` is not exposed in production deployments, or returns unavailable if temporarily retained by policy.
   - no client UI exposes fixed OTP instructions for production users.

3. Data hygiene
   - no seed emails exist in production user records (`@baleanchor.local` and known seed addresses).
   - no seed-linked sessions remain.
   - no seed-linked OTP challenges remain.

4. Code and docs hygiene
   - no production runbook references fixed OTP usage.
   - no production automation enables reseed/reset endpoints.

5. Verification
   - Phase 9 publish gates pass.
   - manual spot-check confirms standard OTP-only auth flow is active.

## Optional hard-removal mode

If fully removing seed capability from code:

1. Remove `DevelopmentSeedHostedService` registration from startup.
2. Remove `DevelopmentSeedDataService` dependencies and implementation.
3. Remove `SeedAccessOptions` and validator wiring.
4. Remove `/api/system/dev-seed` routes.
5. Re-run full quality gates.
