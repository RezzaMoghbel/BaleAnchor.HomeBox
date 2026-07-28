using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Billing;
using BaleAnchorUtility.Server.Controllers;
using BaleAnchorUtility.Server.Domain.Auth;
using BaleAnchorUtility.Server.Domain.Calculations;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BaleAnchorUtility.Server.Tests;

public sealed class StatementsControllerTests
{
    [Fact]
    public async Task GetLatestSummary_Returns401_WhenUnauthenticated()
    {
        var controller = CreateController(withSessionCookie: false, seedUser: false, includeSnapshot: false);

        var action = await controller.GetLatestSummary(CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(action.Result);
    }

    [Fact]
    public async Task GetLatestSummary_Returns409_WhenSnapshotMissing()
    {
        var controller = CreateController(withSessionCookie: true, seedUser: true, includeSnapshot: false);

        var action = await controller.GetLatestSummary(CancellationToken.None);

        var conflict = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(conflict.Value);

        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);
        Assert.Equal("BILLING_STATEMENT_CONFLICT", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task GetLatestSummary_Returns200_WhenSnapshotExists()
    {
        var controller = CreateController(withSessionCookie: true, seedUser: true, includeSnapshot: true);

        var action = await controller.GetLatestSummary(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var response = Assert.IsType<Application.Billing.Dtos.LatestStatementSummaryResponse>(ok.Value);

        Assert.Equal("u1", response.UserId);
        Assert.Equal("2026-07-01", response.PeriodStartDate);
        Assert.Equal("40.00", response.PeriodTotal);
    }

    [Fact]
    public async Task GetSelectedSummary_Returns400_WhenSelectionIsInvalid()
    {
        var controller = CreateController(withSessionCookie: true, seedUser: true, includeSnapshot: true);

        var action = await controller.GetSelectedSummary(
            snapshotId: "s1",
            periodStartDate: "2026-07-01",
            periodEndDateExclusive: "2026-08-01",
            CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(action.Result);
        var problem = Assert.IsType<ValidationProblemDetails>(badRequest.Value);

        Assert.Equal(StatusCodes.Status400BadRequest, badRequest.StatusCode);
        Assert.Equal("BILLING_STATEMENT_VALIDATION", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task GetSelectedSummary_Returns404_WhenSelectionNotFound()
    {
        var controller = CreateController(withSessionCookie: true, seedUser: true, includeSnapshot: true);

        var action = await controller.GetSelectedSummary(
            snapshotId: "missing",
            periodStartDate: null,
            periodEndDateExclusive: null,
            CancellationToken.None);

        var notFound = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);

        Assert.Equal(StatusCodes.Status404NotFound, notFound.StatusCode);
        Assert.Equal("BILLING_STATEMENT_NOT_FOUND", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task GetSelectedSummary_Returns200_WhenPeriodMatches()
    {
        var controller = CreateController(withSessionCookie: true, seedUser: true, includeSnapshot: true);

        var action = await controller.GetSelectedSummary(
            snapshotId: null,
            periodStartDate: "2026-07-01",
            periodEndDateExclusive: "2026-08-01",
            CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var response = Assert.IsType<Application.Billing.Dtos.LatestStatementSummaryResponse>(ok.Value);

        Assert.Equal("u1", response.UserId);
        Assert.Equal("2026-07-01", response.PeriodStartDate);
        Assert.Equal("2026-08-01", response.PeriodEndDateExclusive);
    }

    [Fact]
    public async Task GetStatementPeriods_Returns401_WhenUnauthenticated()
    {
        var controller = CreateController(withSessionCookie: false, seedUser: false, includeSnapshot: false);

        var action = await controller.GetStatementPeriods(CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(action.Result);
    }

    [Fact]
    public async Task GetStatementPeriods_Returns200_WhenSnapshotsExist()
    {
        var controller = CreateController(withSessionCookie: true, seedUser: true, includeSnapshot: true);

        var action = await controller.GetStatementPeriods(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var response = Assert.IsType<Application.Billing.Dtos.StatementPeriodListResponse>(ok.Value);

        Assert.Equal("u1", response.UserId);
        Assert.Equal(1, response.Count);
        Assert.Equal("s1", response.Items[0].SnapshotId);
    }

    private static StatementsController CreateController(bool withSessionCookie, bool seedUser, bool includeSnapshot)
    {
        var users = new InMemoryUserRepository();
        UserAccount? actor = null;

        if (seedUser)
        {
            actor = new UserAccount
            {
                Id = "u1",
                EmailDisplay = "resident@example.com",
                EmailNormalized = "RESIDENT@EXAMPLE.COM",
                Role = UserRole.Resident,
                Status = UserAccountStatus.Active,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                Version = 1,
            };

            users.Seed(actor);
        }

        var sessions = actor is null
            ? new PassThroughSessionRepository()
            : new PassThroughSessionRepository
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

        var auth = AuthServiceTestFactory.Create(users, sessions);

        var snapshots = new InMemoryCalculationSnapshotRepository();
        if (includeSnapshot && actor is not null)
        {
            snapshots.AddAsync(
                new CalculationSnapshot
                {
                    Id = "s1",
                    UserId = actor.Id,
                    PeriodStartDate = "2026-07-01",
                    PeriodEndDateExclusive = "2026-08-01",
                    DaysInPeriod = 31,
                    ColdWaterUsed = 0m,
                    HotWaterUsed = 0m,
                    ApartmentElectricityUsed = 0m,
                    BoilerElectricityUsed = 0m,
                    ColdWaterTotal = 0m,
                    HotWaterTotal = 0m,
                    ApartmentElectricityTotal = 0m,
                    BoilerElectricityTotal = 0m,
                    WaterTotal = 20m,
                    ElectricityTotal = 20m,
                    PeriodTotal = 40m,
                    ContainsEstimatedSegments = false,
                    EngineVersion = "calc-engine-v1",
                    InputHash = "hash",
                    EquationSummary = "eq",
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                    Version = 1,
                },
                CancellationToken.None).GetAwaiter().GetResult();
        }

        var summaryService = new StatementSummaryService(users, snapshots, new InMemoryPaymentRepository());
        var controller = new StatementsController(auth, summaryService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = NewHttpContext("/api/v1/billing/statements/latest-summary", withSessionCookie),
            },
        };

        return controller;
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
}
