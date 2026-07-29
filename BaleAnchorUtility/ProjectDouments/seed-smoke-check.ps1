param(
    [string]$BaseUrl = "https://localhost:7176",
    [switch]$SkipReseed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-Json {
    param(
        [string]$Method,
        [string]$Url,
        [Microsoft.PowerShell.Commands.WebRequestSession]$WebSession,
        [object]$Body
    )

    $invokeParams = @{
        Method = $Method
        Uri = $Url
        Headers = @{ Accept = "application/json" }
        ContentType = "application/json"
    }

    if ($null -ne $WebSession) {
        $invokeParams.WebSession = $WebSession
    }

    if ($PSBoundParameters.ContainsKey("Body")) {
        $invokeParams.Body = ($Body | ConvertTo-Json -Depth 6)
    }

    return Invoke-RestMethod @invokeParams
}

function New-SeedSession {
    param(
        [string]$Email,
        [string]$OtpCode,
        [string]$BaseUrl
    )

    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    $requestCode = Invoke-Json -Method Post -Url "$BaseUrl/api/v1/auth/request-code" -Body @{ email = $Email }
    if ($requestCode.developmentCode -and $requestCode.developmentCode -ne $OtpCode) {
        throw "Seed OTP mismatch for $Email. Expected $OtpCode but server returned $($requestCode.developmentCode)."
    }

    $verify = Invoke-Json -Method Post -Url "$BaseUrl/api/v1/auth/verify-code" -WebSession $session -Body @{
        email = $Email
        code = $OtpCode
    }

    if (-not $verify.authenticated) {
        throw "Expected $Email to authenticate successfully. Server message: $($verify.message)"
    }

    return [pscustomobject]@{
        WebSession = $session
        VerifyResponse = $verify
    }
}

function Assert-Equal {
    param(
        [object]$Actual,
        [object]$Expected,
        [string]$Message
    )

    if ($Actual -ne $Expected) {
        throw "$Message Expected '$Expected' but found '$Actual'."
    }
}

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

Write-Step "Checking development seed availability"
$seedStatus = Invoke-Json -Method Get -Url "$BaseUrl/api/system/dev-seed"
Assert-True ($seedStatus.enabled -eq $true) "Development seed access is not enabled."
$fixedOtpCode = [string]$seedStatus.fixedOtpCode
Assert-True (-not [string]::IsNullOrWhiteSpace($fixedOtpCode)) "Development fixed OTP code was not returned."

if (-not $SkipReseed) {
    Write-Step "Reseeding development demo data"
    $reseedResult = Invoke-Json -Method Post -Url "$BaseUrl/api/system/dev-seed"
    Assert-True ($reseedResult.message -like "*reset and recreated*") "Unexpected reseed response message."
}

Write-Step "Signing in as active resident"
$residentLogin = New-SeedSession -Email "resident.active@baleanchor.local" -OtpCode $fixedOtpCode -BaseUrl $BaseUrl
Assert-Equal $residentLogin.VerifyResponse.userStatus "Active" "Active resident should remain active after login."

$residentSession = Invoke-Json -Method Get -Url "$BaseUrl/api/v1/auth/session" -WebSession $residentLogin.WebSession
Assert-True ($residentSession.isAuthenticated -eq $true) "Resident session should be authenticated."
Assert-Equal $residentSession.userStatus "Active" "Resident session status mismatch."

$residentStatement = Invoke-Json -Method Get -Url "$BaseUrl/api/v1/billing/statements/latest-summary" -WebSession $residentLogin.WebSession
Assert-True (-not [string]::IsNullOrWhiteSpace([string]$residentStatement.periodStartDate)) "Resident latest statement summary should exist."

$residentPayments = Invoke-Json -Method Get -Url "$BaseUrl/api/v1/billing/payments/history" -WebSession $residentLogin.WebSession
Assert-True ([int]$residentPayments.count -ge 1) "Resident payment history should contain seeded records."

Write-Step "Signing in as onboarding resident"
$onboardingLogin = New-SeedSession -Email "resident.onboarding@baleanchor.local" -OtpCode $fixedOtpCode -BaseUrl $BaseUrl
Assert-Equal $onboardingLogin.VerifyResponse.userStatus "TermsPending" "Onboarding resident should remain TermsPending."

Write-Step "Signing in as rejected resident"
$rejectedLogin = New-SeedSession -Email "resident.rejected@baleanchor.local" -OtpCode $fixedOtpCode -BaseUrl $BaseUrl
Assert-Equal $rejectedLogin.VerifyResponse.userStatus "Rejected" "Rejected resident status mismatch."

Write-Step "Signing in as suspended resident"
$suspendedLogin = New-SeedSession -Email "resident.suspended@baleanchor.local" -OtpCode $fixedOtpCode -BaseUrl $BaseUrl
Assert-Equal $suspendedLogin.VerifyResponse.userStatus "Suspended" "Suspended resident status mismatch."

Write-Step "Signing in as admin"
$adminLogin = New-SeedSession -Email "admin@baleanchor.local" -OtpCode $fixedOtpCode -BaseUrl $BaseUrl
Assert-Equal $adminLogin.VerifyResponse.userStatus "Active" "Admin should remain active after login."

$pendingApprovals = Invoke-Json -Method Get -Url "$BaseUrl/api/v1/admin/approvals/pending" -WebSession $adminLogin.WebSession
$pendingEmailMatch = @($pendingApprovals.items | Where-Object { $_.userId -eq "seed-resident-pending-0001" }).Count -gt 0
Assert-True $pendingEmailMatch "Pending approval seed resident was not returned in the admin approval queue."

Write-Step "Signing in as superadmin"
$superAdminLogin = New-SeedSession -Email "superadmin@baleanchor.local" -OtpCode $fixedOtpCode -BaseUrl $BaseUrl
$superAdminSession = Invoke-Json -Method Get -Url "$BaseUrl/api/v1/auth/session" -WebSession $superAdminLogin.WebSession
Assert-Equal $superAdminSession.userRole "SuperAdmin" "Superadmin session role mismatch."

Write-Step "Seed smoke check passed"
Write-Host "All seeded personas and core Phase 1 demo flows validated successfully." -ForegroundColor Green
