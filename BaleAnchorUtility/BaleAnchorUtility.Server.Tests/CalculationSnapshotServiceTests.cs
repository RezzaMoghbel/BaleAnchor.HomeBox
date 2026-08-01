using BaleAnchorUtility.Server.Application.Calculations;
using BaleAnchorUtility.Server.Domain.Billing;
using BaleAnchorUtility.Server.Domain.Onboarding;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.Extensions.Logging.Abstractions;

namespace BaleAnchorUtility.Server.Tests;

public sealed class CalculationSnapshotServiceTests
{
    [Fact]
    public async Task CalculateLatestPeriodAsync_CreatesSnapshotWithTotals()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateUser("u-active", UserAccountStatus.Active));

        var readings = new InMemoryReadingSubmissionRepository();
        await readings.AddAsync(new ReadingSubmission
        {
            Id = "r1",
            UserId = "u-active",
            ReadingDate = "2026-07-01",
            ColdWaterReading = 10m,
            HotWaterReading = 5m,
            ElectricityReading = 100m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        await readings.AddAsync(new ReadingSubmission
        {
            Id = "r2",
            UserId = "u-active",
            ReadingDate = "2026-08-01",
            ColdWaterReading = 13m,
            HotWaterReading = 7m,
            ElectricityReading = 120m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var tariffs = new InMemoryTariffVersionRepository();
        await tariffs.AddAsync(new TariffVersion
        {
            Id = "t1",
            UserId = "u-active",
            EffectiveFromDate = "2026-07-01",
            WaterTariffPerUnit = 2m,
            WaterStandingChargePerDay = 0m,
            WaterVatPercent = 0m,
            ElectricityTariffPerUnit = 0.5m,
            ElectricityStandingChargePerDay = 0m,
            ElectricityVatPercent = 0m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var setups = new InMemoryUtilitySetupRepository();
        setups.Seed(new UtilitySetupSubmission
        {
            Id = "setup-1",
            UserId = "u-active",
            MoveInDate = "2026-07-01",
            OpeningColdWaterReading = 0m,
            OpeningHotWaterReading = 0m,
            OpeningElectricityReading = 0m,
            InitialWaterTariffPerUnit = 2m,
            InitialElectricityTariffPerUnit = 0.5m,
            BoilerKwhPerCubicMeter = 3m,
            BoilerEfficiencyPercent = 100m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        });

        var snapshots = new InMemoryCalculationSnapshotRepository();

        var service = new CalculationSnapshotService(
            users,
            readings,
            tariffs,
            new InMemoryBoilerAssumptionVersionRepository(),
            setups,
            snapshots,
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-08-01T00:00:00Z") },
            NullLogger<CalculationSnapshotService>.Instance);

        var result = await service.CalculateLatestPeriodAsync("u-active", CancellationToken.None);

        Assert.Equal("u-active", result.UserId);
        Assert.Equal("2026-07-01", result.PeriodStartDate);
        Assert.Equal("2026-08-01", result.PeriodEndDateExclusive);
        Assert.Equal("3", result.ColdWaterUsed);
        Assert.Equal("2", result.HotWaterUsed);
        Assert.Equal("20", result.ApartmentElectricityUsed);
        Assert.Equal("6", result.BoilerElectricityUsed);
        Assert.Equal("6.00", result.ColdWaterTotal);
        Assert.Equal("4.00", result.HotWaterTotal);
        Assert.Equal("10.00", result.ApartmentElectricityTotal);
        Assert.Equal("3.00", result.BoilerElectricityTotal);
        Assert.Equal("10.00", result.WaterTotal);
        Assert.Equal("13.00", result.ElectricityTotal);
        Assert.Equal("23.00", result.PeriodTotal);
        Assert.False(result.ContainsEstimatedSegments);
        Assert.True(result.IntegrityChecksPassed);
        Assert.Equal("3", result.BoilerAssumptions.BoilerKwhPerCubicMeter);
        Assert.Equal("100", result.BoilerAssumptions.BoilerEfficiencyPercent);
        Assert.Equal("money-2dp-awayfromzero:v1", result.RoundingPolicyVersion);
        Assert.Single(result.TariffSegments);
        Assert.Equal("2026-07-01", result.TariffSegments[0].StartDate);
        Assert.Equal("2026-08-01", result.TariffSegments[0].EndDateExclusive);
        Assert.Equal("3", result.TariffSegments[0].ColdWaterUsage);
        Assert.Contains(result.ComponentLines, x => x.Component == "ColdWater");
        Assert.Contains(result.ComponentLines, x => x.Component == "BoilerElectricity");
    }

    [Fact]
    public async Task CalculateLatestPeriodAsync_MarksEstimatedWhenTariffChangesInsidePeriod()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateUser("u-active", UserAccountStatus.Active));

        var readings = new InMemoryReadingSubmissionRepository();
        await readings.AddAsync(new ReadingSubmission
        {
            Id = "r1",
            UserId = "u-active",
            ReadingDate = "2026-07-01",
            ColdWaterReading = 0m,
            HotWaterReading = 0m,
            ElectricityReading = 0m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        await readings.AddAsync(new ReadingSubmission
        {
            Id = "r2",
            UserId = "u-active",
            ReadingDate = "2026-07-31",
            ColdWaterReading = 30m,
            HotWaterReading = 30m,
            ElectricityReading = 30m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var tariffs = new InMemoryTariffVersionRepository();
        await tariffs.AddAsync(new TariffVersion
        {
            Id = "t1",
            UserId = "u-active",
            EffectiveFromDate = "2026-07-01",
            WaterTariffPerUnit = 1m,
            WaterStandingChargePerDay = 0m,
            WaterVatPercent = 0m,
            ElectricityTariffPerUnit = 1m,
            ElectricityStandingChargePerDay = 0m,
            ElectricityVatPercent = 0m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        await tariffs.AddAsync(new TariffVersion
        {
            Id = "t2",
            UserId = "u-active",
            EffectiveFromDate = "2026-07-15",
            WaterTariffPerUnit = 2m,
            WaterStandingChargePerDay = 0m,
            WaterVatPercent = 0m,
            ElectricityTariffPerUnit = 2m,
            ElectricityStandingChargePerDay = 0m,
            ElectricityVatPercent = 0m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var setups = new InMemoryUtilitySetupRepository();
        setups.Seed(new UtilitySetupSubmission
        {
            Id = "setup-1",
            UserId = "u-active",
            MoveInDate = "2026-07-01",
            OpeningColdWaterReading = 0m,
            OpeningHotWaterReading = 0m,
            OpeningElectricityReading = 0m,
            InitialWaterTariffPerUnit = 1m,
            InitialElectricityTariffPerUnit = 1m,
            BoilerKwhPerCubicMeter = 1m,
            BoilerEfficiencyPercent = 100m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        });

        var service = new CalculationSnapshotService(
            users,
            readings,
            tariffs,
            new InMemoryBoilerAssumptionVersionRepository(),
            setups,
            new InMemoryCalculationSnapshotRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-08-01T00:00:00Z") },
            NullLogger<CalculationSnapshotService>.Instance);

        var result = await service.CalculateLatestPeriodAsync("u-active", CancellationToken.None);

        Assert.True(result.ContainsEstimatedSegments);
        Assert.Equal(
            "Estimated tariff allocation - no meter reading was available on the tariff-change date.",
            result.EstimatedAllocationLabel);
        Assert.Equal(2, result.TariffSegments.Count);
        Assert.True(result.TariffSegments.All(x => x.IsEstimatedAllocation));
    }

    [Fact]
    public async Task CalculateLatestPeriodAsync_AppliesStandingAndVatRulesByComponent()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateUser("u-active", UserAccountStatus.Active));

        var readings = new InMemoryReadingSubmissionRepository();
        await readings.AddAsync(new ReadingSubmission
        {
            Id = "r1",
            UserId = "u-active",
            ReadingDate = "2026-07-01",
            ColdWaterReading = 10m,
            HotWaterReading = 5m,
            ElectricityReading = 10m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        await readings.AddAsync(new ReadingSubmission
        {
            Id = "r2",
            UserId = "u-active",
            ReadingDate = "2026-07-31",
            ColdWaterReading = 20m,
            HotWaterReading = 5m,
            ElectricityReading = 20m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var tariffs = new InMemoryTariffVersionRepository();
        await tariffs.AddAsync(new TariffVersion
        {
            Id = "t1",
            UserId = "u-active",
            EffectiveFromDate = "2026-07-01",
            WaterTariffPerUnit = 1m,
            WaterStandingChargePerDay = 0.1m,
            WaterVatPercent = 10m,
            ElectricityTariffPerUnit = 2m,
            ElectricityStandingChargePerDay = 0.2m,
            ElectricityVatPercent = 5m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var setups = new InMemoryUtilitySetupRepository();
        setups.Seed(new UtilitySetupSubmission
        {
            Id = "setup-1",
            UserId = "u-active",
            MoveInDate = "2026-07-01",
            OpeningColdWaterReading = 0m,
            OpeningHotWaterReading = 0m,
            OpeningElectricityReading = 0m,
            InitialWaterTariffPerUnit = 1m,
            InitialElectricityTariffPerUnit = 2m,
            BoilerKwhPerCubicMeter = 1m,
            BoilerEfficiencyPercent = 100m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        });

        var service = new CalculationSnapshotService(
            users,
            readings,
            tariffs,
            new InMemoryBoilerAssumptionVersionRepository(),
            setups,
            new InMemoryCalculationSnapshotRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-08-01T00:00:00Z") },
            NullLogger<CalculationSnapshotService>.Instance);

        var result = await service.CalculateLatestPeriodAsync("u-active", CancellationToken.None);

        Assert.Equal("14.30", result.ColdWaterTotal);
        Assert.Equal("0.00", result.HotWaterTotal);
        Assert.Equal("27.30", result.ApartmentElectricityTotal);
        Assert.Equal("0.00", result.BoilerElectricityTotal);
        Assert.Equal("14.30", result.WaterTotal);
        Assert.Equal("27.30", result.ElectricityTotal);
        Assert.Equal("41.60", result.PeriodTotal);
    }

    [Fact]
    public async Task CalculateLatestPeriodAsync_UsesUtilitySetupOpeningBaseline_WhenOnlyOneReadingExists()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateUser("u-active", UserAccountStatus.Active));

        var readings = new InMemoryReadingSubmissionRepository();
        await readings.AddAsync(new ReadingSubmission
        {
            Id = "r1",
            UserId = "u-active",
            ReadingDate = "2025-09-01",
            ColdWaterReading = 22.049m,
            HotWaterReading = 14.261m,
            ElectricityReading = 3190.25m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var tariffs = new InMemoryTariffVersionRepository();
        await tariffs.AddAsync(new TariffVersion
        {
            Id = "t1",
            UserId = "u-active",
            EffectiveFromDate = "2025-03-22",
            WaterTariffPerUnit = 3.0682m,
            WaterStandingChargePerDay = 0.019m,
            WaterVatPercent = 0m,
            ElectricityTariffPerUnit = 0.24796m,
            ElectricityStandingChargePerDay = 0.72626m,
            ElectricityVatPercent = 5m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var setups = new InMemoryUtilitySetupRepository();
        setups.Seed(new UtilitySetupSubmission
        {
            Id = "setup-1",
            UserId = "u-active",
            MoveInDate = "2025-03-22",
            OpeningColdWaterReading = 1.09m,
            OpeningHotWaterReading = 0.52m,
            OpeningElectricityReading = 2362.50m,
            InitialWaterTariffPerUnit = 3.0682m,
            InitialWaterStandingChargePerDay = 0.019m,
            InitialWaterVatPercent = 0m,
            InitialElectricityTariffPerUnit = 0.24796m,
            InitialElectricityStandingChargePerDay = 0.72626m,
            InitialElectricityVatPercent = 5m,
            BoilerKwhPerCubicMeter = 10.5m,
            BoilerEfficiencyPercent = 85m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        });

        var service = new CalculationSnapshotService(
            users,
            readings,
            tariffs,
            new InMemoryBoilerAssumptionVersionRepository(),
            setups,
            new InMemoryCalculationSnapshotRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-31T00:00:00Z") },
            NullLogger<CalculationSnapshotService>.Instance);

        var result = await service.CalculateLatestPeriodAsync("u-active", CancellationToken.None);

        Assert.Equal("2025-03-22", result.PeriodStartDate);
        Assert.Equal("2025-09-01", result.PeriodEndDateExclusive);
        Assert.Equal("20.959", result.ColdWaterUsed);
        Assert.Equal("13.741", result.HotWaterUsed);
        Assert.Equal("827.75", result.ApartmentElectricityUsed);
    }

    [Fact]
    public async Task CalculateLatestPeriodAsync_UsesReadingLinkedBoilerAssumptions_WhenActiveVersionIsDifferent()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateUser("u-active", UserAccountStatus.Active));

        var readings = new InMemoryReadingSubmissionRepository();
        await readings.AddAsync(new ReadingSubmission
        {
            Id = "r1",
            UserId = "u-active",
            ReadingDate = "2026-07-01",
            ColdWaterReading = 0m,
            HotWaterReading = 0m,
            ElectricityReading = 0m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        await readings.AddAsync(new ReadingSubmission
        {
            Id = "r2",
            UserId = "u-active",
            ReadingDate = "2026-08-01",
            ColdWaterReading = 0m,
            HotWaterReading = 2m,
            ElectricityReading = 10m,
            AppliedBoilerEffectiveFromDate = "2026-07-01",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var tariffs = new InMemoryTariffVersionRepository();
        await tariffs.AddAsync(new TariffVersion
        {
            Id = "t1",
            UserId = "u-active",
            EffectiveFromDate = "2026-07-01",
            WaterTariffPerUnit = 1m,
            WaterStandingChargePerDay = 0m,
            WaterVatPercent = 0m,
            ElectricityTariffPerUnit = 1m,
            ElectricityStandingChargePerDay = 0m,
            ElectricityVatPercent = 0m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var setups = new InMemoryUtilitySetupRepository();
        setups.Seed(new UtilitySetupSubmission
        {
            Id = "setup-1",
            UserId = "u-active",
            MoveInDate = "2026-07-01",
            OpeningColdWaterReading = 0m,
            OpeningHotWaterReading = 0m,
            OpeningElectricityReading = 0m,
            InitialWaterTariffPerUnit = 1m,
            InitialElectricityTariffPerUnit = 1m,
            HotWaterTemperatureCelsius = 55m,
            HotWaterHeatCapacity = 4.186m,
            HotWaterDensity = 1000m,
            KiloJouleToKiloWattHourFactor = 3600m,
            BoilerKwhPerCubicMeter = 50m,
            BoilerEfficiencyPercent = 50m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        });

        var boilers = new InMemoryBoilerAssumptionVersionRepository();
        await boilers.AddAsync(new BoilerAssumptionVersion
        {
            Id = "b1",
            UserId = "u-active",
            EffectiveFromDate = "2026-07-01",
            HotWaterTemperatureCelsius = 55m,
            HotWaterHeatCapacity = 4.186m,
            HotWaterDensity = 1000m,
            KiloJouleToKiloWattHourFactor = 3600m,
            BoilerKwhPerCubicMeter = 1m,
            BoilerEfficiencyPercent = 100m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        await boilers.AddAsync(new BoilerAssumptionVersion
        {
            Id = "b2",
            UserId = "u-active",
            EffectiveFromDate = "2026-07-15",
            HotWaterTemperatureCelsius = 60m,
            HotWaterHeatCapacity = 4.186m,
            HotWaterDensity = 1000m,
            KiloJouleToKiloWattHourFactor = 3600m,
            BoilerKwhPerCubicMeter = 10m,
            BoilerEfficiencyPercent = 100m,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var service = new CalculationSnapshotService(
            users,
            readings,
            tariffs,
            boilers,
            setups,
            new InMemoryCalculationSnapshotRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-08-01T00:00:00Z") },
            NullLogger<CalculationSnapshotService>.Instance);

        var result = await service.CalculateLatestPeriodAsync("u-active", CancellationToken.None);

        Assert.Equal("2", result.BoilerElectricityUsed);
        Assert.Equal("1", result.BoilerAssumptions.BoilerKwhPerCubicMeter);
        Assert.Equal("100", result.BoilerAssumptions.BoilerEfficiencyPercent);
    }

    private static UserAccount CreateUser(string id, UserAccountStatus status)
    {
        return new UserAccount
        {
            Id = id,
            EmailDisplay = "resident@example.com",
            EmailNormalized = "RESIDENT@EXAMPLE.COM",
            Role = UserRole.Resident,
            Status = status,
            CreatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            UpdatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            Version = 1,
        };
    }
}
