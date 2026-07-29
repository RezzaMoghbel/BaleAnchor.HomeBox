using System.Net.Http.Json;
using System.Text.Json;

namespace BaleAnchorUtility.Server.Tests.Integration;

internal static class ApiTestClient
{
    public static async Task ReseedAsync(HttpClient client)
    {
        using var response = await client.PostAsync("/api/system/dev-seed", content: null);
        response.EnsureSuccessStatusCode();
    }

    public static async Task<string> LoginAsSeedAsync(HttpClient client, string email)
    {
        using (var requestCodeResponse = await client.PostAsJsonAsync("/api/v1/auth/request-code", new
        {
            email,
        }))
        {
            requestCodeResponse.EnsureSuccessStatusCode();
        }

        using var verifyResponse = await client.PostAsJsonAsync("/api/v1/auth/verify-code", new
        {
            email,
            code = "123456",
        });

        verifyResponse.EnsureSuccessStatusCode();

        var cookie = verifyResponse.Headers.TryGetValues("Set-Cookie", out var values)
            ? values.FirstOrDefault(static x => x.StartsWith("bau.sid=", StringComparison.Ordinal))
            : null;

        if (string.IsNullOrWhiteSpace(cookie))
        {
            throw new InvalidOperationException("Authentication cookie was not returned by verify-code endpoint.");
        }

        var semicolonIndex = cookie.IndexOf(';');
        return semicolonIndex >= 0 ? cookie[..semicolonIndex] : cookie;
    }

    public static JsonDocument ParseJson(string body)
    {
        return JsonDocument.Parse(body);
    }

    public static HttpRequestMessage CreateAuthenticatedWriteRequest(HttpMethod method, string path, string sessionCookie, object body)
    {
        var request = new HttpRequestMessage(method, path)
        {
            Content = JsonContent.Create(body),
        };

        request.Headers.Add("Cookie", sessionCookie);
        request.Headers.Add("Origin", "http://localhost");
        return request;
    }

    public static HttpRequestMessage CreateAuthenticatedReadRequest(string path, string sessionCookie)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, path);
        request.Headers.Add("Cookie", sessionCookie);
        return request;
    }
}
