using BaleAnchorUtility.Server.Application.Billing;
using BaleAnchorUtility.Server.Application.Billing.Dtos;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.Extensions.Logging.Abstractions;

namespace BaleAnchorUtility.Server.Tests;

public sealed class BillingInputServiceTests
{
    [Fact]
    public async Task SubmitReadingsAsync_PersistsLatestReading()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active", "resident@example.com"));

        var readings = new InMemoryReadingSubmissionRepository();
        var tariffs = new InMemoryTariffVersionRepository();
        var service = CreateService(users, readings, tariffs);

        var response = await service.SubmitReadingsAsync(
            "u-active",
            new SubmitReadingsRequest
            {
                ReadingDate = "2026-07-27",
                ColdWaterReading = "11.5",
                HotWaterReading = "12.5",
                ElectricityReading = "99.2",
            },
            CancellationToken.None);

        Assert.Equal("u-active", response.UserId);
        Assert.Equal("2026-07-27", response.ReadingDate);

        var latest = await readings.GetLatestByUserIdAsync("u-active", CancellationToken.None);
        Assert.NotNull(latest);
        Assert.Equal(11.5m, latest!.ColdWaterReading);
        Assert.Equal(12.5m, latest.HotWaterReading);
        Assert.Equal(99.2m, latest.ElectricityReading);
    }

    [Fact]
    public async Task SubmitReadingsAsync_RejectsRollbackValues()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active", "resident@example.com"));

        var readings = new InMemoryReadingSubmissionRepository();
        await readings.AddAsync(
            new BaleAnchorUtility.Server.Domain.Billing.ReadingSubmission
            {
                Id = "r1",
                UserId = "u-active",
                ReadingDate = "2026-07-20",
                ColdWaterReading = 15m,
                HotWaterReading = 15m,
                ElectricityReading = 150m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var service = CreateService(users, readings, new InMemoryTariffVersionRepository());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SubmitReadingsAsync(
                "u-active",
                new SubmitReadingsRequest
                {
                    ReadingDate = "2026-07-21",
                    ColdWaterReading = "14.9",
                    HotWaterReading = "15",
                    ElectricityReading = "150",
                },
                CancellationToken.None));
    }

    [Fact]
    public async Task UpsertTariffAsync_RejectsDuplicateEffectiveDate()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active", "resident@example.com"));

        var tariffs = new InMemoryTariffVersionRepository();
        await tariffs.AddAsync(
            new BaleAnchorUtility.Server.Domain.Billing.TariffVersion
            {
                Id = "t1",
                UserId = "u-active",
                EffectiveFromDate = "2026-07-01",
                WaterTariffPerUnit = 1.11m,
                ElectricityTariffPerUnit = 0.22m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var service = CreateService(users, new InMemoryReadingSubmissionRepository(), tariffs);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpsertTariffAsync(
                "u-active",
                new UpsertTariffRequest
                {
                    EffectiveFromDate = "2026-07-01",
                    WaterTariffPerUnit = "1.15",
                    ElectricityTariffPerUnit = "0.25",
                },
                CancellationToken.None));
    }

    [Fact]
    public async Task GetActiveTariffAsync_ReturnsLatestApplicableVersion()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active", "resident@example.com"));

        var tariffs = new InMemoryTariffVersionRepository();
        await tariffs.AddAsync(
            new BaleAnchorUtility.Server.Domain.Billing.TariffVersion
            {
                Id = "t1",
                UserId = "u-active",
                EffectiveFromDate = "2026-07-01",
                WaterTariffPerUnit = 1.10m,
                ElectricityTariffPerUnit = 0.20m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        await tariffs.AddAsync(
            new BaleAnchorUtility.Server.Domain.Billing.TariffVersion
            {
                Id = "t2",
                UserId = "u-active",
                EffectiveFromDate = "2026-07-15",
                WaterTariffPerUnit = 1.25m,
                ElectricityTariffPerUnit = 0.35m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var service = CreateService(users, new InMemoryReadingSubmissionRepository(), tariffs);

        var active = await service.GetActiveTariffAsync("u-active", "2026-07-20", CancellationToken.None);

        Assert.Equal("2026-07-15", active.EffectiveFromDate);
        Assert.Equal("1.25", active.WaterTariffPerUnit);
        Assert.Equal("0.35", active.ElectricityTariffPerUnit);
    }

    private static BillingInputService CreateService(
        InMemoryUserRepository users,
        InMemoryReadingSubmissionRepository readings,
        InMemoryTariffVersionRepository tariffs)
    {
        return new BillingInputService(
            users,
            readings,
            tariffs,
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-28T12:00:00Z") },
            NullLogger<BillingInputService>.Instance);
    }

    private static UserAccount CreateActiveUser(string id, string email)
    {
        return new UserAccount
        {
            Id = id,
            EmailDisplay = email,
            EmailNormalized = email.ToUpperInvariant(),
            Role = UserRole.Resident,
            Status = UserAccountStatus.Active,
            CreatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            UpdatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            Version = 1,
        };
    }
}
