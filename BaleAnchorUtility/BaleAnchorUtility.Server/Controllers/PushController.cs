using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Notifications;
using BaleAnchorUtility.Server.Application.Notifications.Dtos;
using BaleAnchorUtility.Server.Infrastructure.Errors;
using Microsoft.AspNetCore.Mvc;

namespace BaleAnchorUtility.Server.Controllers;

[ApiController]
[Route("api/v1/push")]
public sealed class PushController : ControllerBase
{
    private readonly AuthService authService;
    private readonly PushNotificationService pushNotificationService;

    public PushController(AuthService authService, PushNotificationService pushNotificationService)
    {
        this.authService = authService;
        this.pushNotificationService = pushNotificationService;
    }

    [HttpGet("config")]
    [ProducesResponseType(typeof(PushPublicConfigResponse), StatusCodes.Status200OK)]
    public ActionResult<PushPublicConfigResponse> GetPublicConfig()
    {
        return Ok(pushNotificationService.GetPublicConfig());
    }

    [HttpGet("subscriptions")]
    [ProducesResponseType(typeof(PushSubscriptionListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PushSubscriptionListResponse>> GetSubscriptions(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await pushNotificationService.GetSubscriptionsAsync(userId, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "PUSH_SUBSCRIPTIONS_CONFLICT");
        }
    }

    [HttpPost("subscriptions")]
    [ProducesResponseType(typeof(PushSubscriptionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PushSubscriptionResponse>> UpsertSubscription(
        [FromBody] UpsertPushSubscriptionRequest request,
        CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await pushNotificationService.UpsertSubscriptionAsync(userId, request, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "PUSH_SUBSCRIPTIONS_CONFLICT");
        }
    }

    [HttpDelete("subscriptions/{subscriptionId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteSubscription(string subscriptionId, CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            await pushNotificationService.DeleteSubscriptionAsync(userId, subscriptionId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundProblem(ex.Message, "PUSH_SUBSCRIPTION_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "PUSH_SUBSCRIPTIONS_CONFLICT");
        }
    }

    [HttpPost("test")]
    [ProducesResponseType(typeof(SendTestNotificationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<SendTestNotificationResponse>> SendTest(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await pushNotificationService.SendTestNotificationAsync(userId, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "PUSH_TEST_CONFLICT");
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
}
