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

public sealed class AdminApprovalsControllerTests
{
    [Fact]
    public async Task Approve_Returns400ValidationProblem_ForShortReason()
    {
        var users = new InMemoryUserRepository();
        var sessions = new PassThroughSessionRepository();
        var auth = AuthServiceTestFactory.Create(users, sessions);
        var service = new AdminApprovalService(
            users,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<AdminApprovalService>.Instance);

        var controller = new AdminApprovalsController(
            auth,
            users,
            service,
            new AdminSupportAccessService(users, auth),
            Options.Create(new AdminAccessOptions()));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/approvals/u1/approve"),
        };

        var action = await controller.Approve("u1", new AdminDecisionRequest { Reason = "  " }, CancellationToken.None);
        var badRequest = Assert.IsType<BadRequestObjectResult>(action.Result);
        var problem = Assert.IsType<ValidationProblemDetails>(badRequest.Value);

        Assert.Equal(StatusCodes.Status400BadRequest, badRequest.StatusCode);
        Assert.Equal("Validation failed", problem.Title);
        Assert.True(problem.Errors.ContainsKey("reason"));
        Assert.Equal("ADMIN_DECISION_VALIDATION", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task Pending_Returns403_WhenActorIsUnauthenticated()
    {
        var users = new InMemoryUserRepository();
        var auth = AuthServiceTestFactory.Create(users, new PassThroughSessionRepository());
        var service = new AdminApprovalService(
            users,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<AdminApprovalService>.Instance);

        var controller = new AdminApprovalsController(
            auth,
            users,
            service,
            new AdminSupportAccessService(users, auth),
            Options.Create(new AdminAccessOptions()));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/approvals/pending"),
        };

        var action = await controller.Pending(CancellationToken.None);
        var forbidden = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(forbidden.Value);

        Assert.Equal(StatusCodes.Status403Forbidden, forbidden.StatusCode);
        Assert.Equal("ADMIN_ACCESS_DENIED", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task Reject_Returns409Conflict_WhenTargetIsNotPendingApproval()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("admin-1", "admin@example.com", UserRole.Admin, UserAccountStatus.Active);
        var target = CreateUser("user-1", "user@example.com", UserRole.Resident, UserAccountStatus.Active);
        users.Seed(actor, target);

        var sessions = new PassThroughSessionRepository
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
        var service = new AdminApprovalService(
            users,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<AdminApprovalService>.Instance);

        var controller = new AdminApprovalsController(
            auth,
            users,
            service,
            new AdminSupportAccessService(users, auth),
            Options.Create(new AdminAccessOptions()));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/approvals/user-1/reject", withSessionCookie: true),
        };

        var action = await controller.Reject(
            target.Id,
            new AdminDecisionRequest { Reason = "Status is invalid" },
            CancellationToken.None);

        var conflict = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(conflict.Value);

        Assert.Equal(StatusCodes.Status409Conflict, conflict.StatusCode);
        Assert.Equal("ADMIN_APPROVAL_CONFLICT", problem.Extensions["errorCode"]?.ToString());
    }

    [Fact]
    public async Task Suspend_Returns200_ForAdminActorAndActiveTarget()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("admin-1", "admin@example.com", UserRole.Admin, UserAccountStatus.Active);
        var target = CreateUser("user-1", "user@example.com", UserRole.Resident, UserAccountStatus.Active);
        users.Seed(actor, target);

        var sessions = SessionFor(actor);
        var auth = AuthServiceTestFactory.Create(users, sessions);
        var service = new AdminApprovalService(
            users,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<AdminApprovalService>.Instance);

        var controller = new AdminApprovalsController(
            auth,
            users,
            service,
            new AdminSupportAccessService(users, auth),
            Options.Create(new AdminAccessOptions()));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/approvals/user-1/suspend", withSessionCookie: true),
        };

        var action = await controller.Suspend(
            target.Id,
            new AdminDecisionRequest { Reason = "Policy violation" },
            CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var body = Assert.IsType<AdminDecisionResponse>(ok.Value);
        Assert.Equal("Suspended", body.NewStatus);
    }

    [Fact]
    public async Task StartDelegatedSupportSession_Returns403_ForAdminRole()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("admin-1", "admin@example.com", UserRole.Admin, UserAccountStatus.Active);
        var target = CreateUser("user-1", "user@example.com", UserRole.Resident, UserAccountStatus.Active);
        users.Seed(actor, target);

        var sessions = SessionFor(actor);
        var auth = AuthServiceTestFactory.Create(users, sessions);
        var service = new AdminApprovalService(
            users,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<AdminApprovalService>.Instance);

        var controller = new AdminApprovalsController(
            auth,
            users,
            service,
            new AdminSupportAccessService(users, auth),
            Options.Create(new AdminAccessOptions()));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = NewHttpContext("/api/v1/admin/approvals/support/login-on-behalf", withSessionCookie: true),
        };

        var action = await controller.StartDelegatedSupportSession(
            new StartDelegatedSupportSessionRequest
            {
                TargetUserId = target.Id,
                Reason = "Resident requested assisted access",
                ExpectedEmail = target.EmailDisplay,
            },
            CancellationToken.None);

        var forbidden = Assert.IsType<ObjectResult>(action.Result);
        var problem = Assert.IsType<ProblemDetails>(forbidden.Value);
        Assert.Equal(StatusCodes.Status403Forbidden, forbidden.StatusCode);
        Assert.Equal("ADMIN_ACCESS_DENIED", problem.Extensions["errorCode"]?.ToString());
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
