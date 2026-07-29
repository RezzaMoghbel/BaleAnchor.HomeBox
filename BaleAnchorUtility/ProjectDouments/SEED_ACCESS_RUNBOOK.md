# Seed Access Runbook

> Scope: local development and demo environments only
> Source of truth: `CLAUDE.md`, `PRODUCTION_PLAN.md`
> Status: active while `SeedAccess:Enabled=true` in Development

## 1. Purpose

This runbook explains how to use the development-only seed access mechanism, how to reseed or delete demo data, and how to remove the mechanism before production.

This runbook does not change the production authentication model.
Production authentication remains email OTP only.

## 2. Seed access summary

Seed access is currently implemented through:

- `BaleAnchorUtility.Server/Configuration/SeedAccessOptions.cs`
- `BaleAnchorUtility.Server/Infrastructure/Startup/DevelopmentSeedHostedService.cs`
- `BaleAnchorUtility.Server/Infrastructure/Startup/DevelopmentSeedDataService.cs`
- `BaleAnchorUtility.Server/appsettings.Development.json`
- `BaleAnchorUtility.Server/Controllers/SystemController.cs`

The mechanism is intended to be:

- enabled only in Development
- easy to demo
- easy to reset
- easy to delete before production

## 3. Current development credentials

Fixed development OTP code:

- `123456`

Seed emails:

- `superadmin@baleanchor.local`
- `admin@baleanchor.local`
- `resident.active@baleanchor.local`
- `resident.onboarding@baleanchor.local`
- `resident.pending@baleanchor.local`

## 4. Seeded demo data currently provided

The active resident seed currently includes demo data for the main resident flow:

- accepted active terms
- utility setup baseline
- two readings forming one calculation period
- two tariff versions across the same period
- one generated calculation snapshot
- one resident payment
- one statement export history record

This is designed to make the resident dashboard, payments, statements, and export flows immediately usable.

## 5. How to use seed access

### 5.1 Start the system

Run the server in Development.

Expected config source:

- `BaleAnchorUtility.Server/appsettings.Development.json`

Important setting:

- `SeedAccess:Enabled = true`

### 5.2 Login flow

1. Open the client.
2. Enter one of the seed emails.
3. Request a code.
4. Use `123456` as the OTP code.
5. Verify and continue through the normal app flow.

### 5.3 Expected role coverage

- `superadmin@baleanchor.local`: admin route access, role-management path
- `admin@baleanchor.local`: admin approvals path without superadmin-only role escalation powers
- `resident.active@baleanchor.local`: direct resident flow with seeded readings/payments/statements data
- `resident.onboarding@baleanchor.local`: onboarding path coverage
- `resident.pending@baleanchor.local`: pending-approval queue coverage for admin approval and rejection walkthroughs

## 6. Dev seed API operations

These endpoints are development-only operational helpers.

### 6.1 Get seed status

Request:

```powershell
Invoke-RestMethod -Method Get https://localhost:7176/api/system/dev-seed
```

Expected result:

- confirms development seed access is enabled
- returns the fixed OTP code
- returns configured seed emails

### 6.2 Reseed demo data

Request:

```powershell
Invoke-RestMethod -Method Post https://localhost:7176/api/system/dev-seed
```

Behavior:

- removes current seed data
- recreates seed users
- recreates resident demo billing data

Use this when the seeded demo flow has become messy during testing.

### 6.3 Delete seed data

Request:

```powershell
Invoke-RestMethod -Method Delete https://localhost:7176/api/system/dev-seed
```

Behavior:

- removes seeded users
- removes seed sessions and OTP challenges
- removes seeded onboarding/billing/payment/statement/export records
- removes seed-linked audit log records

Use this when testing clean-start behavior or preparing for production cleanup.

## 7. What reset/reseed currently touches

The reset path currently removes seeded records from these collections when they belong to configured seed users:

- `Users`
- `Sessions`
- `OtpChallenges`
- `TermsAcceptances`
- `UtilitySetups`
- `Tariffs`
- `ReadingSubmissions`
- `CalculationSnapshots`
- `Payments`
- `StatementExports`
- `AuditLogs`

## 8. Troubleshooting

### 8.1 Seed status endpoint returns 404

Check:

- app is running in Development
- `SeedAccess:Enabled` is `true`
- the server restarted after config changes

### 8.2 OTP request works but visible code is missing

Check:

- the email is one of the configured seed emails
- `SeedAccess:Enabled` is still `true`
- environment is Development

### 8.3 Resident demo data is missing or inconsistent

Run the reseed command:

```powershell
Invoke-RestMethod -Method Post https://localhost:7176/api/system/dev-seed
```

Then sign in again with the seeded resident account.

### 8.4 Admin route is unavailable

Check which seed account you used:

- resident accounts should not see admin-only routes
- `admin@baleanchor.local` and `superadmin@baleanchor.local` should

## 9. Production removal checklist

Before any production publish, complete all of the following:

1. Set `SeedAccess:Enabled` to `false` in production configuration.
2. Remove any development-only seed accounts from persisted data.
3. Remove `DevelopmentSeedHostedService` registration if the mechanism is no longer needed.
4. Remove `DevelopmentSeedDataService` and `SeedAccessOptions` if seed access is being fully retired.
5. Remove `/api/system/dev-seed` endpoints from `SystemController`.
6. Remove any client messaging that exposes development OTP codes.
7. Confirm production auth still uses only the normal OTP flow.
8. Confirm no seed JSON documents remain under `Database/Collections`.
9. Confirm no production runbook or deploy config references fixed demo credentials.

## 10. Owner note

If we keep this mechanism for future local development after production launch, it must remain:

- disabled by default
- development-only
- clearly documented as non-production
- easy to remove in one short cleanup slice
