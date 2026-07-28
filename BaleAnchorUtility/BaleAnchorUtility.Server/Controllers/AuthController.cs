using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Auth.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace BaleAnchorUtility.Server.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AuthService authService;

    public AuthController(AuthService authService)
    {
        this.authService = authService;
    }

    [HttpPost("request-code")]
    [ProducesResponseType(typeof(RequestCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<RequestCodeResponse>> RequestCode([FromBody] RequestCodeRequest request, CancellationToken cancellationToken)
    {
        var response = await authService.RequestCodeAsync(
            request,
            GetIpAddress(),
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("verify-code")]
    [ProducesResponseType(typeof(VerifyCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerifyCodeResponse>> VerifyCode([FromBody] VerifyCodeRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.VerifyCodeAsync(
            request,
            GetDeviceSummary(),
            GetIpAddress(),
            cancellationToken);

        if (result.Response.Authenticated && result.SessionToken is not null && result.SessionExpiresAtUtc is not null)
        {
            Response.Cookies.Append(
                authService.SessionCookieName,
                result.SessionToken,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = result.SessionExpiresAtUtc,
                    IsEssential = true,
                    Path = "/",
                });
        }

        return Ok(result.Response);
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(authService.SessionCookieName, out var rawToken);
        await authService.LogoutAsync(rawToken, cancellationToken);

        Response.Cookies.Delete(
            authService.SessionCookieName,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Path = "/",
            });

        return NoContent();
    }

    [HttpGet("session")]
    [ProducesResponseType(typeof(SessionStatusResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SessionStatusResponse>> Session(CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(authService.SessionCookieName, out var rawToken);
        var status = await authService.GetSessionStatusAsync(rawToken, cancellationToken);
        return Ok(status);
    }

    private string GetIpAddress()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private string GetDeviceSummary()
    {
        var userAgent = Request.Headers.UserAgent.ToString();
        return string.IsNullOrWhiteSpace(userAgent) ? "unknown" : userAgent;
    }
}
