using BaleAnchorUtility.Server.Application.Billing;
using BaleAnchorUtility.Server.Application.Billing.Dtos;
using BaleAnchorUtility.Server.Application.Notifications;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

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
        await SeedTariffVersionAsync(tariffs, "u-active", "2026-07-01", 1.10m, 0.20m);
        await SeedTariffVersionAsync(tariffs, "u-active", "2026-07-15", 1.25m, 0.35m);
        var service = CreateService(users, readings, tariffs, new InMemoryPaymentRepository());

        var response = await service.SubmitReadingsAsync(
            "u-active",
            new SubmitReadingsRequest
            {
                ReadingDate = "2026-07-27",
                ColdWaterReading = "11.5",
                HotWaterReading = "12.5",
                ElectricityReading = "99.2",
                TariffEffectiveFromDate = "2026-07-15",
            },
            CancellationToken.None);

        Assert.Equal("u-active", response.UserId);
        Assert.Equal("2026-07-27", response.ReadingDate);
        Assert.Equal("2026-07-15", response.AppliedTariffEffectiveFromDate);

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

        var tariffs = new InMemoryTariffVersionRepository();
        await SeedTariffVersionAsync(tariffs, "u-active", "2026-07-01", 1.10m, 0.20m);
        await SeedTariffVersionAsync(tariffs, "u-active", "2026-07-15", 1.25m, 0.35m);

        var service = CreateService(users, readings, tariffs, new InMemoryPaymentRepository());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SubmitReadingsAsync(
                "u-active",
                new SubmitReadingsRequest
                {
                    ReadingDate = "2026-07-21",
                    ColdWaterReading = "14.9",
                    HotWaterReading = "15",
                    ElectricityReading = "150",
                    TariffEffectiveFromDate = "2026-07-15",
                },
                CancellationToken.None));
    }

    [Fact]
    public async Task SubmitReadingsAsync_RejectsSelectedTariff_WhenNotLatestApplicable()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active", "resident@example.com"));

        var readings = new InMemoryReadingSubmissionRepository();
        var tariffs = new InMemoryTariffVersionRepository();
        await SeedTariffVersionAsync(tariffs, "u-active", "2024-07-01", 1.10m, 0.20m);
        await SeedTariffVersionAsync(tariffs, "u-active", "2025-07-01", 1.25m, 0.35m);

        var service = CreateService(users, readings, tariffs, new InMemoryPaymentRepository());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SubmitReadingsAsync(
                "u-active",
                new SubmitReadingsRequest
                {
                    ReadingDate = "2026-07-27",
                    ColdWaterReading = "11.5",
                    HotWaterReading = "12.5",
                    ElectricityReading = "99.2",
                    TariffEffectiveFromDate = "2024-07-01",
                },
                CancellationToken.None));
    }

    [Fact]
    public async Task GetTariffOptionsAsync_ReturnsLatestApplicableFirst_WithRecommendation()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active", "resident@example.com"));

        var tariffs = new InMemoryTariffVersionRepository();
        await SeedTariffVersionAsync(tariffs, "u-active", "2024-07-01", 1.10m, 0.20m);
        await SeedTariffVersionAsync(tariffs, "u-active", "2025-07-01", 1.25m, 0.35m);

        var service = CreateService(
            users,
            new InMemoryReadingSubmissionRepository(),
            tariffs,
            new InMemoryPaymentRepository());

        var result = await service.GetTariffOptionsAsync("u-active", "2026-07-27", CancellationToken.None);

        Assert.Equal("u-active", result.UserId);
        Assert.Equal("2026-07-27", result.OnDate);
        Assert.Equal(2, result.Count);
        Assert.Equal("2025-07-01", result.RecommendedEffectiveFromDate);
        Assert.Equal("2025-07-01", result.Items[0].EffectiveFromDate);
        Assert.True(result.Items[0].IsLatestApplicable);
    }

    [Fact]
    public async Task GetTariffOptionsAsync_BootstrapsFromUtilitySetup_WhenTariffsMissing()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active", "resident@example.com"));

        var utilitySetups = new InMemoryUtilitySetupRepository();
        utilitySetups.Seed(
            new BaleAnchorUtility.Server.Domain.Onboarding.UtilitySetupSubmission
            {
                Id = "us-1",
                UserId = "u-active",
                MoveInDate = "2025-03-22",
                OpeningColdWaterReading = 1m,
                OpeningHotWaterReading = 1m,
                OpeningElectricityReading = 1m,
                InitialWaterTariffPerUnit = 3.0682m,
                InitialWaterStandingChargePerDay = 0.019m,
                InitialWaterVatPercent = 0m,
                InitialElectricityTariffPerUnit = 0.24796m,
                InitialElectricityStandingChargePerDay = 0.72626m,
                InitialElectricityVatPercent = 5m,
                HotWaterTemperatureCelsius = 55m,
                HotWaterHeatCapacity = 4.186m,
                HotWaterDensity = 1000m,
                KiloJouleToKiloWattHourFactor = 3600m,
                BoilerKwhPerCubicMeter = 10.5m,
                BoilerEfficiencyPercent = 85m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            });

        var service = CreateService(
            users,
            new InMemoryReadingSubmissionRepository(),
            new InMemoryTariffVersionRepository(),
            new InMemoryPaymentRepository(),
            utilitySetups);

        var result = await service.GetTariffOptionsAsync("u-active", "2026-07-27", CancellationToken.None);

        Assert.Equal(1, result.Count);
        Assert.Equal("2025-03-22", result.RecommendedEffectiveFromDate);
        Assert.Equal("3.0682", result.Items[0].WaterTariffPerUnit);
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
                ReadingDate = "2026-07-20",
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

    [Fact]
    public async Task UpdateLatestReadingsAsync_UpdatesLatestReading_WhenPeriodIsUnpaid()
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

        var response = await service.UpdateLatestReadingsAsync(
            "u-active",
            new SubmitReadingsRequest
            {
                ReadingDate = "2026-07-21",
                ColdWaterReading = "16",
                HotWaterReading = "16",
                ElectricityReading = "21",
            },
            CancellationToken.None);

        Assert.Equal("2026-07-21", response.ReadingDate);

        var latest = await readings.GetLatestByUserIdAsync("u-active", CancellationToken.None);
        Assert.NotNull(latest);
        Assert.Equal("r2", latest!.Id);
        Assert.Equal("2026-07-21", latest.ReadingDate);
        Assert.Equal(16m, latest.ColdWaterReading);
        Assert.Equal(16m, latest.HotWaterReading);
        Assert.Equal(21m, latest.ElectricityReading);
    }

    [Fact]
    public async Task UpdateLatestReadingsAsync_RejectsUpdate_WhenLatestPeriodHasPayment()
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
            service.UpdateLatestReadingsAsync(
                "u-active",
                new SubmitReadingsRequest
                {
                    ReadingDate = "2026-08-02",
                    ColdWaterReading = "16",
                    HotWaterReading = "16",
                    ElectricityReading = "21",
                },
                CancellationToken.None));
    }

    private static BillingInputService CreateService(
        InMemoryUserRepository users,
        InMemoryReadingSubmissionRepository readings,
        InMemoryTariffVersionRepository tariffs,
        InMemoryPaymentRepository payments,
        InMemoryUtilitySetupRepository? utilitySetups = null)
    {
        return new BillingInputService(
            users,
            readings,
            utilitySetups ?? new InMemoryUtilitySetupRepository(),
            tariffs,
            payments,
            new ReminderDispatchService(
                users,
                new InMemoryNotificationPreferencesRepository(),
                new InMemoryPushSubscriptionRepository(),
                new InMemoryReminderDispatchJobRepository(),
                new NoOpEmailSender(),
                new NoOpWebPushSender(),
                new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-28T12:00:00Z") },
                Options.Create(new PushNotificationOptions()),
                NullLogger<ReminderDispatchService>.Instance),
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

    private static Task SeedTariffVersionAsync(
        InMemoryTariffVersionRepository tariffs,
        string userId,
        string effectiveFromDate,
        decimal waterTariffPerUnit,
        decimal electricityTariffPerUnit)
    {
        return tariffs.AddAsync(
            new BaleAnchorUtility.Server.Domain.Billing.TariffVersion
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = userId,
                EffectiveFromDate = effectiveFromDate,
                WaterTariffPerUnit = waterTariffPerUnit,
                WaterStandingChargePerDay = 0.01m,
                WaterVatPercent = 0m,
                ElectricityTariffPerUnit = electricityTariffPerUnit,
                ElectricityStandingChargePerDay = 0.02m,
                ElectricityVatPercent = 5m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);
    }
}
