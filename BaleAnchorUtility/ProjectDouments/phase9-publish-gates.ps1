param(
    [switch]$SkipQualityGates,
    [switch]$SkipPublish
)

$ErrorActionPreference = "Stop"

$databaseSnapshotPath = $null

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Command,
        [Parameter(Mandatory = $true)]
        [string]$ErrorMessage
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw $ErrorMessage
    }
}

function Assert-FileExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$ErrorMessage
    )

    if (-not (Test-Path $Path)) {
        throw $ErrorMessage
    }
}

Push-Location $PSScriptRoot
try {
    Set-Location ..

    # Keep the working tree deterministic by restoring the Database folder after gates run.
    $databasePath = Join-Path (Get-Location) "Database"
    if (Test-Path $databasePath) {
        $databaseSnapshotPath = Join-Path ([System.IO.Path]::GetTempPath()) ("bau-phase9-db-snapshot-" + [Guid]::NewGuid().ToString("N"))
        Copy-Item -Path $databasePath -Destination $databaseSnapshotPath -Recurse -Force
    }

    if (-not $SkipQualityGates) {
        Write-Host "[Phase9] Running Phase 8 quality gates..."
        Invoke-Step -Command { .\ProjectDouments\phase8-quality-gates.ps1 } -ErrorMessage "Phase 8 quality gates failed."
    }

    Write-Host "[Phase9] Validating required operations documents..."
    $requiredDocs = @(
        ".\ProjectDouments\PRODUCTION_CONFIGURATION_MATRIX.md",
        ".\ProjectDouments\ENVIRONMENT_AND_SECRETS.md",
        ".\ProjectDouments\DEPLOYMENT_RUNBOOK.md",
        ".\ProjectDouments\BACKUP_RESTORE_RUNBOOK.md",
        ".\ProjectDouments\INCIDENT_SUPPORT_CHECKLIST.md",
        ".\ProjectDouments\SEED_DATA_PRODUCTION_REMOVAL_CHECKLIST.md",
        ".\ProjectDouments\GO_LIVE_VERIFICATION_CHECKLIST.md",
        ".\ProjectDouments\PHASE9_PUBLISH_READINESS_NOTES.md"
    )

    foreach ($doc in $requiredDocs) {
        Assert-FileExists -Path $doc -ErrorMessage "Required document missing: $doc"
    }

    Write-Host "[Phase9] Validating production safety settings in appsettings.json..."
    $appsettings = Get-Content ".\BaleAnchorUtility.Server\appsettings.json" -Raw | ConvertFrom-Json

    if ($appsettings.SeedAccess.Enabled -ne $false) {
        throw "Production appsettings must have SeedAccess.Enabled=false."
    }

    if ($appsettings.SeedAccess.FixedOtpCode -and $appsettings.SeedAccess.FixedOtpCode.Trim().Length -gt 0) {
        throw "Production appsettings must not include SeedAccess.FixedOtpCode."
    }

    if ($appsettings.SeedAccess.Accounts -and $appsettings.SeedAccess.Accounts.Count -gt 0) {
        throw "Production appsettings must not include seed account entries."
    }

    if ($appsettings.EmailTransport.SmtpPassword -and $appsettings.EmailTransport.SmtpPassword.Trim().Length -gt 0) {
        throw "Production appsettings must not store EmailTransport.SmtpPassword. Use environment secrets."
    }

    if ($appsettings.PushNotifications.VapidPrivateKey -and $appsettings.PushNotifications.VapidPrivateKey.Trim().Length -gt 0) {
        throw "Production appsettings must not store PushNotifications.VapidPrivateKey. Use environment secrets."
    }

    Write-Host "[Phase9] Running release publish rehearsal..."
    if (-not $SkipPublish) {
        $publishDir = Join-Path (Get-Location) "artifacts\publish\server"
        if (Test-Path $publishDir) {
            Remove-Item $publishDir -Recurse -Force
        }

        Invoke-Step -Command { dotnet publish .\BaleAnchorUtility.Server\BaleAnchorUtility.Server.csproj -c Release -o $publishDir } -ErrorMessage "Server publish failed."
        Assert-FileExists -Path (Join-Path $publishDir "BaleAnchorUtility.Server.dll") -ErrorMessage "Published server artifact missing BaleAnchorUtility.Server.dll"
    }

    Write-Host "[Phase9] Publish readiness gates passed."
}
finally {
    if ($databaseSnapshotPath -and (Test-Path $databaseSnapshotPath)) {
        $databasePath = Join-Path (Get-Location) "Database"
        if (Test-Path $databasePath) {
            Remove-Item $databasePath -Recurse -Force
        }

        Copy-Item -Path $databaseSnapshotPath -Destination $databasePath -Recurse -Force
        Remove-Item $databaseSnapshotPath -Recurse -Force
    }

    Pop-Location
}
