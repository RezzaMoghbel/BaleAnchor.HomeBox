# Deployment Runbook

## Scope

Release deployment rehearsal for BaleAnchor Utility server and client artifacts.

## Pre-deploy prerequisites

1. Phase 8 quality gates pass.
2. Phase 9 publish gates pass.
3. Production config matrix is reviewed.
4. Runtime secrets are provisioned.

## Release build commands

Run from repository root (`BaleAnchorUtility`):

```powershell
# server + tests + client build gates
.\ProjectDouments\phase9-publish-gates.ps1

# release publish artifact
$publishDir = Join-Path (Get-Location) "artifacts\publish\server"
dotnet publish .\BaleAnchorUtility.Server\BaleAnchorUtility.Server.csproj -c Release -o $publishDir
```

## Artifact expectations

Expected publish output under `artifacts/publish/server`:

- `BaleAnchorUtility.Server.dll`
- `appsettings.json` (non-secret baseline)
- static web assets manifest/output

## Deployment steps (single-host baseline)

1. Stop running service/process.
2. Backup current deployment directory.
3. Copy new publish artifact directory to target.
4. Apply environment variables/secrets on host.
5. Start service.
6. Verify health endpoints:
   - `/health/live`
   - `/health/ready`
7. Run smoke checks:
   - auth request-code and verify-code flow
   - resident dashboard load
   - admin approvals load

## Rollback steps

1. Stop service.
2. Restore previous deployment directory backup.
3. Restore previous environment variable set if changed.
4. Start service.
5. Re-check `/health/live` and `/health/ready`.
6. Validate login flow and one resident read path.

## Post-deploy checks

- Check logs for startup validation failures.
- Check logs for CSRF/rate-limit anomalies.
- Confirm no development seed endpoint usage in production telemetry.
