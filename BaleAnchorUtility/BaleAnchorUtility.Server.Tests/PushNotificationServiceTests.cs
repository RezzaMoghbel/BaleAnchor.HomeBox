using BaleAnchorUtility.Server.Application.Notifications;
using BaleAnchorUtility.Server.Application.Notifications.Dtos;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Domain.Notifications;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Tests;

public sealed class PushNotificationServiceTests
{
    [Fact]
    public async Task UpsertAndDeleteSubscription_WritesAuditEntries()
    {
        var users = new InMemoryUserRepository();
        users.Seed(new UserAccount
        {
            Id = "u-push-audit",
            EmailDisplay = "resident.push.audit@example.com",
            EmailNormalized = "resident.push.audit@example.com",
            Status = UserAccountStatus.Active,
            Role = UserRole.Resident,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        });

        var subscriptions = new InMemoryPushSubscriptionRepository();
        var audit = new InMemoryAuditLogRepository();

        var service = new PushNotificationService(
            users,
            subscriptions,
            new NoOpWebPushSender(),
            audit,
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-08-01T00:00:00Z") },
            Options.Create(new PushNotificationOptions()));

        var created = await service.UpsertSubscriptionAsync(
            "u-push-audit",
            new UpsertPushSubscriptionRequest
            {
                Endpoint = "https://push.example/subscriptions/1",
                P256dh = "p256dh-key",
                Auth = "auth-key",
            },
            CancellationToken.None);

        await service.DeleteSubscriptionAsync("u-push-audit", created.SubscriptionId, CancellationToken.None);

        Assert.Contains(audit.Entries, x => x.Action == "CREATE_PUSH_SUBSCRIPTION");
        Assert.Contains(audit.Entries, x => x.Action == "DELETE_PUSH_SUBSCRIPTION");
    }
}
