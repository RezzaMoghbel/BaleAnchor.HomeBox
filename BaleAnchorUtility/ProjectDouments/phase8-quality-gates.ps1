param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

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

Push-Location $PSScriptRoot
try {
    Set-Location ..

    Write-Host "[Phase8] Running server tests..."
    Invoke-Step -Command { dotnet test .\BaleAnchorUtility.slnx } -ErrorMessage "Server tests failed."

    Write-Host "[Phase8] Running client tests..."
    Invoke-Step -Command { npm --prefix .\baleanchorutility.client run test -- --run } -ErrorMessage "Client tests failed."

    if (-not $SkipBuild) {
        Write-Host "[Phase8] Running client production build..."
        Invoke-Step -Command { npm --prefix .\baleanchorutility.client run build } -ErrorMessage "Client build failed."
    }

    Write-Host "[Phase8] Quality gates passed."
}
finally {
    Pop-Location
}
