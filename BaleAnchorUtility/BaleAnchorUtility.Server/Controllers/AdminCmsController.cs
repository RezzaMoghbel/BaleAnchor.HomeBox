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
[Route("api/v1/admin/cms")]
public sealed class AdminCmsController : ControllerBase
{
    private readonly AuthService authService;
    private readonly IUserRepository userRepository;
    private readonly AdminCmsService adminCmsService;
    private readonly AdminAccessOptions adminAccessOptions;

    public AdminCmsController(
        AuthService authService,
        IUserRepository userRepository,
        AdminCmsService adminCmsService,
        IOptions<AdminAccessOptions> adminAccessOptions)
    {
        this.authService = authService;
        this.userRepository = userRepository;
        this.adminCmsService = adminCmsService;
        this.adminAccessOptions = adminAccessOptions.Value;
    }

    [HttpGet("users")]
    [ProducesResponseType(typeof(AdminUserSearchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AdminUserSearchResponse>> SearchUsers(
        [FromQuery] string? query,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required for CMS user search.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminCmsService.SearchUsersAsync(query, status, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, ex.ParamName ?? "request", "ADMIN_CMS_VALIDATION");
        }
    }

    [HttpGet("flats")]
    [ProducesResponseType(typeof(FlatListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<FlatListResponse>> GetFlats(CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to view flats.", "ADMIN_ACCESS_DENIED");
        }

        var response = await adminCmsService.GetFlatsAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPost("flats")]
    [ProducesResponseType(typeof(AdminActionResultResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminActionResultResponse>> UpsertFlat(
        [FromBody] UpsertFlatRequest request,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to modify flats.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminCmsService.UpsertFlatAsync(actor, request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, ex.ParamName ?? "request", "ADMIN_CMS_VALIDATION");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_CMS_CONFLICT");
        }
    }

    [HttpGet("tenancies")]
    [ProducesResponseType(typeof(TenancyListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TenancyListResponse>> GetTenancies(
        [FromQuery] string? userId,
        [FromQuery] string? flatNumber,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to view tenancies.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminCmsService.GetTenanciesAsync(userId, flatNumber, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, ex.ParamName ?? "request", "ADMIN_CMS_VALIDATION");
        }
    }

    [HttpPost("tenancies")]
    [ProducesResponseType(typeof(AdminActionResultResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminActionResultResponse>> UpsertTenancy(
        [FromBody] UpsertTenancyRequest request,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to modify tenancies.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminCmsService.UpsertTenancyAsync(actor, request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, ex.ParamName ?? "request", "ADMIN_CMS_VALIDATION");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundProblem(ex.Message, "ADMIN_CMS_USER_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_CMS_CONFLICT");
        }
    }

    [HttpGet("tenant-gaps")]
    [ProducesResponseType(typeof(TenantGapAllocationListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TenantGapAllocationListResponse>> GetTenantGaps(
        [FromQuery] string? flatNumber,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to view tenant gaps.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminCmsService.GetTenantGapAllocationsAsync(flatNumber, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, ex.ParamName ?? "request", "ADMIN_CMS_VALIDATION");
        }
    }

    [HttpPost("tenant-gaps")]
    [ProducesResponseType(typeof(AdminActionResultResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminActionResultResponse>> UpsertTenantGap(
        [FromBody] UpsertTenantGapAllocationRequest request,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to modify tenant gaps.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminCmsService.UpsertTenantGapAllocationAsync(actor, request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, ex.ParamName ?? "request", "ADMIN_CMS_VALIDATION");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundProblem(ex.Message, "ADMIN_CMS_USER_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_CMS_CONFLICT");
        }
    }

    [HttpGet("users/{targetUserId}/billing-context")]
    [ProducesResponseType(typeof(AdminBillingContextResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AdminBillingContextResponse>> GetBillingContext(
        string targetUserId,
        [FromQuery] string? onDate,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to view billing context.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminCmsService.GetBillingContextAsync(targetUserId, onDate, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, ex.ParamName ?? "request", "ADMIN_CMS_VALIDATION");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundProblem(ex.Message, "ADMIN_CMS_USER_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_CMS_CONFLICT");
        }
    }

    [HttpDelete("users/{targetUserId}/readings/latest")]
    [ProducesResponseType(typeof(AdminActionResultResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminActionResultResponse>> DeleteLatestReading(
        string targetUserId,
        [FromQuery] string reason,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to delete readings.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminCmsService.DeleteLatestReadingAsync(actor, targetUserId, reason, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ValidationProblem(ex.Message, ex.ParamName ?? "request", "ADMIN_CMS_VALIDATION");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundProblem(ex.Message, "ADMIN_CMS_USER_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_CMS_CONFLICT");
        }
    }

    [HttpPost("users/{targetUserId}/tariffs")]
    [ProducesResponseType(typeof(AdminActionResultResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminActionResultResponse>> UpsertTargetTariff(
        string targetUserId,
        [FromBody] AdminTargetedTariffRequest request,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to update tariffs.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminCmsService.UpsertTariffAsync(actor, targetUserId, request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            var field = string.Equals(ex.ParamName, nameof(targetUserId), StringComparison.Ordinal)
                ? "targetUserId"
                : "reason";
            return ValidationProblem(ex.Message, field, "ADMIN_CMS_VALIDATION");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundProblem(ex.Message, "ADMIN_CMS_USER_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_CMS_CONFLICT");
        }
    }

    [HttpPut("users/{targetUserId}/boiler-assumptions")]
    [ProducesResponseType(typeof(AdminActionResultResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminActionResultResponse>> UpdateBoilerAssumptions(
        string targetUserId,
        [FromBody] AdminTargetedBoilerAssumptionsRequest request,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to update boiler assumptions.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminCmsService.UpdateBoilerAssumptionsAsync(actor, targetUserId, request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            var field = string.Equals(ex.ParamName, nameof(targetUserId), StringComparison.Ordinal)
                ? "targetUserId"
                : "reason";
            return ValidationProblem(ex.Message, field, "ADMIN_CMS_VALIDATION");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFoundProblem(ex.Message, "ADMIN_CMS_USER_NOT_FOUND");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_CMS_CONFLICT");
        }
    }

    [HttpGet("terms/versions")]
    [ProducesResponseType(typeof(TermsVersionListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TermsVersionListResponse>> GetTermsVersions(CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to view terms versions.", "ADMIN_ACCESS_DENIED");
        }

        var response = await adminCmsService.GetTermsVersionsAsync(cancellationToken);
        return Ok(response);
    }

    [HttpPost("terms/versions")]
    [ProducesResponseType(typeof(PublishTermsVersionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PublishTermsVersionResponse>> PublishTermsVersion(
        [FromBody] PublishTermsVersionRequest request,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to publish terms versions.", "ADMIN_ACCESS_DENIED");
        }

        try
        {
            var response = await adminCmsService.PublishTermsVersionAsync(actor, request, cancellationToken);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            var field = ex.ParamName switch
            {
                nameof(PublishTermsVersionRequest.VersionLabel) => "versionLabel",
                nameof(PublishTermsVersionRequest.Title) => "title",
                nameof(PublishTermsVersionRequest.ContentMarkdown) => "contentMarkdown",
                nameof(PublishTermsVersionRequest.Reason) => "reason",
                _ => "effectiveFromUtc",
            };

            return ValidationProblem(ex.Message, field, "ADMIN_CMS_VALIDATION");
        }
        catch (InvalidOperationException ex)
        {
            return ConflictProblem(ex.Message, "ADMIN_CMS_CONFLICT");
        }
    }

    [HttpGet("terms/acceptances")]
    [ProducesResponseType(typeof(TermsAcceptanceListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TermsAcceptanceListResponse>> GetTermsAcceptances(
        [FromQuery] string? userId,
        [FromQuery] string? termsVersionId,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to view terms acceptances.", "ADMIN_ACCESS_DENIED");
        }

        var response = await adminCmsService.GetTermsAcceptancesAsync(userId, termsVersionId, cancellationToken);
        return Ok(response);
    }

    [HttpGet("audit")]
    [ProducesResponseType(typeof(AuditLogListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AuditLogListResponse>> GetAuditLogs(
        [FromQuery] string? actorUserId,
        [FromQuery] string? targetUserId,
        [FromQuery] string? category,
        [FromQuery] string? action,
        CancellationToken cancellationToken)
    {
        var actor = await ResolveAuthorizedActorAsync(cancellationToken);
        if (actor is null)
        {
            return ForbiddenProblem("Admin permission is required to view audit logs.", "ADMIN_ACCESS_DENIED");
        }

        var response = await adminCmsService.GetAuditLogsAsync(actorUserId, targetUserId, category, action, cancellationToken);
        return Ok(response);
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
