using BaleAnchorUtility.Server.Application.Admin;
using BaleAnchorUtility.Server.Application.Admin.Dtos;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Controllers;
using BaleAnchorUtility.Server.Domain.Auth;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Tests;

public sealed class AdminRolesControllerTests
{
    [Fact]
    public async Task ChangeRole_Returns403_WhenUnauthenticated()
    {
        var users = new InMemoryUserRepository();
        var auth = AuthServiceTestFactory.Create(users, new PassThroughSessionRepository());
        var controller = new AdminRolesController(
            auth,
            users,
            CreateRoleService(users),
            Options.Create(new AdminAccessOptions()));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/roles/target"),
        };

        var action = await controller.ChangeRole(
            "target",
            new AdminRoleChangeRequest { Role = "Admin", Reason = "Needs access" },
            CancellationToken.None);

        Assert.IsType<ForbidResult>(action.Result);
    }

    [Fact]
    public async Task ChangeRole_Returns400ValidationProblem_ForInvalidRole()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u-super", "super@example.com", UserRole.SuperAdmin, UserAccountStatus.Active);
        var target = CreateUser("u-target", "target@example.com", UserRole.Resident, UserAccountStatus.Active);
        users.Seed(actor, target);

        var sessions = SessionFor(actor);
        var auth = AuthServiceTestFactory.Create(users, sessions);
        var controller = new AdminRolesController(
            auth,
            users,
            CreateRoleService(users),
            Options.Create(new AdminAccessOptions()));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/roles/u-target", withSessionCookie: true),
        };

        var action = await controller.ChangeRole(
            "u-target",
            new AdminRoleChangeRequest { Role = "Owner", Reason = "Invalid role" },
            CancellationToken.None);

        var badRequest = Assert.IsType<BadRequestObjectResult>(action.Result);
        var problem = Assert.IsType<ValidationProblemDetails>(badRequest.Value);

        Assert.Equal(StatusCodes.Status400BadRequest, badRequest.StatusCode);
        Assert.True(problem.Errors.ContainsKey("role"));
        Assert.Equal("ADMIN_ROLE_VALIDATION", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task ChangeRole_Returns404Problem_WhenTargetMissing()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u-super", "super@example.com", UserRole.SuperAdmin, UserAccountStatus.Active);
        users.Seed(actor);

        var sessions = SessionFor(actor);
        var auth = AuthServiceTestFactory.Create(users, sessions);
        var controller = new AdminRolesController(
            auth,
            users,
            CreateRoleService(users),
            Options.Create(new AdminAccessOptions()));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/roles/u-missing", withSessionCookie: true),
        };

        var action = await controller.ChangeRole(
            "u-missing",
            new AdminRoleChangeRequest { Role = "Admin", Reason = "Promotion request" },
            CancellationToken.None);

        var notFound = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(notFound.Value);

        Assert.Equal(StatusCodes.Status404NotFound, notFound.StatusCode);
        Assert.Equal("ADMIN_ROLE_USER_NOT_FOUND", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task ChangeRole_Returns409Problem_WhenActorIsNotSuperAdmin()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u-admin", "admin@example.com", UserRole.Admin, UserAccountStatus.Active);
        var target = CreateUser("u-target", "target@example.com", UserRole.Resident, UserAccountStatus.Active);
        users.Seed(actor, target);

        var sessions = SessionFor(actor);
        var auth = AuthServiceTestFactory.Create(users, sessions);
        var controller = new AdminRolesController(
            auth,
            users,
            CreateRoleService(users),
            Options.Create(new AdminAccessOptions()));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/roles/u-target", withSessionCookie: true),
        };

        var action = await controller.ChangeRole(
            "u-target",
            new AdminRoleChangeRequest { Role = "Admin", Reason = "Attempt role update" },
            CancellationToken.None);

        var conflict = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(conflict.Value);

        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);
        Assert.Equal("ADMIN_ROLE_CONFLICT", problem.Extensions["errorCode"]?.ToString());
    }

    private static AdminRoleService CreateRoleService(InMemoryUserRepository users)
    {
        return new AdminRoleService(
            users,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<AdminRoleService>.Instance);
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
