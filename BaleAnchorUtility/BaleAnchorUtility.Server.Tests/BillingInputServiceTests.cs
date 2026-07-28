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
        var service = CreateService(users, readings, tariffs, new InMemoryPaymentRepository());

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

        var service = CreateService(users, readings, new InMemoryTariffVersionRepository(), new InMemoryPaymentRepository());

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
                WaterStandingChargePerDay = 0.01m,
                WaterVatPercent = 0m,
                ElectricityTariffPerUnit = 0.22m,
                ElectricityStandingChargePerDay = 0.02m,
                ElectricityVatPercent = 5m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var service = CreateService(users, new InMemoryReadingSubmissionRepository(), tariffs, new InMemoryPaymentRepository());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpsertTariffAsync(
                "u-active",
                new UpsertTariffRequest
                {
                    EffectiveFromDate = "2026-07-01",
                    WaterTariffPerUnit = "1.15",
                    WaterStandingChargePerDay = "0.01",
                    WaterVatPercent = "0",
                    ElectricityTariffPerUnit = "0.25",
                    ElectricityStandingChargePerDay = "0.02",
                    ElectricityVatPercent = "5",
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
                WaterStandingChargePerDay = 0.01m,
                WaterVatPercent = 0m,
                ElectricityTariffPerUnit = 0.20m,
                ElectricityStandingChargePerDay = 0.02m,
                ElectricityVatPercent = 5m,
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
                WaterStandingChargePerDay = 0.01m,
                WaterVatPercent = 0m,
                ElectricityTariffPerUnit = 0.35m,
                ElectricityStandingChargePerDay = 0.02m,
                ElectricityVatPercent = 5m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var service = CreateService(users, new InMemoryReadingSubmissionRepository(), tariffs, new InMemoryPaymentRepository());

        var active = await service.GetActiveTariffAsync("u-active", "2026-07-20", CancellationToken.None);

        Assert.Equal("2026-07-15", active.EffectiveFromDate);
        Assert.Equal("1.25", active.WaterTariffPerUnit);
        Assert.Equal("0.01", active.WaterStandingChargePerDay);
        Assert.Equal("0", active.WaterVatPercent);
        Assert.Equal("0.35", active.ElectricityTariffPerUnit);
        Assert.Equal("0.02", active.ElectricityStandingChargePerDay);
        Assert.Equal("5", active.ElectricityVatPercent);
    }

    [Fact]
    public async Task DeleteLatestReadingAsync_DeletesLatestReading_WhenNoLinkedPaymentExists()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active", "resident@example.com"));

        var readings = new InMemoryReadingSubmissionRepository();
        await readings.AddAsync(
            new BaleAnchorUtility.Server.Domain.Billing.ReadingSubmission
            {
                Id = "r1",
                UserId = "u-active",
                ReadingDate = "2026-07-01",
                ColdWaterReading = 10m,
                HotWaterReading = 10m,
                ElectricityReading = 10m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        await readings.AddAsync(
            new BaleAnchorUtility.Server.Domain.Billing.ReadingSubmission
            {
                Id = "r2",
                UserId = "u-active",
                ReadingDate = "2026-08-01",
                ColdWaterReading = 15m,
                HotWaterReading = 15m,
                ElectricityReading = 20m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var service = CreateService(users, readings, new InMemoryTariffVersionRepository(), new InMemoryPaymentRepository());

        var response = await service.DeleteLatestReadingAsync("u-active", CancellationToken.None);

        Assert.Equal("r2", response.DeletedReadingId);

        var latest = await readings.GetLatestByUserIdAsync("u-active", CancellationToken.None);
        Assert.NotNull(latest);
        Assert.Equal("r1", latest!.Id);
    }

    [Fact]
    public async Task DeleteLatestReadingAsync_RejectsDelete_WhenLatestPeriodHasPayment()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active", "resident@example.com"));

        var readings = new InMemoryReadingSubmissionRepository();
        await readings.AddAsync(
            new BaleAnchorUtility.Server.Domain.Billing.ReadingSubmission
            {
                Id = "r1",
                UserId = "u-active",
                ReadingDate = "2026-07-01",
                ColdWaterReading = 10m,
                HotWaterReading = 10m,
                ElectricityReading = 10m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        await readings.AddAsync(
            new BaleAnchorUtility.Server.Domain.Billing.ReadingSubmission
            {
                Id = "r2",
                UserId = "u-active",
                ReadingDate = "2026-08-01",
                ColdWaterReading = 15m,
                HotWaterReading = 15m,
                ElectricityReading = 20m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var payments = new InMemoryPaymentRepository();
        await payments.AddAsync(
            new BaleAnchorUtility.Server.Domain.Billing.PaymentRecord
            {
                Id = "p1",
                UserId = "u-active",
                PeriodStartDate = "2026-07-01",
                PeriodEndDateExclusive = "2026-08-01",
                Amount = 100m,
                PaymentDate = "2026-08-02",
                Method = "Direct Debit",
                Source = "Resident",
                VerificationStatus = "Unverified",
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var service = CreateService(users, readings, new InMemoryTariffVersionRepository(), payments);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.DeleteLatestReadingAsync("u-active", CancellationToken.None));
    }

    private static BillingInputService CreateService(
        InMemoryUserRepository users,
        InMemoryReadingSubmissionRepository readings,
        InMemoryTariffVersionRepository tariffs,
        InMemoryPaymentRepository payments)
    {
        return new BillingInputService(
            users,
            readings,
            tariffs,
            payments,
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
