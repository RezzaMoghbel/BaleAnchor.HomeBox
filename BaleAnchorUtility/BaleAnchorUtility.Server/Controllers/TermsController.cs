using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Terms;
using BaleAnchorUtility.Server.Application.Terms.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace BaleAnchorUtility.Server.Controllers;

[ApiController]
[Route("api/v1/terms")]
public sealed class TermsController : ControllerBase
{
    private readonly TermsService termsService;
    private readonly AuthService authService;

    public TermsController(TermsService termsService, AuthService authService)
    {
        this.termsService = termsService;
        this.authService = authService;
    }

    [HttpGet("active")]
    [ProducesResponseType(typeof(ActiveTermsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ActiveTermsResponse>> GetActive(CancellationToken cancellationToken)
    {
        var active = await termsService.GetActiveAsync(cancellationToken);
        if (active is null)
        {
            return NotFound();
        }

        return Ok(active);
    }

    [HttpPost("{versionId}/accept")]
    [ProducesResponseType(typeof(AcceptTermsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AcceptTermsResponse>> Accept(string versionId, CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(authService.SessionCookieName, out var rawToken);
        var sessionStatus = await authService.GetSessionStatusAsync(rawToken, cancellationToken);

        if (!sessionStatus.IsAuthenticated || string.IsNullOrWhiteSpace(sessionStatus.UserId))
        {
            return Unauthorized();
        }

        try
        {
            var response = await termsService.AcceptAsync(
                sessionStatus.UserId,
                versionId,
                HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                Request.Headers.UserAgent.ToString(),
                cancellationToken);

            return Ok(response);
        }
        catch (InvalidOperationException)
        {
            return Conflict();
        }
    }
}
