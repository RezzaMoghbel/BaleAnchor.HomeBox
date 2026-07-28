using BaleAnchorUtility.Server.Application.Billing;
using BaleAnchorUtility.Server.Domain.Billing;
using BaleAnchorUtility.Server.Domain.Calculations;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;

namespace BaleAnchorUtility.Server.Tests;

public sealed class StatementPdfExportServiceTests
{
    [Fact]
    public async Task ExportSelectedPeriodPdfAsync_ReturnsPdfDocument_ForPeriodSelection()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var snapshots = new InMemoryCalculationSnapshotRepository();
        await snapshots.AddAsync(CreateSnapshot("s1", "u-active", "2026-07-01", "2026-08-01", 90m), CancellationToken.None);

        var payments = new InMemoryPaymentRepository();
        await payments.AddAsync(
            new PaymentRecord
            {
                Id = "p1",
                UserId = "u-active",
                PeriodStartDate = "2026-07-01",
                PeriodEndDateExclusive = "2026-08-01",
                Amount = 50m,
                PaymentDate = "2026-08-02",
                Method = "Direct Debit",
                Source = "Resident",
                VerificationStatus = "Unverified",
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var exports = new InMemoryStatementExportRepository();
        var summaryService = new StatementSummaryService(users, snapshots, payments);
        var service = new StatementPdfExportService(
            summaryService,
            new FakeStatementPdfGenerator(),
            exports,
            snapshots,
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-08-10T10:00:00Z") });

        var response = await service.ExportSelectedPeriodPdfAsync(
            "u-active",
            snapshotId: null,
            periodStartDate: "2026-07-01",
            periodEndDateExclusive: "2026-08-01",
            CancellationToken.None);

        Assert.Equal("application/pdf", response.ContentType);
        Assert.Equal("statement-2026-07-01-to-2026-08-01.pdf", response.FileName);
        Assert.NotEmpty(response.Content);
        Assert.False(string.IsNullOrWhiteSpace(response.ExportId));
        Assert.Equal("statement-template-v1", response.TemplateVersion);
        Assert.Equal("fake-pdf-v1", response.RendererVersion);
        Assert.False(string.IsNullOrWhiteSpace(response.ContentSha256));

        var history = await service.GetExportHistoryAsync("u-active", CancellationToken.None);
        Assert.Equal(1, history.Count);
        Assert.Equal(response.ExportId, history.Items[0].ExportId);
        Assert.Equal("statement-template-v1", history.Items[0].TemplateVersion);
    }

    private static UserAccount CreateActiveUser(string id)
    {
        return new UserAccount
        {
            Id = id,
            EmailDisplay = "resident@example.com",
            EmailNormalized = "RESIDENT@EXAMPLE.COM",
            Role = UserRole.Resident,
            Status = UserAccountStatus.Active,
            CreatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            UpdatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            Version = 1,
        };
    }

    private static CalculationSnapshot CreateSnapshot(
        string id,
        string userId,
        string periodStartDate,
        string periodEndDateExclusive,
        decimal periodTotal)
    {
        return new CalculationSnapshot
        {
            Id = id,
            UserId = userId,
            PeriodStartDate = periodStartDate,
            PeriodEndDateExclusive = periodEndDateExclusive,
            DaysInPeriod = 31,
            ColdWaterUsed = 0m,
            HotWaterUsed = 0m,
            ApartmentElectricityUsed = 0m,
            BoilerElectricityUsed = 0m,
            ColdWaterTotal = 0m,
            HotWaterTotal = 0m,
            ApartmentElectricityTotal = 0m,
            BoilerElectricityTotal = 0m,
            WaterTotal = 45m,
            ElectricityTotal = 45m,
            PeriodTotal = periodTotal,
            ContainsEstimatedSegments = false,
            EngineVersion = "calc-engine-v1",
            InputHash = "hash",
            EquationSummary = "eq",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        };
    }
}
