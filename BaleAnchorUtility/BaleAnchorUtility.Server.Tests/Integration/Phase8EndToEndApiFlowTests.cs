using System.Net;

namespace BaleAnchorUtility.Server.Tests.Integration;

[Collection("Phase8IntegrationSerial")]
public sealed class Phase8EndToEndApiFlowTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory factory;

    public Phase8EndToEndApiFlowTests(ApiWebApplicationFactory factory)
    {
        this.factory = factory;
    }

    [Fact]
    public async Task LoginAndOnboardingProgressFlow_WorksForSeedOnboardingResident()
    {
        using var client = factory.CreateClient();
        await ApiTestClient.ReseedAsync(client);

        var cookie = await ApiTestClient.LoginAsSeedAsync(client, "resident.onboarding@baleanchor.local");

        using var progressResponse = await client.SendAsync(
            ApiTestClient.CreateAuthenticatedReadRequest("/api/v1/onboarding/progress", cookie));

        Assert.Equal(HttpStatusCode.OK, progressResponse.StatusCode);

        using var progressBody = ApiTestClient.ParseJson(await progressResponse.Content.ReadAsStringAsync());
        Assert.True(progressBody.RootElement.TryGetProperty("accountStatus", out var status));
        Assert.False(string.IsNullOrWhiteSpace(status.GetString()));
        Assert.True(progressBody.RootElement.TryGetProperty("nextStep", out var nextStep));
        Assert.False(string.IsNullOrWhiteSpace(nextStep.GetString()));
    }

    [Fact]
    public async Task ResidentReadingToStatementFlow_WorksForSeedActiveResident()
    {
        using var client = factory.CreateClient();
        await ApiTestClient.ReseedAsync(client);

        var cookie = await ApiTestClient.LoginAsSeedAsync(client, "resident.active@baleanchor.local");

        using var readingResponse = await client.SendAsync(
            ApiTestClient.CreateAuthenticatedWriteRequest(HttpMethod.Post, "/api/v1/billing/readings", cookie, new
            {
                readingDate = "2026-07-01",
                coldWaterReading = "132.100",
                hotWaterReading = "75.500",
                electricityReading = "420.250",
            }));

        Assert.Equal(HttpStatusCode.OK, readingResponse.StatusCode);

        using var calculateResponse = await client.SendAsync(
            ApiTestClient.CreateAuthenticatedWriteRequest(HttpMethod.Post, "/api/v1/billing/calculations/latest", cookie, new { }));

        Assert.Equal(HttpStatusCode.OK, calculateResponse.StatusCode);

        using var periodsResponse = await client.SendAsync(
            ApiTestClient.CreateAuthenticatedReadRequest("/api/v1/billing/statements/periods", cookie));

        Assert.Equal(HttpStatusCode.OK, periodsResponse.StatusCode);

        using var periodsBody = ApiTestClient.ParseJson(await periodsResponse.Content.ReadAsStringAsync());
        Assert.True(periodsBody.RootElement.TryGetProperty("count", out var countNode));
        Assert.True(countNode.GetInt32() > 0);
    }

    [Fact]
    public async Task AdminPendingApprovalFlow_WorksForSeedAdmin()
    {
        using var client = factory.CreateClient();
        await ApiTestClient.ReseedAsync(client);

        var cookie = await ApiTestClient.LoginAsSeedAsync(client, "admin@baleanchor.local");

        using var pendingResponse = await client.SendAsync(
            ApiTestClient.CreateAuthenticatedReadRequest("/api/v1/admin/approvals/pending", cookie));

        Assert.Equal(HttpStatusCode.OK, pendingResponse.StatusCode);

        using var pendingBody = ApiTestClient.ParseJson(await pendingResponse.Content.ReadAsStringAsync());
        Assert.True(pendingBody.RootElement.TryGetProperty("count", out _));
        Assert.True(pendingBody.RootElement.TryGetProperty("items", out _));
    }
}
