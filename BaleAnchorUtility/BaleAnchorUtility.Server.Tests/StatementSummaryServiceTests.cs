using BaleAnchorUtility.Server.Application.Billing;
using BaleAnchorUtility.Server.Domain.Billing;
using BaleAnchorUtility.Server.Domain.Calculations;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;

namespace BaleAnchorUtility.Server.Tests;

public sealed class StatementSummaryServiceTests
{
    [Fact]
    public async Task GetLatestSummaryAsync_ReturnsCombinedStatementAndBalanceData()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var snapshots = new InMemoryCalculationSnapshotRepository();
        await snapshots.AddAsync(CreateSnapshot("s1", "u-active", "2026-06-01", "2026-07-01", 120m), CancellationToken.None);
        await snapshots.AddAsync(CreateSnapshot("s2", "u-active", "2026-07-01", "2026-08-01", 80m), CancellationToken.None);

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

        var service = new StatementSummaryService(users, snapshots, payments);

        var response = await service.GetLatestSummaryAsync("u-active", CancellationToken.None);

        Assert.Equal("u-active", response.UserId);
        Assert.Equal("2026-07-01", response.PeriodStartDate);
        Assert.Equal("2026-08-01", response.PeriodEndDateExclusive);
        Assert.Equal("80.00", response.PeriodTotal);
        Assert.True(response.HasPayment);
        Assert.Equal("50.00", response.PaymentAmount);
        Assert.Equal("30.00", response.PeriodDifference);
        Assert.Equal("Amount outstanding", response.PeriodBalanceStatus);
        Assert.Equal("200.00", response.TotalCalculatedCharges);
        Assert.Equal("50.00", response.TotalRecordedPayments);
        Assert.Equal("150.00", response.CurrentBalance);
        Assert.Equal("Amount outstanding", response.CurrentBalanceStatus);
        Assert.Equal("calc-engine-v1", response.EngineVersion);
        Assert.Equal("money-2dp-awayfromzero:v1", response.RoundingPolicyVersion);
        Assert.Equal("3", response.BoilerAssumptions.BoilerKwhPerCubicMeter);
        Assert.Equal("100", response.BoilerAssumptions.BoilerEfficiencyPercent);
        Assert.Single(response.TariffSegments);
        Assert.Equal("ColdWater", response.ComponentLines[0].Component);
        Assert.True(response.IntegrityChecksPassed);
    }

    [Fact]
    public async Task GetLatestSummaryAsync_ThrowsConflict_WhenNoSnapshotExists()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var service = new StatementSummaryService(
            users,
            new InMemoryCalculationSnapshotRepository(),
            new InMemoryPaymentRepository());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.GetLatestSummaryAsync("u-active", CancellationToken.None));
    }

    [Fact]
    public async Task GetSelectedSummaryAsync_ReturnsSummary_WhenSnapshotIdProvided()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var snapshots = new InMemoryCalculationSnapshotRepository();
        await snapshots.AddAsync(CreateSnapshot("s1", "u-active", "2026-06-01", "2026-07-01", 120m), CancellationToken.None);
        await snapshots.AddAsync(CreateSnapshot("s2", "u-active", "2026-07-01", "2026-08-01", 80m), CancellationToken.None);

        var payments = new InMemoryPaymentRepository();
        await payments.AddAsync(
            new PaymentRecord
            {
                Id = "p2",
                UserId = "u-active",
                PeriodStartDate = "2026-07-01",
                PeriodEndDateExclusive = "2026-08-01",
                Amount = 80m,
                PaymentDate = "2026-08-02",
                Method = "Direct Debit",
                Source = "Resident",
                VerificationStatus = "Unverified",
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var service = new StatementSummaryService(users, snapshots, payments);

        var response = await service.GetSelectedSummaryAsync(
            "u-active",
            snapshotId: "s2",
            periodStartDate: null,
            periodEndDateExclusive: null,
            CancellationToken.None);

        Assert.Equal("2026-07-01", response.PeriodStartDate);
        Assert.Equal("2026-08-01", response.PeriodEndDateExclusive);
        Assert.Equal("0.00", response.PeriodDifference);
        Assert.Equal("Paid in full", response.PeriodBalanceStatus);
    }

    [Fact]
    public async Task GetSelectedSummaryAsync_ReturnsSummary_WhenPeriodProvided()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var snapshots = new InMemoryCalculationSnapshotRepository();
        await snapshots.AddAsync(CreateSnapshot("s1", "u-active", "2026-06-01", "2026-07-01", 50m), CancellationToken.None);

        var service = new StatementSummaryService(users, snapshots, new InMemoryPaymentRepository());

        var response = await service.GetSelectedSummaryAsync(
            "u-active",
            snapshotId: null,
            periodStartDate: "2026-06-01",
            periodEndDateExclusive: "2026-07-01",
            CancellationToken.None);

        Assert.Equal("2026-06-01", response.PeriodStartDate);
        Assert.Equal("2026-07-01", response.PeriodEndDateExclusive);
        Assert.Equal("50.00", response.PeriodTotal);
    }

    [Fact]
    public async Task GetSelectedSummaryAsync_ThrowsValidation_WhenSelectionMissing()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var service = new StatementSummaryService(
            users,
            new InMemoryCalculationSnapshotRepository(),
            new InMemoryPaymentRepository());

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.GetSelectedSummaryAsync("u-active", null, null, null, CancellationToken.None));
    }

    [Fact]
    public async Task GetSelectedSummaryAsync_ThrowsNotFound_WhenSnapshotDoesNotExist()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var service = new StatementSummaryService(
            users,
            new InMemoryCalculationSnapshotRepository(),
            new InMemoryPaymentRepository());

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.GetSelectedSummaryAsync("u-active", "missing", null, null, CancellationToken.None));
    }

    [Fact]
    public async Task GetStatementPeriodsAsync_ReturnsNewestFirst_WithPaymentMetadata()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var snapshots = new InMemoryCalculationSnapshotRepository();
        await snapshots.AddAsync(CreateSnapshot("s-old", "u-active", "2026-06-01", "2026-07-01", 120m), CancellationToken.None);
        await snapshots.AddAsync(CreateSnapshot("s-new", "u-active", "2026-07-01", "2026-08-01", 80m), CancellationToken.None);

        var payments = new InMemoryPaymentRepository();
        await payments.AddAsync(
            new PaymentRecord
            {
                Id = "p-new",
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

        var service = new StatementSummaryService(users, snapshots, payments);

        var response = await service.GetStatementPeriodsAsync("u-active", CancellationToken.None);

        Assert.Equal(2, response.Count);
        Assert.Equal("s-new", response.Items[0].SnapshotId);
        Assert.Equal("s-old", response.Items[1].SnapshotId);
        Assert.True(response.Items[0].HasPayment);
        Assert.Equal("50.00", response.Items[0].PaymentAmount);
        Assert.Equal("30.00", response.Items[0].PeriodDifference);
        Assert.False(response.Items[1].HasPayment);
    }

    [Fact]
    public async Task GetStatementPeriodsAsync_ReturnsEmptyList_WhenNoSnapshotsExist()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var service = new StatementSummaryService(
            users,
            new InMemoryCalculationSnapshotRepository(),
            new InMemoryPaymentRepository());

        var response = await service.GetStatementPeriodsAsync("u-active", CancellationToken.None);

        Assert.Equal("u-active", response.UserId);
        Assert.Equal(0, response.Count);
        Assert.Empty(response.Items);
    }

    [Fact]
    public async Task GetStatementPeriodsAsync_ReturnsLatestSnapshotPerPeriod_WhenDuplicatesExist()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var snapshots = new InMemoryCalculationSnapshotRepository();
        await snapshots.AddAsync(CreateSnapshot("s-old", "u-active", "2026-07-01", "2026-08-01", 80m), CancellationToken.None);

        var newerSnapshot = CreateSnapshot("s-newer", "u-active", "2026-07-01", "2026-08-01", 82m);
        newerSnapshot.CreatedAtUtc = DateTimeOffset.Parse("2026-08-05T00:00:00Z");
        await snapshots.AddAsync(newerSnapshot, CancellationToken.None);

        var service = new StatementSummaryService(users, snapshots, new InMemoryPaymentRepository());

        var response = await service.GetStatementPeriodsAsync("u-active", CancellationToken.None);

        Assert.Single(response.Items);
        Assert.Equal("s-newer", response.Items[0].SnapshotId);
        Assert.Equal("82.00", response.Items[0].PeriodTotal);
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
            DaysInPeriod = 30,
            ColdWaterUsed = 0m,
            HotWaterUsed = 0m,
            ApartmentElectricityUsed = 0m,
            BoilerElectricityUsed = 0m,
            ColdWaterTotal = 0m,
            HotWaterTotal = 0m,
            ApartmentElectricityTotal = 0m,
            BoilerElectricityTotal = 0m,
            WaterTotal = 0m,
            ElectricityTotal = 0m,
            PeriodTotal = periodTotal,
            ContainsEstimatedSegments = false,
            EstimatedAllocationLabel = null,
            EngineVersion = "calc-engine-v1",
            RoundingPolicyVersion = "money-2dp-awayfromzero:v1",
            InputHash = "hash",
            EquationSummary = "eq",
            BoilerKwhPerCubicMeterUsed = 3m,
            BoilerEfficiencyPercentUsed = 100m,
            TariffSegments =
            [
                new CalculationTariffSegmentTrace
                {
                    StartDate = periodStartDate,
                    EndDateExclusive = periodEndDateExclusive,
                    Days = 30,
                    IsEstimatedAllocation = false,
                    WaterTariffPerUnit = 2m,
                    WaterStandingChargePerDay = 0m,
                    WaterVatPercent = 0m,
                    ElectricityTariffPerUnit = 0.5m,
                    ElectricityStandingChargePerDay = 0m,
                    ElectricityVatPercent = 0m,
                    ColdWaterUsage = 3m,
                    HotWaterUsage = 2m,
                    ApartmentElectricityUsage = 20m,
                    BoilerElectricityUsage = 6m,
                },
            ],
            ComponentLines =
            [
                new CalculationComponentLineTrace
                {
                    Component = "ColdWater",
                    Usage = 3m,
                    UsageSubtotal = 6m,
                    StandingSubtotal = 0m,
                    VatAmount = 0m,
                    Total = 6m,
                    Equation = "cold",
                },
            ],
            IntegrityChecksPassed = true,
            IntegrityDigest = "Validated",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        };
    }
}
