# Backup and Restore Runbook

## Purpose

Define operational backup and restore steps for JSON persistence under `Database/Collections`.

## Backup strategy

### Minimum cadence

- Daily scheduled snapshot of the full `Database` directory.
- Additional pre-deploy snapshot before each production release.

### Backup content

- `Database/Collections`
- `Database` subfolders used for indexes/temp/quarantine if present
- deployment config snapshot (non-secret)

## Backup procedure (manual baseline)

1. Ensure no long-running maintenance task is mid-write.
2. Optionally stop service for highest consistency snapshot.
3. Copy `Database` directory to timestamped backup path.
4. Record backup metadata:
   - timestamp UTC
   - operator
   - deployment version/build id
   - storage location

Example:

```powershell
$root = "C:\services\BaleAnchorUtility"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$backupRoot = "D:\baleanchor-backups"
$target = Join-Path $backupRoot "Database-$timestamp"
Copy-Item -Path (Join-Path $root "Database") -Destination $target -Recurse -Force
```

## Restore procedure

1. Stop application service.
2. Copy current `Database` to a safety rollback folder.
3. Restore selected backup `Database` folder into service root.
4. Start service.
5. Verify startup logs report successful index rebuild.
6. Verify `/health/ready` returns success.
7. Validate key flows:
   - resident login
   - statement periods load
   - admin approvals load

## Restore dry-run guidance

- Perform dry-run restore in a non-production environment using a copied deployment directory.
- Confirm application boots and primary flows function.
- Record dry-run date and outcome.

## Failure handling

If restore validation fails:

1. Stop service.
2. Restore pre-restore safety copy.
3. Restart service.
4. Escalate incident using incident checklist.
