using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Onboarding;
using BaleAnchorUtility.Server.Application.Onboarding.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace BaleAnchorUtility.Server.Controllers;

[ApiController]
[Route("api/v1/onboarding")]
public sealed class OnboardingController : ControllerBase
{
    private readonly OnboardingService onboardingService;
    private readonly AuthService authService;

    public OnboardingController(OnboardingService onboardingService, AuthService authService)
    {
        this.onboardingService = onboardingService;
        this.authService = authService;
    }

    [HttpPost("profile")]
    [ProducesResponseType(typeof(CompleteProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CompleteProfileResponse>> CompleteProfile([FromBody] CompleteProfileRequest request, CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(authService.SessionCookieName, out var rawToken);
        var sessionStatus = await authService.GetSessionStatusAsync(rawToken, cancellationToken);

        if (!sessionStatus.IsAuthenticated || string.IsNullOrWhiteSpace(sessionStatus.UserId))
        {
            return Unauthorized();
        }

        try
        {
            var response = await onboardingService.CompleteProfileAsync(sessionStatus.UserId, request, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException)
        {
            return Conflict();
        }
    }
}
