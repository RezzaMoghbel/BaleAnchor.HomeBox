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
    private readonly AdminAccessOptions adminAccessOptions;

    public AdminApprovalsController(
        AuthService authService,
        IUserRepository userRepository,
        AdminApprovalService adminApprovalService,
        IOptions<AdminAccessOptions> adminAccessOptions)
    {
        this.authService = authService;
        this.userRepository = userRepository;
        this.adminApprovalService = adminApprovalService;
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
            return Forbid();
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
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return Forbid();
        }

        try
        {
            var response = await adminApprovalService.ApproveAsync(actor.Id, targetUserId, request.Reason, cancellationToken);
            return Ok(response);
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
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return Forbid();
        }

        try
        {
            var response = await adminApprovalService.RejectAsync(actor.Id, targetUserId, request.Reason, cancellationToken);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_APPROVAL_CONFLICT");
        }
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
}
