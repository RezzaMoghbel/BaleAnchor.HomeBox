# Go-Live Verification Checklist

## Before cutover

1. Phase 8 quality gates pass.
2. Phase 9 publish gates pass.
3. Production secrets are present and validated.
4. Seed removal checklist is complete.
5. Backup snapshot taken and restore dry-run record available.

## Cutover validation

1. Health endpoints
   - `/health/live` is healthy.
   - `/health/ready` is healthy.

2. Authentication
   - request-code succeeds for approved user.
   - verify-code succeeds and issues cookie session.

3. Resident core flow
   - dashboard loads.
   - latest readings load.
   - statement periods load.

4. Admin core flow
   - admin pending approvals endpoint is reachable by admin.
   - admin endpoint is denied for resident role.

5. Notifications
   - reminder preference endpoint responds for authenticated resident.
   - push config endpoint returns expected mode/deep link.

6. Security checks
   - unauthenticated protected routes are rejected.
   - CSRF protection rejects authenticated write without trusted origin.

## Post go-live monitoring window

- Monitor logs and health every 15 minutes for first 2 hours.
- Track 4xx/5xx spikes and rate-limit anomalies.
- Confirm no unexpected `UNEXPECTED_ERROR` ProblemDetails bursts.

## Sign-off

Record:

- deployment timestamp UTC
- build identifier
- operator
- checklist completion status
- any accepted residual risks
