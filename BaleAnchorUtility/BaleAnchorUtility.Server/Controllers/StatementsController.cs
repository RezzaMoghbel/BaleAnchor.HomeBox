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
        Request.Cookies.TryGetValue(authService.SessionCookieName, out var rawToken);
        var sessionStatus = await authService.GetSessionStatusAsync(rawToken, cancellationToken);

        if (!sessionStatus.IsAuthenticated || string.IsNullOrWhiteSpace(sessionStatus.UserId))
        {
            return Unauthorized();
        }

        try
        {
            var response = await statementSummaryService.GetLatestSummaryAsync(sessionStatus.UserId, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            var problem = ApiProblemDetailsFactory.Create(
                HttpContext,
                StatusCodes.Status409Conflict,
                "Conflict",
                ex.Message,
                "BILLING_STATEMENT_CONFLICT");

            return new ObjectResult(problem)
            {
                StatusCode = StatusCodes.Status409Conflict,
                ContentTypes = { "application/problem+json" },
            };
        }
    }
}
