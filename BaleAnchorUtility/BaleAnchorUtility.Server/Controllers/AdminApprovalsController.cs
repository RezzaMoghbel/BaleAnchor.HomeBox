using BaleAnchorUtility.Server.Application.Admin;
using BaleAnchorUtility.Server.Application.Admin.Dtos;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Infrastructure.Errors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Controllers;

[ApiController]
[Route("api/v1/admin/approvals")]
public sealed class AdminApprovalsController : ControllerBase
{
    private readonly AuthService authService;
    private readonly IUserRepository userRepository;
    private readonly AdminApprovalService adminApprovalService;
    private readonly AdminSupportAccessService adminSupportAccessService;
    private readonly AdminAccessOptions adminAccessOptions;

    public AdminApprovalsController(
        AuthService authService,
        IUserRepository userRepository,
        AdminApprovalService adminApprovalService,
        AdminSupportAccessService adminSupportAccessService,
        IOptions<AdminAccessOptions> adminAccessOptions)
    {
        this.authService = authService;
        this.userRepository = userRepository;
        this.adminApprovalService = adminApprovalService;
        this.adminSupportAccessService = adminSupportAccessService;
        this.adminAccessOptions = adminAccessOptions.Value;
    }

    [HttpGet("pending")]
    [ProducesResponseType(typeof(PendingApprovalListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PendingApprovalListResponse>> Pending(CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to list pending approvals.", "ADMIN_ACCESS_DENIED");
        }

        var response = await adminApprovalService.GetPendingAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPost("{targetUserId}/approve")]
    [ProducesResponseType(typeof(AdminDecisionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminDecisionResponse>> Approve(string targetUserId, [FromBody] AdminDecisionRequest request, CancellationToken cancellationToken)
    {
        var validationError = ValidateDecisionInput(targetUserId, request);
        if (validationError is not null)
        {
            return validationError;
        }

        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to approve users.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminApprovalService.ApproveAsync(actor.Id, targetUserId, request.Reason, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, "reason", "ADMIN_DECISION_VALIDATION");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_APPROVAL_CONFLICT");
        }
    }

    [HttpPost("{targetUserId}/reject")]
    [ProducesResponseType(typeof(AdminDecisionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminDecisionResponse>> Reject(string targetUserId, [FromBody] AdminDecisionRequest request, CancellationToken cancellationToken)
    {
        var validationError = ValidateDecisionInput(targetUserId, request);
        if (validationError is not null)
        {
            return validationError;
        }

        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to reject users.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminApprovalService.RejectAsync(actor.Id, targetUserId, request.Reason, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, "reason", "ADMIN_DECISION_VALIDATION");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_APPROVAL_CONFLICT");
        }
    }

    [HttpPost("{targetUserId}/suspend")]
    [ProducesResponseType(typeof(AdminDecisionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminDecisionResponse>> Suspend(string targetUserId, [FromBody] AdminDecisionRequest request, CancellationToken cancellationToken)
    {
        return await ExecuteLifecycleActionAsync(targetUserId, request, "suspend", adminApprovalService.SuspendAsync, cancellationToken);
    }

    [HttpPost("{targetUserId}/move-to-onboarding")]
    [ProducesResponseType(typeof(AdminDecisionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminDecisionResponse>> MoveToOnboarding(string targetUserId, [FromBody] AdminDecisionRequest request, CancellationToken cancellationToken)
    {
        return await ExecuteLifecycleActionAsync(targetUserId, request, "move-to-onboarding", adminApprovalService.MoveToOnboardingAsync, cancellationToken);
    }

    [HttpPost("{targetUserId}/reinstate-approved")]
    [ProducesResponseType(typeof(AdminDecisionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminDecisionResponse>> ReinstateApproved(string targetUserId, [FromBody] AdminDecisionRequest request, CancellationToken cancellationToken)
    {
        return await ExecuteLifecycleActionAsync(targetUserId, request, "reinstate-approved", adminApprovalService.ReinstateApprovedAsync, cancellationToken);
    }

    [HttpPost("{targetUserId}/archive")]
    [ProducesResponseType(typeof(AdminDecisionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminDecisionResponse>> Archive(string targetUserId, [FromBody] AdminDecisionRequest request, CancellationToken cancellationToken)
    {
        return await ExecuteLifecycleActionAsync(targetUserId, request, "archive", adminApprovalService.ArchiveAsync, cancellationToken);
    }

    [HttpPost("support/login-on-behalf")]
    [ProducesResponseType(typeof(StartDelegatedSupportSessionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StartDelegatedSupportSessionResponse>> StartDelegatedSupportSession(
        [FromBody] StartDelegatedSupportSessionRequest request,
        CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(authService.SessionCookieName, out var currentRawToken);
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null || actor.Role != UserRole.SuperAdmin)
        {
            return ForbiddenProblem("SuperAdmin permission is required to start delegated support sessions.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var (response, rawToken) = await adminSupportAccessService.StartDelegatedSessionAsync(
                actor,
                request,
                GetDeviceSummary(),
                cancellationToken);

            var actorSessionStatus = await authService.GetSessionStatusAsync(currentRawToken, cancellationToken);
            if (!string.IsNullOrWhiteSpace(currentRawToken)
                && actorSessionStatus.IsAuthenticated
                && DateTimeOffset.TryParse(actorSessionStatus.ExpiresAtUtc, out var actorSessionExpiresAtUtc))
            {
                Response.Cookies.Append(
                    authService.DelegatedReturnCookieName,
                    currentRawToken,
                    new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Lax,
                        Expires = actorSessionExpiresAtUtc,
                        IsEssential = true,
                        Path = "/",
                    });
            }

            Response.Cookies.Append(
                authService.SessionCookieName,
                rawToken,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTimeOffset.Parse(response.ExpiresAtUtc),
                    IsEssential = true,
                    Path = "/",
                });

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, ex.ParamName ?? "request", "ADMIN_SUPPORT_VALIDATION");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundProblem(ex.Message, "ADMIN_SUPPORT_TARGET_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_SUPPORT_CONFLICT");
        }
    }

    private ObjectResult? ValidateDecisionInput(string targetUserId, AdminDecisionRequest request)
    {
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            return ValidationProblem(
                "A valid target user id is required.",
                "targetUserId",
                "ADMIN_DECISION_VALIDATION");
        }

        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length < 3)
        {
            return ValidationProblem(
                "A decision reason with at least 3 non-space characters is required.",
                "reason",
                "ADMIN_DECISION_VALIDATION");
        }

        return null;
    }

    private async Task<ActionResult<AdminDecisionResponse>> ExecuteLifecycleActionAsync(
        string targetUserId,
        AdminDecisionRequest request,
        string action,
        Func<string, string, string, CancellationToken, Task<AdminDecisionResponse>> operation,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateDecisionInput(targetUserId, request);
        if (validationError is not null)
        {
            return validationError;
        }

        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem($"Admin permission is required to {action} users.", "ADMIN_ACCESS_DENIED");
        }

        if (string.Equals(actor.Id, targetUserId, StringComparison.Ordinal))
        {
            return ConflictProblem("Self-targeted lifecycle changes are not allowed.", "ADMIN_APPROVAL_CONFLICT");
        }

        try
        {
            var response = await operation(actor.Id, targetUserId, request.Reason, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, "reason", "ADMIN_DECISION_VALIDATION");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_APPROVAL_CONFLICT");
        }
    }

    private string GetDeviceSummary()
    {
        var userAgent = Request.Headers.UserAgent.ToString();
        return string.IsNullOrWhiteSpace(userAgent) ? "unknown" : userAgent;
    }

    private async Task<Domain.Users.UserAccount?> ResolveAuthorizedActorAsync(CancellationToken cancellationToken)
    {
        Request.Cookies.TryGetValue(authService.SessionCookieName, out var rawToken);
        var sessionStatus = await authService.GetSessionStatusAsync(rawToken, cancellationToken);

        if (!sessionStatus.IsAuthenticated || string.IsNullOrWhiteSpace(sessionStatus.UserId))
        {
            return null;
        }

        var actor = await userRepository.GetByIdAsync(sessionStatus.UserId, cancellationToken);
        if (actor is null)
        {
            return null;
        }

        if (actor.Role is UserRole.Admin or UserRole.SuperAdmin)
        {
            return actor;
        }

        var bootstrapAllowed = adminAccessOptions.BootstrapAdminEmails ?? [];
        return bootstrapAllowed.Any(x => string.Equals(x, actor.EmailNormalized, StringComparison.OrdinalIgnoreCase))
            ? actor
            : null;
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

    private ObjectResult ForbiddenProblem(string detail, string errorCode)
    {
        var problem = ApiProblemDetailsFactory.Create(
            HttpContext,
            StatusCodes.Status403Forbidden,
            "Access denied",
            detail,
            errorCode);

        return new ObjectResult(problem)
        {
            StatusCode = StatusCodes.Status403Forbidden,
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
