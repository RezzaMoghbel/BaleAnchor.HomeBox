using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Admin;
using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Billing;
using BaleAnchorUtility.Server.Application.Calculations;
using BaleAnchorUtility.Server.Application.Notifications;
using BaleAnchorUtility.Server.Application.Onboarding;
using BaleAnchorUtility.Server.Application.Terms;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Infrastructure.Auth;
using BaleAnchorUtility.Server.Infrastructure.Email;
using BaleAnchorUtility.Server.Infrastructure.Errors;
using BaleAnchorUtility.Server.Infrastructure.Middleware;
using BaleAnchorUtility.Server.Infrastructure.Notifications;
using BaleAnchorUtility.Server.Infrastructure.Pdf;
using BaleAnchorUtility.Server.Infrastructure.Persistence.Json;
using BaleAnchorUtility.Server.Infrastructure.Security;
using BaleAnchorUtility.Server.Infrastructure.Startup;
using BaleAnchorUtility.Server.Infrastructure.Time;
using QuestPDF.Infrastructure;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using System.Threading.RateLimiting;

QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services
    .AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var problem = new ValidationProblemDetails(context.ModelState)
            {
                Type = "https://api.baleanchor.local/errors/validation",
                Title = "Validation failed",
                Status = StatusCodes.Status400BadRequest,
                Detail = "One or more validation errors occurred.",
                Instance = context.HttpContext.Request.Path,
            };

            ApiProblemDetailsFactory.AddStandardExtensions(
                context.HttpContext,
                problem,
                "VALIDATION_FAILED");

            return new BadRequestObjectResult(problem)
            {
                ContentTypes = { "application/problem+json" }
            };
        };
    });
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddDataProtection();
builder.Services.AddOptions<AuthOtpOptions>()
    .Bind(builder.Configuration.GetSection(AuthOtpOptions.SectionName))
    .ValidateOnStart();
builder.Services.AddSingleton<Microsoft.Extensions.Options.IValidateOptions<AuthOtpOptions>, AuthOtpOptionsValidator>();
builder.Services.AddOptions<AdminAccessOptions>()
    .Bind(builder.Configuration.GetSection(AdminAccessOptions.SectionName))
    .ValidateOnStart();
builder.Services.AddSingleton<Microsoft.Extensions.Options.IValidateOptions<AdminAccessOptions>, AdminAccessOptionsValidator>();
builder.Services.AddOptions<SeedAccessOptions>()
    .Bind(builder.Configuration.GetSection(SeedAccessOptions.SectionName))
    .ValidateOnStart();
builder.Services.AddSingleton<Microsoft.Extensions.Options.IValidateOptions<SeedAccessOptions>, SeedAccessOptionsValidator>();
builder.Services.AddOptions<EmailTransportOptions>()
    .Bind(builder.Configuration.GetSection(EmailTransportOptions.SectionName))
    .ValidateOnStart();
builder.Services.AddSingleton<Microsoft.Extensions.Options.IValidateOptions<EmailTransportOptions>, EmailTransportOptionsValidator>();
builder.Services.AddOptions<PushNotificationOptions>()
    .Bind(builder.Configuration.GetSection(PushNotificationOptions.SectionName))
    .ValidateOnStart();
builder.Services.AddSingleton<Microsoft.Extensions.Options.IValidateOptions<PushNotificationOptions>, PushNotificationOptionsValidator>();
builder.Services.AddHealthChecks();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        var problem = ApiProblemDetailsFactory.Create(
            context.HttpContext,
            StatusCodes.Status429TooManyRequests,
            "Too many requests",
            "You have sent too many requests in a short period. Please retry later.",
            "RATE_LIMITED");

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter = ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString();
        }

        await ApiProblemDetailsFactory.WriteAsync(context.HttpContext, problem);
    };

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var path = httpContext.Request.Path.Value ?? string.Empty;
        var isAuthOtpRoute = path.StartsWith("/api/v1/auth/request-code", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/v1/auth/verify-code", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/v1/auth/password-login", StringComparison.OrdinalIgnoreCase);

        if (isAuthOtpRoute)
        {
            return RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: $"auth:{ip}",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 12,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    AutoReplenishment = true,
                });
        }

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"global:{ip}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true,
            });
    });
});

builder.Services.AddSingleton<JsonCollectionStore>();
builder.Services.AddScoped<IUserRepository, JsonUserRepository>();
builder.Services.AddScoped<IFlatRepository, JsonFlatRepository>();
builder.Services.AddScoped<ITenancyRepository, JsonTenancyRepository>();
builder.Services.AddScoped<ITenantGapRepository, JsonTenantGapRepository>();
builder.Services.AddScoped<IAuditLogRepository, JsonAuditLogRepository>();
builder.Services.AddScoped<IOtpChallengeRepository, JsonOtpChallengeRepository>();
builder.Services.AddScoped<ISessionRepository, JsonSessionRepository>();
builder.Services.AddScoped<ITermsVersionRepository, JsonTermsVersionRepository>();
builder.Services.AddScoped<ITermsAcceptanceRepository, JsonTermsAcceptanceRepository>();
builder.Services.AddScoped<IUtilitySetupRepository, JsonUtilitySetupRepository>();
builder.Services.AddScoped<IReadingSubmissionRepository, JsonReadingSubmissionRepository>();
builder.Services.AddScoped<ITariffVersionRepository, JsonTariffVersionRepository>();
builder.Services.AddScoped<ICalculationSnapshotRepository, JsonCalculationSnapshotRepository>();
builder.Services.AddScoped<IPaymentRepository, JsonPaymentRepository>();
builder.Services.AddScoped<IStatementExportRepository, JsonStatementExportRepository>();
builder.Services.AddScoped<IEmailTransportRuntimeSettingsRepository, JsonEmailTransportRuntimeSettingsRepository>();
builder.Services.AddScoped<IAuthAccessRuntimeSettingsRepository, JsonAuthAccessRuntimeSettingsRepository>();
builder.Services.AddScoped<INotificationPreferencesRepository, JsonNotificationPreferencesRepository>();
builder.Services.AddScoped<IPushSubscriptionRepository, JsonPushSubscriptionRepository>();
builder.Services.AddScoped<IReminderDispatchJobRepository, JsonReminderDispatchJobRepository>();
builder.Services.AddSingleton<ISecretProtector, DataProtectionSecretProtector>();
builder.Services.AddScoped<IEmailTransportSettingsProvider, DatabaseBackedEmailTransportSettingsProvider>();
builder.Services.AddScoped<IAuthAccessSettingsProvider, DatabaseBackedAuthAccessSettingsProvider>();
builder.Services.AddSingleton<LoggingEmailSender>();
builder.Services.AddSingleton<SmtpEmailSender>();
builder.Services.AddScoped<IEmailSender, ConfiguredEmailSender>();
builder.Services.AddSingleton<IWebPushSender, ConfiguredWebPushSender>();
builder.Services.AddSingleton<ISystemClock, SystemClock>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AdminApprovalService>();
builder.Services.AddScoped<AdminRoleService>();
builder.Services.AddScoped<AdminCmsService>();
builder.Services.AddScoped<AdminSystemSettingsService>();
builder.Services.AddScoped<BillingInputService>();
builder.Services.AddScoped<CalculationSnapshotService>();
builder.Services.AddScoped<PaymentService>();
builder.Services.AddScoped<StatementSummaryService>();
builder.Services.AddScoped<StatementPdfExportService>();
builder.Services.AddScoped<NotificationPreferencesService>();
builder.Services.AddScoped<PushNotificationService>();
builder.Services.AddScoped<ReminderDispatchService>();
builder.Services.AddSingleton<IStatementPdfGenerator, PlaceholderStatementPdfGenerator>();
builder.Services.AddScoped<TermsService>();
builder.Services.AddScoped<OnboardingService>();
builder.Services.AddScoped<DevelopmentSeedDataService>();
builder.Services.AddHostedService<TermsSeedHostedService>();
builder.Services.AddHostedService<DevelopmentSeedHostedService>();
builder.Services.AddHostedService<SystemSettingsBootstrapHostedService>();
builder.Services.AddHostedService<JsonIndexRebuildHostedService>();
builder.Services.AddHostedService<ReminderDispatchHostedService>();

var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

app.UseExceptionHandler(handlerApp =>
{
    handlerApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        var detail = app.Environment.IsDevelopment()
            ? exception?.Message ?? "An unexpected error occurred."
            : "An unexpected error occurred while processing your request.";

        var problem = ApiProblemDetailsFactory.Create(
            context,
            statusCode: StatusCodes.Status500InternalServerError,
            title: "Unexpected error",
            detail: detail,
            errorCode: "UNEXPECTED_ERROR",
            type: "https://api.baleanchor.local/errors/unexpected");

        await ApiProblemDetailsFactory.WriteAsync(context, problem);
    });
});

app.UseStatusCodePages(async statusContext =>
{
    var httpContext = statusContext.HttpContext;
    var statusCode = httpContext.Response.StatusCode;

    if (httpContext.Response.HasStarted || statusCode < 400)
    {
        return;
    }

    var (title, detail, errorCode) = statusCode switch
    {
        StatusCodes.Status401Unauthorized => (
            "Authentication required",
            "Authentication is required to access this resource.",
            "AUTH_REQUIRED"),
        StatusCodes.Status403Forbidden => (
            "Access denied",
            "You do not have permission to access this resource.",
            "ACCESS_DENIED"),
        StatusCodes.Status404NotFound => (
            "Resource not found",
            "The requested resource was not found.",
            "RESOURCE_NOT_FOUND"),
        StatusCodes.Status409Conflict => (
            "Conflict",
            "The request conflicts with the current resource state. Review active terms and retry.",
            "RESOURCE_CONFLICT"),
        StatusCodes.Status422UnprocessableEntity => (
            "Unprocessable request",
            "The request violates one or more business rules.",
            "BUSINESS_RULE_VIOLATION"),
        StatusCodes.Status429TooManyRequests => (
            "Too many requests",
            "You have sent too many requests in a short period. Please retry later.",
            "RATE_LIMITED"),
        _ => (
            "Request failed",
            "The request could not be processed.",
            "REQUEST_FAILED")
    };

    var problem = ApiProblemDetailsFactory.Create(
        httpContext,
        statusCode,
        title,
        detail,
        errorCode);

    await ApiProblemDetailsFactory.WriteAsync(httpContext, problem);
});

app.UseMiddleware<RequestLoggingMiddleware>();
app.UseRateLimiter();
app.UseMiddleware<CsrfOriginProtectionMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready");

app.MapFallbackToFile("/index.html");

app.Run();

public partial class Program;
