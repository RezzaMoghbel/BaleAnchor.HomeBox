using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Admin;
using BaleAnchorUtility.Server.Application.Admin.Dtos;
using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Infrastructure.Errors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Controllers;

[ApiController]
[Route("api/v1/admin/roles")]
public sealed class AdminRolesController : ControllerBase
{
    private readonly AuthService authService;
    private readonly IUserRepository userRepository;
    private readonly AdminRoleService adminRoleService;
    private readonly AdminAccessOptions adminAccessOptions;

    public AdminRolesController(
        AuthService authService,
        IUserRepository userRepository,
        AdminRoleService adminRoleService,
        IOptions<AdminAccessOptions> adminAccessOptions)
    {
        this.authService = authService;
        this.userRepository = userRepository;
        this.adminRoleService = adminRoleService;
        this.adminAccessOptions = adminAccessOptions.Value;
    }

    [HttpPost("{targetUserId}")]
    [ProducesResponseType(typeof(AdminRoleChangeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminRoleChangeResponse>> ChangeRole(
        string targetUserId,
        [FromBody] AdminRoleChangeRequest request,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to change user roles.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminRoleService.ChangeRoleAsync(
                actor,
                targetUserId,
                request.Role,
                request.Reason,
                cancellationToken);

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            var field = string.Equals(ex.ParamName, nameof(targetUserId), StringComparison.Ordinal)
                ? "targetUserId"
                : string.Equals(ex.ParamName, "requestedRole", StringComparison.Ordinal)
                    ? "role"
                    : "reason";

            return ValidationProblem(ex.Message, field, "ADMIN_ROLE_VALIDATION");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundProblem(ex.Message, "ADMIN_ROLE_USER_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_ROLE_CONFLICT");
        }
    }

    private async Task<UserAccount?> ResolveAuthorizedActorAsync(CancellationToken cancellationToken)
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
