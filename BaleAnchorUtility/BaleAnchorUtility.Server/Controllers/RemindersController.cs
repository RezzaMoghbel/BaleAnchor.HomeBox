using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Notifications;
using BaleAnchorUtility.Server.Application.Notifications.Dtos;
using BaleAnchorUtility.Server.Infrastructure.Errors;
using Microsoft.AspNetCore.Mvc;

namespace BaleAnchorUtility.Server.Controllers;

[ApiController]
[Route("api/v1/reminders")]
public sealed class RemindersController : ControllerBase
{
    private readonly AuthService authService;
    private readonly NotificationPreferencesService preferencesService;
    private readonly ReminderDispatchService reminderDispatchService;

    public RemindersController(
        AuthService authService,
        NotificationPreferencesService preferencesService,
        ReminderDispatchService reminderDispatchService)
    {
        this.authService = authService;
        this.preferencesService = preferencesService;
        this.reminderDispatchService = reminderDispatchService;
    }

    [HttpGet("preferences")]
    [ProducesResponseType(typeof(NotificationPreferencesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<NotificationPreferencesResponse>> GetPreferences(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await preferencesService.GetForUserAsync(userId, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "REMINDERS_PREFERENCES_CONFLICT");
        }
    }

    [HttpPut("preferences")]
    [ProducesResponseType(typeof(NotificationPreferencesResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<NotificationPreferencesResponse>> UpdatePreferences(
        [FromBody] UpdateNotificationPreferencesRequest request,
        CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = await preferencesService.UpdateForUserAsync(userId, request, cancellationToken);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "REMINDERS_PREFERENCES_CONFLICT");
        }
    }

    [HttpGet("jobs")]
    [ProducesResponseType(typeof(ReminderJobListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReminderJobListResponse>> GetJobs(CancellationToken cancellationToken)
    {
        var userId = await ResolveUserIdAsync(cancellationToken);
        if (userId is null)
        {
            return Unauthorized();
        }

        try
        {
            return Ok(await reminderDispatchService.GetUserReminderJobsAsync(userId, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "REMINDERS_JOB_LIST_CONFLICT");
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
