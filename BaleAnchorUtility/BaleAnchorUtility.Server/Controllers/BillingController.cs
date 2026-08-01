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
    private readonly PaymentService paymentService;

    public BillingController(
        AuthService authService,
        BillingInputService billingInputService,
        CalculationSnapshotService calculationSnapshotService,
        PaymentService paymentService)
    {
        this.authService = authService;
        this.billingInputService = billingInputService;
        this.calculationSnapshotService = calculationSnapshotService;
        this.paymentService = paymentService;
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

    [HttpPut("readings/latest")]
    [ProducesResponseType(typeof(SubmitReadingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SubmitReadingsResponse>> UpdateLatestReadings([FromBody] SubmitReadingsRequest request, CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await billingInputService.UpdateLatestReadingsAsync(userId, request, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_READING_UPDATE_CONFLICT");
        }
    }

    [HttpGet("readings/latest")]
    [ProducesResponseType(typeof(LatestReadingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
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
            if (string.Equals(ex.Message, "No readings have been submitted yet.", StringComparison.Ordinal))
            {
                return NoContent();
            }

            return ConflictProblem(ex.Message, "BILLING_READING_NOT_AVAILABLE");
        }
    }

    [HttpDelete("readings/latest")]
    [ProducesResponseType(typeof(DeleteLatestReadingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DeleteLatestReadingResponse>> DeleteLatestReading(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await billingInputService.DeleteLatestReadingAsync(userId, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_READING_DELETE_CONFLICT");
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

    [HttpGet("tariffs/options")]
    [ProducesResponseType(typeof(TariffOptionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TariffOptionsResponse>> GetTariffOptions([FromQuery] string? onDate, CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await billingInputService.GetTariffOptionsAsync(userId, onDate, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_TARIFF_NOT_AVAILABLE");
        }
    }

    [HttpPost("boiler-assumptions")]
    [ProducesResponseType(typeof(UpsertBoilerAssumptionVersionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UpsertBoilerAssumptionVersionResponse>> UpsertBoilerAssumptionVersion(
        [FromBody] UpsertBoilerAssumptionVersionRequest request,
        CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await billingInputService.UpsertBoilerAssumptionVersionAsync(userId, request, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_BOILER_ASSUMPTIONS_CONFLICT");
        }
    }

    [HttpGet("boiler-assumptions/active")]
    [ProducesResponseType(typeof(ActiveBoilerAssumptionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ActiveBoilerAssumptionResponse>> GetActiveBoilerAssumption(
        [FromQuery] string? onDate,
        CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await billingInputService.GetActiveBoilerAssumptionAsync(userId, onDate, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_BOILER_ASSUMPTIONS_NOT_AVAILABLE");
        }
    }

    [HttpGet("boiler-assumptions/options")]
    [ProducesResponseType(typeof(BoilerAssumptionOptionsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BoilerAssumptionOptionsResponse>> GetBoilerAssumptionOptions(
        [FromQuery] string? onDate,
        CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await billingInputService.GetBoilerAssumptionOptionsAsync(userId, onDate, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_BOILER_ASSUMPTIONS_NOT_AVAILABLE");
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

    [HttpPost("calculations/latest/payment")]
    [ProducesResponseType(typeof(RecordLatestPeriodPaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RecordLatestPeriodPaymentResponse>> RecordLatestPeriodPayment(
        [FromBody] RecordLatestPeriodPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await paymentService.RecordLatestPeriodPaymentAsync(userId, request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            var field = string.Equals(ex.ParamName, nameof(RecordLatestPeriodPaymentRequest.Method), StringComparison.Ordinal)
                ? "method"
                : string.Equals(ex.ParamName, nameof(RecordLatestPeriodPaymentRequest.Reference), StringComparison.Ordinal)
                    ? "reference"
                    : string.Equals(ex.ParamName, nameof(RecordLatestPeriodPaymentRequest.Notes), StringComparison.Ordinal)
                        ? "notes"
                        : "request";

            return ValidationProblem(ex.Message, field, "BILLING_PAYMENT_VALIDATION");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_PAYMENT_CONFLICT");
        }
    }

    [HttpGet("calculations/latest/payment")]
    [ProducesResponseType(typeof(LatestPeriodPaymentSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LatestPeriodPaymentSummaryResponse>> GetLatestPeriodPaymentSummary(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await paymentService.GetLatestPeriodSummaryAsync(userId, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_PAYMENT_NOT_AVAILABLE");
        }
    }

    [HttpGet("payments/balance")]
    [ProducesResponseType(typeof(AllTimeBalanceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AllTimeBalanceResponse>> GetAllTimeBalance(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await paymentService.GetAllTimeBalanceAsync(userId, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_BALANCE_CONFLICT");
        }
    }

    [HttpGet("payments/history")]
    [ProducesResponseType(typeof(PaymentHistoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PaymentHistoryResponse>> GetPaymentHistory(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await paymentService.GetPaymentHistoryAsync(userId, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_PAYMENT_HISTORY_CONFLICT");
        }
    }

    [HttpDelete("payments/{paymentId}")]
    [ProducesResponseType(typeof(DeletePaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DeletePaymentResponse>> DeletePayment(string paymentId, CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await paymentService.DeletePaymentAsync(userId, paymentId, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, "paymentId", "BILLING_PAYMENT_VALIDATION");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundProblem(ex.Message, "BILLING_PAYMENT_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_PAYMENT_CONFLICT");
        }
    }

    [HttpPut("payments/{paymentId}")]
    [ProducesResponseType(typeof(UpdatePaymentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UpdatePaymentResponse>> UpdatePayment(
        string paymentId,
        [FromBody] UpdatePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await paymentService.UpdatePaymentAsync(userId, paymentId, request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            var field = string.Equals(ex.ParamName, nameof(paymentId), StringComparison.Ordinal)
                ? "paymentId"
                : string.Equals(ex.ParamName, nameof(UpdatePaymentRequest.Method), StringComparison.Ordinal)
                    ? "method"
                    : string.Equals(ex.ParamName, nameof(UpdatePaymentRequest.Reference), StringComparison.Ordinal)
                        ? "reference"
                        : string.Equals(ex.ParamName, nameof(UpdatePaymentRequest.Notes), StringComparison.Ordinal)
                            ? "notes"
                            : "request";

            return ValidationProblem(ex.Message, field, "BILLING_PAYMENT_VALIDATION");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundProblem(ex.Message, "BILLING_PAYMENT_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_PAYMENT_CONFLICT");
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

    private ObjectResult NotFoundProblem(string detail, string errorCode)
    {
        var problem = ApiProblemDetailsFactory.Create(
            HttpContext,
            StatusCodes.Status404NotFound,
            "Resource not found",
            detail,
            errorCode);

        return new ObjectResult(problem)
        {
            StatusCode = StatusCodes.Status404NotFound,
            ContentTypes = { "application/problem+json" },
        };
    }

    private ObjectResult ValidationProblem(string detail, string field, string errorCode)
    {
        var problem = new ValidationProblemDetails(new Dictionary<string, string[]>
        {
            [field] = [detail],
        })
        {
            Type = "https://api.baleanchor.local/errors/validation",
            Title = "Validation failed",
            Status = StatusCodes.Status400BadRequest,
            Detail = "One or more validation errors occurred.",
            Instance = HttpContext.Request.Path,
        };

        ApiProblemDetailsFactory.AddStandardExtensions(HttpContext, problem, errorCode);

        return new BadRequestObjectResult(problem)
        {
            ContentTypes = { "application/problem+json" },
        };
    }
}
