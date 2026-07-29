using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Auth.Dtos;
using BaleAnchorUtility.Server.Infrastructure.Errors;
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

    [HttpPost("signup-request-code")]
    [ProducesResponseType(typeof(RequestCodeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<RequestCodeResponse>> SignupRequestCode([FromBody] SignupRequestCodeRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var response = await authService.SignupRequestCodeAsync(
                request,
                GetIpAddress(),
                cancellationToken);

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return CreateConflictProblem(ex.Message, "SIGNUP_CONFLICT");
        }
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

    [HttpPost("password-login")]
    [ProducesResponseType(typeof(VerifyCodeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VerifyCodeResponse>> PasswordLogin([FromBody] PasswordLoginRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.PasswordLoginAsync(
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

    [HttpGet("mode")]
    [ProducesResponseType(typeof(AuthModeResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthModeResponse>> Mode(CancellationToken cancellationToken)
    {
        var mode = await authService.GetAuthModeAsync(cancellationToken);
        return Ok(mode);
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

    private ObjectResult CreateConflictProblem(string detail, string errorCode)
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
