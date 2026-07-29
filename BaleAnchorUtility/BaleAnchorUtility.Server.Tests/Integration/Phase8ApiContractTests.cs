using System.Net;

namespace BaleAnchorUtility.Server.Tests.Integration;

[Collection("Phase8IntegrationSerial")]
public sealed class Phase8ApiContractTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory factory;

    public Phase8ApiContractTests(ApiWebApplicationFactory factory)
    {
        this.factory = factory;
    }

    [Fact]
    public async Task RequestCode_InvalidPayload_ReturnsProblemDetailsWithRequiredExtensions()
    {
        using var client = factory.CreateClient();
        await ApiTestClient.ReseedAsync(client);

        using var response = await client.PostAsync("/api/v1/auth/request-code", new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        using var problem = ApiTestClient.ParseJson(await response.Content.ReadAsStringAsync());

        Assert.True(problem.RootElement.TryGetProperty("type", out _));
        Assert.True(problem.RootElement.TryGetProperty("title", out _));
        Assert.True(problem.RootElement.TryGetProperty("status", out var statusNode));
        Assert.Equal(400, statusNode.GetInt32());
        Assert.True(problem.RootElement.TryGetProperty("detail", out _));
        Assert.True(problem.RootElement.TryGetProperty("instance", out _));
        Assert.True(problem.RootElement.TryGetProperty("errorCode", out _));
        Assert.True(problem.RootElement.TryGetProperty("traceId", out _));
        Assert.True(problem.RootElement.TryGetProperty("timestampUtc", out _));
        Assert.True(problem.RootElement.TryGetProperty("errors", out _));
    }

    [Fact]
    public async Task ReminderPreferences_AuthorizedRead_ReturnsTypedPayloadShape()
    {
        using var client = factory.CreateClient();
        await ApiTestClient.ReseedAsync(client);
        var cookie = await ApiTestClient.LoginAsSeedAsync(client, "resident.active@baleanchor.local");

        using var response = await client.SendAsync(ApiTestClient.CreateAuthenticatedReadRequest("/api/v1/reminders/preferences", cookie));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var body = ApiTestClient.ParseJson(await response.Content.ReadAsStringAsync());
        Assert.True(body.RootElement.TryGetProperty("userId", out var userId));
        Assert.False(string.IsNullOrWhiteSpace(userId.GetString()));
        Assert.True(body.RootElement.TryGetProperty("emailRemindersEnabled", out _));
        Assert.True(body.RootElement.TryGetProperty("pushRemindersEnabled", out _));
        Assert.True(body.RootElement.TryGetProperty("readingReminderEnabled", out _));
        Assert.True(body.RootElement.TryGetProperty("timeZoneId", out _));
        Assert.True(body.RootElement.TryGetProperty("updatedAtUtc", out _));
    }
}
