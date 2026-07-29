using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Infrastructure.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Tests;

public sealed class CsrfOriginProtectionMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_AllowsRequest_WhenNoSessionCookiePresent()
    {
        var wasCalled = false;
        var middleware = CreateMiddleware(_ =>
        {
            wasCalled = true;
            return Task.CompletedTask;
        });

        var context = NewContext("POST", "https", "localhost:7096", "/api/v1/auth/request-code");

        await middleware.InvokeAsync(context);

        Assert.True(wasCalled);
    }

    [Fact]
    public async Task InvokeAsync_Returns403_WhenCrossSiteWithSessionCookie()
    {
        var middleware = CreateMiddleware(_ => Task.CompletedTask);
        var context = NewContext("POST", "https", "localhost:7096", "/api/v1/auth/verify-code");
        context.Request.Headers.Cookie = "bau.sid=test";
        context.Request.Headers.Origin = "https://evil.example";

        await middleware.InvokeAsync(context);

        Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
    }

    [Fact]
    public async Task InvokeAsync_Allows_WhenOriginMatchesHost()
    {
        var wasCalled = false;
        var middleware = CreateMiddleware(_ =>
        {
            wasCalled = true;
            return Task.CompletedTask;
        });

        var context = NewContext("POST", "https", "localhost:7096", "/api/v1/admin/cms/flats");
        context.Request.Headers.Cookie = "bau.sid=test";
        context.Request.Headers.Origin = "https://localhost:7096";

        await middleware.InvokeAsync(context);

        Assert.True(wasCalled);
    }

    private static CsrfOriginProtectionMiddleware CreateMiddleware(RequestDelegate next)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:AllowedOrigins:0"] = "https://localhost:7096",
            })
            .Build();

        return new CsrfOriginProtectionMiddleware(
            next,
            configuration,
            NullLogger<CsrfOriginProtectionMiddleware>.Instance,
            Options.Create(new AuthOtpOptions { SessionCookieName = "bau.sid" }));
    }

    private static DefaultHttpContext NewContext(string method, string scheme, string host, string path)
    {
        var context = new DefaultHttpContext();
        context.Request.Method = method;
        context.Request.Scheme = scheme;
        context.Request.Host = new HostString(host);
        context.Request.Path = path;
        return context;
    }
}
