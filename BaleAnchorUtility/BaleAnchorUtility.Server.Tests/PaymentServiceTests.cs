using BaleAnchorUtility.Server.Application.Billing;
using BaleAnchorUtility.Server.Application.Billing.Dtos;
using BaleAnchorUtility.Server.Domain.Billing;
using BaleAnchorUtility.Server.Domain.Calculations;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.Extensions.Logging.Abstractions;

namespace BaleAnchorUtility.Server.Tests;

public sealed class PaymentServiceTests
{
    [Fact]
    public async Task RecordLatestPeriodPaymentAsync_CreatesPaymentForLatestSnapshot()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var snapshots = new InMemoryCalculationSnapshotRepository();
        await snapshots.AddAsync(CreateSnapshot("s1", "u-active", "2026-07-01", "2026-08-01", 123.45m), CancellationToken.None);

        var payments = new InMemoryPaymentRepository();
        var service = CreateService(users, snapshots, payments);

        var response = await service.RecordLatestPeriodPaymentAsync(
            "u-active",
            new RecordLatestPeriodPaymentRequest
            {
                Amount = "100.00",
                PaymentDate = "2026-08-02",
                Method = "Direct Debit",
                Reference = "AUG-01",
                Notes = "Resident payment",
            },
            CancellationToken.None);

        Assert.Equal("u-active", response.UserId);
        Assert.Equal("100.00", response.Amount);
        Assert.Equal("Payment recorded by resident.", response.Message);
        Assert.Equal("Resident", response.Source);
        Assert.Equal("Unverified", response.VerificationStatus);

        var stored = await payments.GetByIdAsync(response.PaymentId, CancellationToken.None);
        Assert.NotNull(stored);
        Assert.Equal("2026-07-01", stored!.PeriodStartDate);
        Assert.Equal("2026-08-01", stored.PeriodEndDateExclusive);
    }

    [Fact]
    public async Task RecordLatestPeriodPaymentAsync_RejectsSecondPaymentForSamePeriod()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var snapshots = new InMemoryCalculationSnapshotRepository();
        await snapshots.AddAsync(CreateSnapshot("s1", "u-active", "2026-07-01", "2026-08-01", 123.45m), CancellationToken.None);

        var payments = new InMemoryPaymentRepository();
        await payments.AddAsync(
            new PaymentRecord
            {
                Id = "p1",
                UserId = "u-active",
                PeriodStartDate = "2026-07-01",
                PeriodEndDateExclusive = "2026-08-01",
                Amount = 50m,
                PaymentDate = "2026-08-01",
                Method = "Card",
                Source = "Resident",
                VerificationStatus = "Unverified",
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var service = CreateService(users, snapshots, payments);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RecordLatestPeriodPaymentAsync(
                "u-active",
                new RecordLatestPeriodPaymentRequest
                {
                    Amount = "10",
                    PaymentDate = "2026-08-02",
                    Method = "Card",
                },
                CancellationToken.None));
    }

    [Fact]
    public async Task DeletePaymentAsync_RejectsWhenPaymentIsNotLatest()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateActiveUser("u-active"));

        var payments = new InMemoryPaymentRepository();
        await payments.AddAsync(
            new PaymentRecord
            {
                Id = "p-old",
                UserId = "u-active",
                PeriodStartDate = "2026-06-01",
                PeriodEndDateExclusive = "2026-07-01",
                Amount = 90m,
                PaymentDate = "2026-07-02",
                Method = "Card",
                Source = "Resident",
                VerificationStatus = "Unverified",
                CreatedAtUtc = DateTimeOffset.Parse("2026-07-02T00:00:00Z"),
                UpdatedAtUtc = DateTimeOffset.Parse("2026-07-02T00:00:00Z"),
                Version = 1,
            },
            CancellationToken.None);

        await payments.AddAsync(
            new PaymentRecord
            {
                Id = "p-new",
                UserId = "u-active",
                PeriodStartDate = "2026-07-01",
                PeriodEndDateExclusive = "2026-08-01",
                Amount = 100m,
                PaymentDate = "2026-08-02",
                Method = "Direct Debit",
                Source = "Resident",
                VerificationStatus = "Unverified",
                CreatedAtUtc = DateTimeOffset.Parse("2026-08-02T00:00:00Z"),
                UpdatedAtUtc = DateTimeOffset.Parse("2026-08-02T00:00:00Z"),
                Version = 1,
            },
            CancellationToken.None);

        var service = CreateService(users, new InMemoryCalculationSnapshotRepository(), payments);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.DeletePaymentAsync("u-active", "p-old", CancellationToken.None));
    }

    [Fact]
    public async Task GetAllTimeBalanceAsync_ReturnsOutstandingStatus()
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
                PeriodStartDate = "2026-06-01",
                PeriodEndDateExclusive = "2026-07-01",
                Amount = 150m,
                PaymentDate = "2026-07-03",
                Method = "Bank Transfer",
                Source = "Resident",
                VerificationStatus = "Unverified",
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var service = CreateService(users, snapshots, payments);

        var result = await service.GetAllTimeBalanceAsync("u-active", CancellationToken.None);

        Assert.Equal("200.00", result.TotalCalculatedCharges);
        Assert.Equal("150.00", result.TotalRecordedPayments);
        Assert.Equal("50.00", result.Balance);
        Assert.Equal("Amount outstanding", result.BalanceStatus);
    }

    private static PaymentService CreateService(
        InMemoryUserRepository users,
        InMemoryCalculationSnapshotRepository snapshots,
        InMemoryPaymentRepository payments)
    {
        return new PaymentService(
            users,
            snapshots,
            payments,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-08-10T10:00:00Z") },
            NullLogger<PaymentService>.Instance);
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
            EngineVersion = "calc-engine-v1",
            InputHash = "hash",
            EquationSummary = "eq",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        };
    }
}
