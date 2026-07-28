using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Billing;
using BaleAnchorUtility.Server.Application.Billing.Dtos;
using BaleAnchorUtility.Server.Application.Calculations;
using BaleAnchorUtility.Server.Controllers;
using BaleAnchorUtility.Server.Domain.Auth;
using BaleAnchorUtility.Server.Domain.Billing;
using BaleAnchorUtility.Server.Domain.Calculations;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Tests;

public sealed class BillingControllerTests
{
    [Fact]
    public async Task CalculateLatestPeriod_Returns401_WhenUnauthenticated()
    {
        var controller = CreateController(withSessionCookie: false, seedUser: false);

        var action = await controller.CalculateLatestPeriod(CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(action.Result);
    }

    [Fact]
    public async Task CalculateLatestPeriod_Returns409Problem_WhenCalculationInputsMissing()
    {
        var controller = CreateController(withSessionCookie: true, seedUser: true);

        var action = await controller.CalculateLatestPeriod(CancellationToken.None);

        var conflict = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(conflict.Value);

        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);
        Assert.Equal("BILLING_CALCULATION_CONFLICT", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task RecordLatestPeriodPayment_Returns409_WhenSnapshotMissing()
    {
        var controller = CreateController(withSessionCookie: true, seedUser: true);

        var action = await controller.RecordLatestPeriodPayment(
            new RecordLatestPeriodPaymentRequest
            {
                Amount = "100.00",
                PaymentDate = "2026-08-10",
                Method = "Direct Debit",
            },
            CancellationToken.None);

        var conflict = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(conflict.Value);

        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);
        Assert.Equal("BILLING_PAYMENT_CONFLICT", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task GetLatestPeriodPaymentSummary_ReturnsPayload_WhenSnapshotExists()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u1", "resident@example.com", UserRole.Resident, UserAccountStatus.Active);
        users.Seed(actor);

        var sessions = SessionFor(actor);
        var auth = AuthServiceTestFactory.Create(users, sessions);

        var billing = new BillingInputService(
            users,
            new InMemoryReadingSubmissionRepository(),
            new InMemoryTariffVersionRepository(),
            new InMemoryPaymentRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<BillingInputService>.Instance);

        var snapshots = new InMemoryCalculationSnapshotRepository();
        await snapshots.AddAsync(
            new CalculationSnapshot
            {
                Id = "s1",
                UserId = actor.Id,
                PeriodStartDate = "2026-07-01",
                PeriodEndDateExclusive = "2026-08-01",
                DaysInPeriod = 31,
                ColdWaterUsed = 1m,
                HotWaterUsed = 1m,
                ApartmentElectricityUsed = 1m,
                BoilerElectricityUsed = 1m,
                ColdWaterTotal = 1m,
                HotWaterTotal = 1m,
                ApartmentElectricityTotal = 1m,
                BoilerElectricityTotal = 1m,
                WaterTotal = 2m,
                ElectricityTotal = 2m,
                PeriodTotal = 4m,
                ContainsEstimatedSegments = false,
                EngineVersion = "calc-engine-v1",
                InputHash = "hash",
                EquationSummary = "eq",
                CreatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var calc = new CalculationSnapshotService(
            users,
            new InMemoryReadingSubmissionRepository(),
            new InMemoryTariffVersionRepository(),
            new InMemoryUtilitySetupRepository(),
            snapshots,
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<CalculationSnapshotService>.Instance);

        var paymentService = new PaymentService(
            users,
            snapshots,
            new InMemoryPaymentRepository(),
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<PaymentService>.Instance);

        var controller = new BillingController(auth, billing, calc, paymentService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = NewHttpContext("/api/v1/billing/calculations/latest/payment", withSessionCookie: true),
            },
        };

        var action = await controller.GetLatestPeriodPaymentSummary(CancellationToken.None);
        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var body = Assert.IsType<LatestPeriodPaymentSummaryResponse>(ok.Value);

        Assert.Equal("u1", body.UserId);
        Assert.Equal("2026-07-01", body.PeriodStartDate);
        Assert.False(body.HasPayment);
        Assert.Equal("4.00", body.PeriodTotal);
    }

    [Fact]
    public async Task DeleteLatestReading_Returns409_WhenLatestPeriodHasPayment()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u1", "resident@example.com", UserRole.Resident, UserAccountStatus.Active);
        users.Seed(actor);

        var sessions = SessionFor(actor);
        var auth = AuthServiceTestFactory.Create(users, sessions);

        var readings = new InMemoryReadingSubmissionRepository();
        await readings.AddAsync(
            new ReadingSubmission
            {
                Id = "r1",
                UserId = actor.Id,
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
            new ReadingSubmission
            {
                Id = "r2",
                UserId = actor.Id,
                ReadingDate = "2026-08-01",
                ColdWaterReading = 12m,
                HotWaterReading = 12m,
                ElectricityReading = 12m,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            },
            CancellationToken.None);

        var payments = new InMemoryPaymentRepository();
        await payments.AddAsync(
            new PaymentRecord
            {
                Id = "p1",
                UserId = actor.Id,
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

        var billing = new BillingInputService(
            users,
            readings,
            new InMemoryTariffVersionRepository(),
            payments,
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<BillingInputService>.Instance);

        var calc = new CalculationSnapshotService(
            users,
            readings,
            new InMemoryTariffVersionRepository(),
            new InMemoryUtilitySetupRepository(),
            new InMemoryCalculationSnapshotRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<CalculationSnapshotService>.Instance);

        var paymentService = new PaymentService(
            users,
            new InMemoryCalculationSnapshotRepository(),
            payments,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<PaymentService>.Instance);

        var controller = new BillingController(auth, billing, calc, paymentService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = NewHttpContext("/api/v1/billing/readings/latest", withSessionCookie: true),
            },
        };

        var action = await controller.DeleteLatestReading(CancellationToken.None);
        var conflict = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(conflict.Value);

        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);
        Assert.Equal("BILLING_READING_DELETE_CONFLICT", problem.Extensions["errorCode"]?.ToString());
    }

    private static BillingController CreateController(bool withSessionCookie, bool seedUser)
    {
        var users = new InMemoryUserRepository();
        UserAccount? actor = null;

        if (seedUser)
        {
            actor = CreateUser("u1", "resident@example.com", UserRole.Resident, UserAccountStatus.Active);
            users.Seed(actor);
        }

        var sessions = actor is null
            ? new PassThroughSessionRepository()
            : SessionFor(actor);

        var auth = AuthServiceTestFactory.Create(users, sessions);

        var billing = new BillingInputService(
            users,
            new InMemoryReadingSubmissionRepository(),
            new InMemoryTariffVersionRepository(),
            new InMemoryPaymentRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<BillingInputService>.Instance);

        var calc = new CalculationSnapshotService(
            users,
            new InMemoryReadingSubmissionRepository(),
            new InMemoryTariffVersionRepository(),
            new InMemoryUtilitySetupRepository(),
            new InMemoryCalculationSnapshotRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<CalculationSnapshotService>.Instance);

        var paymentService = new PaymentService(
            users,
            new InMemoryCalculationSnapshotRepository(),
            new InMemoryPaymentRepository(),
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<PaymentService>.Instance);

        return new BillingController(auth, billing, calc, paymentService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = NewHttpContext("/api/v1/billing/calculations/latest", withSessionCookie),
            },
        };
    }

    private static PassThroughSessionRepository SessionFor(UserAccount actor)
    {
        return new PassThroughSessionRepository
        {
            SessionToReturn = new AuthSession
            {
                Id = "s1",
                TokenHash = "irrelevant",
                EmailNormalized = actor.EmailNormalized,
                UserId = actor.Id,
                DeviceSummary = "test",
                CreatedAtUtc = DateTimeOffset.UtcNow,
                LastUsedAtUtc = DateTimeOffset.UtcNow,
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(30),
                Version = 1,
            },
        };
    }

    private static DefaultHttpContext NewHttpContext(string path, bool withSessionCookie)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = path;
        if (withSessionCookie)
        {
            context.Request.Headers.Cookie = "bau.sid=test-token";
        }

        return context;
    }

    private static UserAccount CreateUser(string id, string email, UserRole role, UserAccountStatus status)
    {
        return new UserAccount
        {
            Id = id,
            EmailDisplay = email,
            EmailNormalized = email.ToUpperInvariant(),
            Role = role,
            Status = status,
            CreatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            UpdatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            Version = 1,
        };
    }
}
