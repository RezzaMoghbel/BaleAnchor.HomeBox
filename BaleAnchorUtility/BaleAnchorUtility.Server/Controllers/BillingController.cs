using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Billing;
using BaleAnchorUtility.Server.Application.Billing.Dtos;
using BaleAnchorUtility.Server.Application.Calculations;
using BaleAnchorUtility.Server.Application.Calculations.Dtos;
using BaleAnchorUtility.Server.Infrastructure.Errors;
using Microsoft.AspNetCore.Mvc;

namespace BaleAnchorUtility.Server.Controllers;

[ApiController]
[Route("api/v1/billing")]
public sealed class BillingController : ControllerBase
{
    private readonly AuthService authService;
    private readonly BillingInputService billingInputService;
    private readonly CalculationSnapshotService calculationSnapshotService;

    public BillingController(
        AuthService authService,
        BillingInputService billingInputService,
        CalculationSnapshotService calculationSnapshotService)
    {
        this.authService = authService;
        this.billingInputService = billingInputService;
        this.calculationSnapshotService = calculationSnapshotService;
    }

    [HttpPost("readings")]
    [ProducesResponseType(typeof(SubmitReadingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SubmitReadingsResponse>> SubmitReadings([FromBody] SubmitReadingsRequest request, CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await billingInputService.SubmitReadingsAsync(userId, request, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_READING_CONFLICT");
        }
    }

    [HttpGet("readings/latest")]
    [ProducesResponseType(typeof(LatestReadingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LatestReadingsResponse>> GetLatestReadings(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await billingInputService.GetLatestReadingsAsync(userId, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_READING_NOT_AVAILABLE");
        }
    }

    [HttpPost("tariffs")]
    [ProducesResponseType(typeof(UpsertTariffResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UpsertTariffResponse>> UpsertTariff([FromBody] UpsertTariffRequest request, CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await billingInputService.UpsertTariffAsync(userId, request, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_TARIFF_CONFLICT");
        }
    }

    [HttpGet("tariffs/active")]
    [ProducesResponseType(typeof(ActiveTariffResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ActiveTariffResponse>> GetActiveTariff([FromQuery] string? onDate, CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await billingInputService.GetActiveTariffAsync(userId, onDate, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_TARIFF_NOT_AVAILABLE");
        }
    }

    [HttpPost("calculations/latest")]
    [ProducesResponseType(typeof(CalculateLatestPeriodResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CalculateLatestPeriodResponse>> CalculateLatestPeriod(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await calculationSnapshotService.CalculateLatestPeriodAsync(userId, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_CALCULATION_CONFLICT");
        }
    }

    [HttpGet("calculations/latest")]
    [ProducesResponseType(typeof(CalculateLatestPeriodResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CalculateLatestPeriodResponse>> GetLatestCalculation(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await calculationSnapshotService.GetLatestSnapshotAsync(userId, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_CALCULATION_NOT_AVAILABLE");
        }
    }

    private async Task<string?> ResolveUserIdAsync(CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(authService.SessionCookieName, out var rawToken);
        var sessionStatus = await authService.GetSessionStatusAsync(rawToken, cancellationToken);

        if (!sessionStatus.IsAuthenticated || string.IsNullOrWhiteSpace(sessionStatus.UserId))
        {
            return null;
        }

        return sessionStatus.UserId;
    }

    private ObjectResult ConflictProblem(string detail, string errorCode)
    {
        var problem = ApiProblemDetailsFactory.Create(
            HttpContext,
            StatusCodes.Status409Conflict,
            "Conflict",
            detail,
            errorCode);

        return new ObjectResult(problem)
        {
            StatusCode = StatusCodes.Status409Conflict,
            ContentTypes = { "application/problem+json" },
        };
    }
}
