using System.Net;
using System.Net.Http.Json;

namespace BaleAnchorUtility.Server.Tests.Integration;

[Collection("Phase8IntegrationSerial")]
public sealed class Phase8SecurityIntegrationTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory factory;

    public Phase8SecurityIntegrationTests(ApiWebApplicationFactory factory)
    {
        this.factory = factory;
    }

    [Fact]
    public async Task AdminPendingApprovals_ReturnsForbidden_ForResidentSession()
    {
        using var client = factory.CreateClient();
        await ApiTestClient.ReseedAsync(client);

        var cookie = await ApiTestClient.LoginAsSeedAsync(client, "resident.active@baleanchor.local");

        using var response = await client.SendAsync(
            ApiTestClient.CreateAuthenticatedReadRequest("/api/v1/admin/approvals/pending", cookie));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task BillingReadingsPost_ReturnsForbidden_WhenCsrfOriginMissingForAuthenticatedWrite()
    {
        using var client = factory.CreateClient();
        await ApiTestClient.ReseedAsync(client);

        var cookie = await ApiTestClient.LoginAsSeedAsync(client, "resident.active@baleanchor.local");

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/billing/readings")
        {
            Content = JsonContent.Create(new
            {
                readingDate = "2026-10-20",
                coldWaterReading = "140.100",
                hotWaterReading = "80.500",
                electricityReading = "435.250",
            }),
        };
        request.Headers.Add("Cookie", cookie);

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }
}
