using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Billing;
using BaleAnchorUtility.Server.Application.Billing.Dtos;
using BaleAnchorUtility.Server.Infrastructure.Errors;
using Microsoft.AspNetCore.Mvc;

namespace BaleAnchorUtility.Server.Controllers;

[ApiController]
[Route("api/v1/billing/statements")]
public sealed class StatementsController : ControllerBase
{
    private readonly AuthService authService;
    private readonly StatementSummaryService statementSummaryService;

    public StatementsController(AuthService authService, StatementSummaryService statementSummaryService)
    {
        this.authService = authService;
        this.statementSummaryService = statementSummaryService;
    }

    [HttpGet("latest-summary")]
    [ProducesResponseType(typeof(LatestStatementSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LatestStatementSummaryResponse>> GetLatestSummary(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await statementSummaryService.GetLatestSummaryAsync(userId, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_STATEMENT_CONFLICT");
        }
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(LatestStatementSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LatestStatementSummaryResponse>> GetSelectedSummary(
        [FromQuery] string? snapshotId,
        [FromQuery] string? periodStartDate,
        [FromQuery] string? periodEndDateExclusive,
        CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await statementSummaryService.GetSelectedSummaryAsync(
                userId,
                snapshotId,
                periodStartDate,
                periodEndDateExclusive,
                cancellationToken);

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, "selection", "BILLING_STATEMENT_VALIDATION");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundProblem(ex.Message, "BILLING_STATEMENT_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_STATEMENT_CONFLICT");
        }
    }

    [HttpGet("periods")]
    [ProducesResponseType(typeof(StatementPeriodListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StatementPeriodListResponse>> GetStatementPeriods(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var response = await statementSummaryService.GetStatementPeriodsAsync(userId, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "BILLING_STATEMENT_CONFLICT");
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
