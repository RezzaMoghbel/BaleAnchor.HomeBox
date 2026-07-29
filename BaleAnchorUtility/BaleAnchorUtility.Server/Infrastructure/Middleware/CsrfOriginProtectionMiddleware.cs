using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Infrastructure.Errors;

namespace BaleAnchorUtility.Server.Infrastructure.Middleware;

public sealed class CsrfOriginProtectionMiddleware
{
    private static readonly HashSet<string> ProtectedMethods =
    [
        HttpMethods.Post,
        HttpMethods.Put,
        HttpMethods.Patch,
        HttpMethods.Delete,
    ];

    private readonly RequestDelegate next;
    private readonly ILogger<CsrfOriginProtectionMiddleware> logger;
    private readonly string[] allowedOrigins;
    private readonly string sessionCookieName;

    public CsrfOriginProtectionMiddleware(RequestDelegate next, IConfiguration configuration, ILogger<CsrfOriginProtectionMiddleware> logger, Microsoft.Extensions.Options.IOptions<AuthOtpOptions> authOptions)
    {
        this.next = next;
        this.logger = logger;
        sessionCookieName = authOptions.Value.SessionCookieName;

        var configured = configuration.GetSection("Security:AllowedOrigins").Get<string[]>() ?? [];
        allowedOrigins = configured
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin.Trim().TrimEnd('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!ProtectedMethods.Contains(context.Request.Method))
        {
            await next(context);
            return;
        }

        if (!HasSessionCookie(context.Request))
        {
            await next(context);
            return;
        }

        if (IsSameSiteRequest(context.Request))
        {
            await next(context);
            return;
        }

        logger.LogWarning("Rejected cross-site state changing request at {Path} from origin/referrer mismatch.", context.Request.Path);

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        var problem = ApiProblemDetailsFactory.Create(
            context,
            StatusCodes.Status403Forbidden,
            "Forbidden",
            "Request origin is not allowed.",
            "CSRF_BLOCKED");
        await ApiProblemDetailsFactory.WriteAsync(context, problem);
    }

    private bool HasSessionCookie(HttpRequest request)
    {
        // Session cookie name is configurable, so include exact configured name and legacy fallback.
        return request.Cookies.Keys.Any(key =>
            string.Equals(key, sessionCookieName, StringComparison.Ordinal)
            || key.EndsWith(".sid", StringComparison.Ordinal));
    }

    private bool IsSameSiteRequest(HttpRequest request)
    {
        var requestOrigin = $"{request.Scheme}://{request.Host}".TrimEnd('/');

        var origin = request.Headers.Origin.ToString();
        if (!string.IsNullOrWhiteSpace(origin))
        {
            return IsAllowed(origin, requestOrigin);
        }

        var referer = request.Headers.Referer.ToString();
        if (!string.IsNullOrWhiteSpace(referer) && Uri.TryCreate(referer, UriKind.Absolute, out var refererUri))
        {
            return IsAllowed($"{refererUri.Scheme}://{refererUri.Authority}", requestOrigin);
        }

        return false;
    }

    private bool IsAllowed(string origin, string requestOrigin)
    {
        var normalized = origin.Trim().TrimEnd('/');
        if (string.Equals(normalized, requestOrigin, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return allowedOrigins.Any(allowed => string.Equals(allowed, normalized, StringComparison.OrdinalIgnoreCase));
    }
}
