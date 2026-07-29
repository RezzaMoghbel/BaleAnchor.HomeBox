using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Notifications;
using BaleAnchorUtility.Server.Application.Notifications.Dtos;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Controllers;
using BaleAnchorUtility.Server.Domain.Auth;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Tests;

public sealed class PushControllerTests
{
    [Fact]
    public async Task GetSubscriptions_ReturnsUnauthorized_WhenSessionMissing()
    {
        var users = new InMemoryUserRepository();
        var auth = AuthServiceTestFactory.Create(users, new PassThroughSessionRepository());
        var service = new PushNotificationService(
            users,
            new InMemoryPushSubscriptionRepository(),
            new NoOpWebPushSender(),
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            Options.Create(new PushNotificationOptions()));

        var controller = new PushController(auth, service)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = NewHttpContext(withSessionCookie: false),
            },
        };

        var action = await controller.GetSubscriptions(CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(action.Result);
    }

    [Fact]
    public async Task GetPublicConfig_ReturnsConfiguredDeepLink()
    {
        var users = new InMemoryUserRepository();
        var auth = AuthServiceTestFactory.Create(users, new PassThroughSessionRepository());

        var service = new PushNotificationService(
            users,
            new InMemoryPushSubscriptionRepository(),
            new NoOpWebPushSender(),
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            Options.Create(new PushNotificationOptions
            {
                Mode = "log",
                ReadingReminderDeepLinkPath = "/dashboard/readings",
            }));

        var controller = new PushController(auth, service);

        var action = controller.GetPublicConfig();
        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var body = Assert.IsType<PushPublicConfigResponse>(ok.Value);

        Assert.Equal("/dashboard/readings", body.DeepLinkPath);
    }

    [Fact]
    public async Task UpsertSubscription_ReturnsOk_WhenAuthenticated()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u1", "resident@example.com");
        users.Seed(actor);

        var auth = AuthServiceTestFactory.Create(users, SessionFor(actor));
        var service = new PushNotificationService(
            users,
            new InMemoryPushSubscriptionRepository(),
            new NoOpWebPushSender(),
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            Options.Create(new PushNotificationOptions()));

        var controller = new PushController(auth, service)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = NewHttpContext(withSessionCookie: true),
            },
        };

        var action = await controller.UpsertSubscription(
            new Application.Notifications.Dtos.UpsertPushSubscriptionRequest
            {
                Endpoint = "https://push.example/subscriptions/1",
                P256dh = "p256dh-key",
                Auth = "auth-key",
            },
            CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var body = Assert.IsType<PushSubscriptionResponse>(ok.Value);
        Assert.False(string.IsNullOrWhiteSpace(body.SubscriptionId));
    }

    private static DefaultHttpContext NewHttpContext(bool withSessionCookie)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/v1/push/subscriptions";
        if (withSessionCookie)
        {
            context.Request.Headers.Cookie = "bau.sid=test-token";
        }

        return context;
    }

    private static UserAccount CreateUser(string id, string email)
    {
        return new UserAccount
        {
            Id = id,
            EmailDisplay = email,
            EmailNormalized = email.ToUpperInvariant(),
            Role = UserRole.Resident,
            Status = UserAccountStatus.Active,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
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
}
