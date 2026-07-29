using BaleAnchorUtility.Server.Application.Admin;
using BaleAnchorUtility.Server.Application.Admin.Dtos;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Controllers;
using BaleAnchorUtility.Server.Domain.Admin;
using BaleAnchorUtility.Server.Domain.Auth;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Tests;

public sealed class AdminCmsControllerTests
{
    [Fact]
    public async Task GetFlats_Returns403_WhenUnauthenticated()
    {
        var users = new InMemoryUserRepository();
        var auth = AuthServiceTestFactory.Create(users, new PassThroughSessionRepository());
        var controller = CreateController(auth, users, new InMemoryFlatRepository(), new InMemoryTenancyRepository(), new InMemoryTenantGapRepository());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/cms/flats"),
        };

        var action = await controller.GetFlats(CancellationToken.None);
        var forbidden = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(forbidden.Value);

        Assert.Equal(StatusCodes.Status403Forbidden, forbidden.StatusCode);
        Assert.Equal("ADMIN_ACCESS_DENIED", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task GetFlats_Returns403_WhenAuthenticatedUserIsNotAdmin()
    {
        var users = new InMemoryUserRepository();
        var resident = CreateUser("u-resident", "resident@example.com", UserRole.Resident, UserAccountStatus.Active);
        users.Seed(resident);

        var sessions = SessionFor(resident);
        var auth = AuthServiceTestFactory.Create(users, sessions);
        var controller = CreateController(auth, users, new InMemoryFlatRepository(), new InMemoryTenancyRepository(), new InMemoryTenantGapRepository());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/cms/flats", withSessionCookie: true),
        };

        var action = await controller.GetFlats(CancellationToken.None);
        var forbidden = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(forbidden.Value);

        Assert.Equal(StatusCodes.Status403Forbidden, forbidden.StatusCode);
        Assert.Equal("ADMIN_ACCESS_DENIED", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task UpsertFlat_Returns400ValidationProblem_ForShortReason()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u-admin", "admin@example.com", UserRole.Admin, UserAccountStatus.Active);
        users.Seed(actor);

        var sessions = SessionFor(actor);
        var auth = AuthServiceTestFactory.Create(users, sessions);
        var controller = CreateController(auth, users, new InMemoryFlatRepository(), new InMemoryTenancyRepository(), new InMemoryTenantGapRepository());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/cms/flats", withSessionCookie: true),
        };

        var action = await controller.UpsertFlat(
            new UpsertFlatRequest
            {
                FlatNumber = "A12",
                Label = "A-12",
                IsActive = true,
                Reason = "x",
            },
            CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(action.Result);
        var problem = Assert.IsType<ValidationProblemDetails>(badRequest.Value);

        Assert.Equal(StatusCodes.Status400BadRequest, badRequest.StatusCode);
        Assert.Equal("ADMIN_CMS_VALIDATION", problem.Extensions["errorCode"]?.ToString());
        Assert.True(problem.Errors.ContainsKey("Reason"));
    }

    [Fact]
    public async Task UpsertTenancy_Returns404Problem_WhenTargetUserMissing()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u-admin", "admin@example.com", UserRole.Admin, UserAccountStatus.Active);
        users.Seed(actor);

        var sessions = SessionFor(actor);
        var auth = AuthServiceTestFactory.Create(users, sessions);
        var flats = new InMemoryFlatRepository();
        await flats.UpsertAsync(new FlatRecord
        {
            Id = "flat-1",
            FlatNumberNormalized = "A12",
            Label = "A-12",
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var controller = CreateController(auth, users, flats, new InMemoryTenancyRepository(), new InMemoryTenantGapRepository());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/cms/tenancies", withSessionCookie: true),
        };

        var action = await controller.UpsertTenancy(
            new UpsertTenancyRequest
            {
                UserId = "u-missing",
                FlatNumber = "A12",
                MoveInDate = "2026-07-01",
                Reason = "Correction",
            },
            CancellationToken.None);

        var notFound = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);

        Assert.Equal(StatusCodes.Status404NotFound, notFound.StatusCode);
        Assert.Equal("ADMIN_CMS_USER_NOT_FOUND", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task UpsertTenantGap_Returns409Problem_WhenDateRangeInvalid()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u-admin", "admin@example.com", UserRole.Admin, UserAccountStatus.Active);
        var target = CreateUser("u-target", "target@example.com", UserRole.Resident, UserAccountStatus.Active);
        users.Seed(actor, target);

        var sessions = SessionFor(actor);
        var auth = AuthServiceTestFactory.Create(users, sessions);
        var controller = CreateController(auth, users, new InMemoryFlatRepository(), new InMemoryTenancyRepository(), new InMemoryTenantGapRepository());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/cms/tenant-gaps", withSessionCookie: true),
        };

        var action = await controller.UpsertTenantGap(
            new UpsertTenantGapAllocationRequest
            {
                FlatNumber = "A12",
                FromDate = "2026-08-01",
                ToDateExclusive = "2026-08-01",
                AssignedUserId = target.Id,
                Amount = "10.00",
                Reason = "Adjust gap",
                Status = "Open",
            },
            CancellationToken.None);

        var conflict = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(conflict.Value);

        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);
        Assert.Equal("ADMIN_CMS_CONFLICT", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task GetTenantGaps_ReturnsData_WhenAuthorized()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u-admin", "admin@example.com", UserRole.Admin, UserAccountStatus.Active);
        users.Seed(actor);

        var sessions = SessionFor(actor);
        var auth = AuthServiceTestFactory.Create(users, sessions);

        var gaps = new InMemoryTenantGapRepository();
        gaps.Seed(new TenantGapAllocation
        {
            Id = "gap-1",
            FlatNumberNormalized = "A12",
            FromDate = "2026-08-01",
            ToDateExclusive = "2026-08-16",
            AssignedUserId = "u-target",
            Amount = 25.5m,
            Reason = "Shared vacancy",
            Status = "Open",
            CreatedAtUtc = DateTimeOffset.Parse("2026-08-01T00:00:00Z"),
            UpdatedAtUtc = DateTimeOffset.Parse("2026-08-01T00:00:00Z"),
            Version = 1,
        });

        var controller = CreateController(auth, users, new InMemoryFlatRepository(), new InMemoryTenancyRepository(), gaps);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/cms/tenant-gaps", withSessionCookie: true),
        };

        var action = await controller.GetTenantGaps("A12", CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var body = Assert.IsType<TenantGapAllocationListResponse>(ok.Value);
        Assert.Equal(1, body.Count);
        Assert.Equal("A12", body.Items[0].FlatNumber);
    }

    private static AdminCmsController CreateController(
        Application.Auth.AuthService auth,
        InMemoryUserRepository users,
        InMemoryFlatRepository flats,
        InMemoryTenancyRepository tenancies,
        InMemoryTenantGapRepository gaps)
    {
        var service = new AdminCmsService(
            users,
            flats,
            tenancies,
            gaps,
            new InMemoryReadingSubmissionRepository(),
            new InMemoryTariffVersionRepository(),
            new InMemoryPaymentRepository(),
            new InMemoryUtilitySetupRepository(),
            new InMemoryTermsVersionRepository(),
            new InMemoryTermsAcceptanceRepository(),
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-29T00:00:00Z") });

        return new AdminCmsController(
            auth,
            users,
            service,
            Options.Create(new AdminAccessOptions()));
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

    private static DefaultHttpContext NewHttpContext(string path, bool withSessionCookie = false)
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
