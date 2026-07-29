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
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Tests;

public sealed class RemindersControllerTests
{
    [Fact]
    public async Task GetPreferences_ReturnsUnauthorized_WhenSessionMissing()
    {
        var users = new InMemoryUserRepository();
        var auth = AuthServiceTestFactory.Create(users, new PassThroughSessionRepository());

        var controller = CreateController(auth, users, withSessionCookie: false);

        var action = await controller.GetPreferences(CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(action.Result);
    }

    [Fact]
    public async Task UpdatePreferences_ReturnsUpdatedPayload_WhenAuthenticated()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u1", "resident@example.com");
        users.Seed(actor);

        var auth = AuthServiceTestFactory.Create(users, SessionFor(actor));
        var controller = CreateController(auth, users, withSessionCookie: true);

        var action = await controller.UpdatePreferences(
            new UpdateNotificationPreferencesRequest
            {
                EmailRemindersEnabled = true,
                PushRemindersEnabled = true,
                ReadingReminderEnabled = true,
                TimeZoneId = "UTC",
            },
            CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(action.Result);
        var body = Assert.IsType<NotificationPreferencesResponse>(ok.Value);

        Assert.Equal("u1", body.UserId);
        Assert.True(body.PushRemindersEnabled);
        Assert.Equal("UTC", body.TimeZoneId);
    }

    private static RemindersController CreateController(
        AuthService auth,
        InMemoryUserRepository users,
        bool withSessionCookie)
    {
        var preferences = new NotificationPreferencesService(
            users,
            new InMemoryNotificationPreferencesRepository(),
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow });

        var reminders = new ReminderDispatchService(
            users,
            new InMemoryNotificationPreferencesRepository(),
            new InMemoryPushSubscriptionRepository(),
            new InMemoryReminderDispatchJobRepository(),
            new NoOpEmailSender(),
            new NoOpWebPushSender(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            Options.Create(new PushNotificationOptions()),
            NullLogger<ReminderDispatchService>.Instance);

        return new RemindersController(auth, preferences, reminders)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = NewHttpContext(withSessionCookie),
            },
        };
    }

    private static DefaultHttpContext NewHttpContext(bool withSessionCookie)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/v1/reminders/preferences";
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
