using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace BaleAnchorUtility.Server.Infrastructure.Errors;

public static class ApiProblemDetailsFactory
{
    public static ProblemDetails Create(
        HttpContext context,
        int statusCode,
        string title,
        string detail,
        string errorCode,
        string? type = null)
    {
        var problem = new ProblemDetails
        {
            Type = type ?? $"https://api.baleanchor.local/errors/{statusCode}",
            Title = title,
            Status = statusCode,
            Detail = detail,
            Instance = context.Request.Path,
        };

        AddStandardExtensions(context, problem, errorCode);
        return problem;
    }

    public static void AddStandardExtensions(HttpContext context, ProblemDetails problem, string errorCode)
    {
        problem.Extensions["errorCode"] = errorCode;
        problem.Extensions["traceId"] = Activity.Current?.Id ?? context.TraceIdentifier;
        problem.Extensions["timestampUtc"] = DateTimeOffset.UtcNow.ToString("O");
    }

    public static async Task WriteAsync(HttpContext context, ProblemDetails problem)
    {
        context.Response.StatusCode = problem.Status ?? StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(problem);
    }
}
