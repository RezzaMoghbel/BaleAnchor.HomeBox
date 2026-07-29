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
[Route("api/v1/admin/system-settings")]
public sealed class AdminSystemSettingsController : ControllerBase
{
    private readonly AuthService authService;
    private readonly IUserRepository userRepository;
    private readonly AdminSystemSettingsService adminSystemSettingsService;
    private readonly AdminAccessOptions adminAccessOptions;

    public AdminSystemSettingsController(
        AuthService authService,
        IUserRepository userRepository,
        AdminSystemSettingsService adminSystemSettingsService,
        IOptions<AdminAccessOptions> adminAccessOptions)
    {
        this.authService = authService;
        this.userRepository = userRepository;
        this.adminSystemSettingsService = adminSystemSettingsService;
        this.adminAccessOptions = adminAccessOptions.Value;
    }

    [HttpGet("email-transport")]
    [ProducesResponseType(typeof(AdminEmailTransportSettingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminEmailTransportSettingsResponse>> GetEmailTransport(CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to view system settings.", "ADMIN_ACCESS_DENIED");
        }

        var response = await adminSystemSettingsService.GetEmailTransportAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPut("email-transport")]
    [ProducesResponseType(typeof(AdminEmailTransportSettingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AdminEmailTransportSettingsResponse>> UpdateEmailTransport(
        [FromBody] UpdateAdminEmailTransportSettingsRequest request,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to modify system settings.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminSystemSettingsService.UpdateEmailTransportAsync(actor, request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, ex.ParamName ?? "request", "ADMIN_SYSTEM_SETTINGS_VALIDATION");
        }
    }

    [HttpGet("auth-access")]
    [ProducesResponseType(typeof(AdminAuthAccessSettingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminAuthAccessSettingsResponse>> GetAuthAccess(CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to view system settings.", "ADMIN_ACCESS_DENIED");
        }

        var response = await adminSystemSettingsService.GetAuthAccessAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPut("auth-access")]
    [ProducesResponseType(typeof(AdminAuthAccessSettingsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AdminAuthAccessSettingsResponse>> UpdateAuthAccess(
        [FromBody] UpdateAdminAuthAccessSettingsRequest request,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to modify system settings.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminSystemSettingsService.UpdateAuthAccessAsync(actor, request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, ex.ParamName ?? "request", "ADMIN_SYSTEM_SETTINGS_VALIDATION");
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
