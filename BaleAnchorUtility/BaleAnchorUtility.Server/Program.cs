using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Onboarding;
using BaleAnchorUtility.Server.Application.Terms;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Infrastructure.Email;
using BaleAnchorUtility.Server.Infrastructure.Errors;
using BaleAnchorUtility.Server.Infrastructure.Persistence.Json;
using BaleAnchorUtility.Server.Infrastructure.Startup;
using BaleAnchorUtility.Server.Infrastructure.Time;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

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
builder.Services.Configure<AuthOtpOptions>(builder.Configuration.GetSection(AuthOtpOptions.SectionName));
builder.Services.AddOptions<EmailTransportOptions>()
    .Bind(builder.Configuration.GetSection(EmailTransportOptions.SectionName))
    .ValidateOnStart();
builder.Services.AddSingleton<Microsoft.Extensions.Options.IValidateOptions<EmailTransportOptions>, EmailTransportOptionsValidator>();

builder.Services.AddSingleton<JsonCollectionStore>();
builder.Services.AddScoped<IUserRepository, JsonUserRepository>();
builder.Services.AddScoped<IOtpChallengeRepository, JsonOtpChallengeRepository>();
builder.Services.AddScoped<ISessionRepository, JsonSessionRepository>();
builder.Services.AddScoped<ITermsVersionRepository, JsonTermsVersionRepository>();
builder.Services.AddScoped<ITermsAcceptanceRepository, JsonTermsAcceptanceRepository>();
builder.Services.AddSingleton<LoggingEmailSender>();
builder.Services.AddSingleton<SmtpEmailSender>();
builder.Services.AddSingleton<IEmailSender, ConfiguredEmailSender>();
builder.Services.AddSingleton<ISystemClock, SystemClock>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<TermsService>();
builder.Services.AddScoped<OnboardingService>();
builder.Services.AddHostedService<TermsSeedHostedService>();

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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
