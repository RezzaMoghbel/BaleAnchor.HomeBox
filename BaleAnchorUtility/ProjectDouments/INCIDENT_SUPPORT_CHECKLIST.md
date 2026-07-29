# Incident and Support Checklist

## Severity levels

- `SEV-1`: Full outage, authentication unavailable, major data-access failure.
- `SEV-2`: Partial outage, degraded core flow, high error rates.
- `SEV-3`: Minor issue, workaround exists, no major data impact.

## Initial triage (first 15 minutes)

1. Capture timestamp and reporter details.
2. Classify severity.
3. Confirm current deployment version/build id.
4. Check `/health/live` and `/health/ready`.
5. Check recent logs for:
   - startup option validation failures
   - unexpected error bursts
   - CSRF/rate-limit spikes

## Functional impact checks

- Login request-code and verify-code behavior.
- Resident dashboard and statement period loading.
- Admin approvals endpoint behavior.
- Payment or readings submission error rates.

## Data-safety checks

- Confirm no cross-tenant data leakage symptoms.
- Confirm no unauthorized admin actions.
- Confirm audit log writes are still occurring for admin financial actions.

## Mitigation options

1. Configuration rollback if recent config change caused incident.
2. Deployment rollback using deployment runbook.
3. Restore from backup if data corruption is confirmed.

## Communication checklist

- Internal update every 30 minutes for active SEV-1/SEV-2 incidents.
- Include:
  - current severity
  - affected flows
  - mitigation in progress
  - next update time

## Incident closure checklist

1. Service restored and health checks stable.
2. Core flows validated manually.
3. Root cause documented.
4. Follow-up actions created with owners and due dates.
5. Run Phase 8 and Phase 9 gates before next deployment.
