using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Onboarding;
using BaleAnchorUtility.Server.Application.Onboarding.Dtos;
using BaleAnchorUtility.Server.Infrastructure.Errors;
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

    [HttpGet("progress")]
    [ProducesResponseType(typeof(OnboardingProgressResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<OnboardingProgressResponse>> Progress(CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(authService.SessionCookieName, out var rawToken);
        var sessionStatus = await authService.GetSessionStatusAsync(rawToken, cancellationToken);

        if (!sessionStatus.IsAuthenticated || string.IsNullOrWhiteSpace(sessionStatus.UserId))
        {
            return Unauthorized();
        }

        var progress = await onboardingService.GetProgressAsync(sessionStatus.UserId, cancellationToken);
        return Ok(progress);
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
        catch (InvalidOperationException ex)
        {
            return CreateConflictProblem(ex.Message, "ONBOARDING_PROFILE_CONFLICT");
        }
    }

    [HttpPost("utility-setup")]
    [ProducesResponseType(typeof(CompleteUtilitySetupResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CompleteUtilitySetupResponse>> CompleteUtilitySetup([FromBody] CompleteUtilitySetupRequest request, CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(authService.SessionCookieName, out var rawToken);
        var sessionStatus = await authService.GetSessionStatusAsync(rawToken, cancellationToken);

        if (!sessionStatus.IsAuthenticated || string.IsNullOrWhiteSpace(sessionStatus.UserId))
        {
            return Unauthorized();
        }

        try
        {
            var response = await onboardingService.CompleteUtilitySetupAsync(sessionStatus.UserId, request, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return CreateConflictProblem(ex.Message, "ONBOARDING_UTILITY_CONFLICT");
        }
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
