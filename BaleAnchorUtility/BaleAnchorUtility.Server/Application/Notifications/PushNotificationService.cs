using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Notifications.Dtos;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Domain.Audit;
using BaleAnchorUtility.Server.Domain.Notifications;
using BaleAnchorUtility.Server.Domain.Users;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;

namespace BaleAnchorUtility.Server.Application.Notifications;

public sealed class PushNotificationService
{
    private readonly IUserRepository userRepository;
    private readonly IPushSubscriptionRepository pushSubscriptionRepository;
    private readonly IWebPushSender webPushSender;
    private readonly IAuditLogRepository auditLogRepository;
    private readonly ISystemClock clock;
    private readonly PushNotificationOptions options;

    public PushNotificationService(
        IUserRepository userRepository,
        IPushSubscriptionRepository pushSubscriptionRepository,
        IWebPushSender webPushSender,
        IAuditLogRepository auditLogRepository,
        ISystemClock clock,
        IOptions<PushNotificationOptions> options)
    {
        this.userRepository = userRepository;
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.webPushSender = webPushSender;
        this.auditLogRepository = auditLogRepository;
        this.clock = clock;
        this.options = options.Value;
    }

    public PushPublicConfigResponse GetPublicConfig()
    {
        var mode = (options.Mode ?? string.Empty).Trim();
        var enabled = string.Equals(mode, "webpush", StringComparison.OrdinalIgnoreCase);

        return new PushPublicConfigResponse
        {
            PushEnabled = enabled,
            VapidPublicKey = enabled ? options.VapidPublicKey : null,
            DeepLinkPath = options.ReadingReminderDeepLinkPath,
        };
    }

    public async Task<PushSubscriptionListResponse> GetSubscriptionsAsync(string userId, CancellationToken cancellationToken)
    {
        _ = await GetActiveUserAsync(userId, cancellationToken);

        var subscriptions = await pushSubscriptionRepository.GetByUserIdAsync(userId, cancellationToken);
        var items = subscriptions
            .Select(ToResponse)
            .ToList();

        return new PushSubscriptionListResponse
        {
            UserId = userId,
            Count = items.Count,
            Items = items,
        };
    }

    public async Task<PushSubscriptionResponse> UpsertSubscriptionAsync(
        string userId,
        UpsertPushSubscriptionRequest request,
        CancellationToken cancellationToken)
    {
        _ = await GetActiveUserAsync(userId, cancellationToken);

        var now = clock.UtcNow;
        var existingForEndpoint = (await pushSubscriptionRepository.GetByUserIdAsync(userId, cancellationToken))
            .FirstOrDefault(x => string.Equals(x.Endpoint, request.Endpoint, StringComparison.Ordinal));

        var subscription = existingForEndpoint ?? new PushSubscription
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            Endpoint = request.Endpoint,
            P256dh = request.P256dh,
            Auth = request.Auth,
            UserAgent = request.ClientUserAgent,
            IsActive = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        };

        subscription.Endpoint = request.Endpoint;
        subscription.P256dh = request.P256dh;
        subscription.Auth = request.Auth;
        subscription.UserAgent = request.ClientUserAgent;
        subscription.IsActive = true;
        subscription.UpdatedAtUtc = now;
        subscription.Version = existingForEndpoint is null ? 1 : subscription.Version + 1;

        await pushSubscriptionRepository.UpsertAsync(subscription, cancellationToken);
        await auditLogRepository.AddAsync(
            new AuditLogEntry
            {
                Id = Guid.NewGuid().ToString("N"),
                ActorUserId = userId,
                TargetUserId = userId,
                Category = "NOTIFICATIONS",
                Action = existingForEndpoint is null ? "CREATE_PUSH_SUBSCRIPTION" : "UPDATE_PUSH_SUBSCRIPTION",
                Reason = "Resident push subscription update",
                Metadata = $"subscriptionId:{subscription.Id};endpointHash:{ComputeStableHash(subscription.Endpoint)};isActive:{subscription.IsActive}",
                CreatedAtUtc = now,
                Version = 1,
            },
            cancellationToken);

        return ToResponse(subscription);
    }

    public async Task DeleteSubscriptionAsync(string userId, string subscriptionId, CancellationToken cancellationToken)
    {
        _ = await GetActiveUserAsync(userId, cancellationToken);

        if (string.IsNullOrWhiteSpace(subscriptionId))
        {
            throw new InvalidOperationException("Subscription ID is required.");
        }

        var subscription = await pushSubscriptionRepository.GetByIdAsync(subscriptionId, cancellationToken)
            ?? throw new KeyNotFoundException("Push subscription was not found.");

        if (!string.Equals(subscription.UserId, userId, StringComparison.Ordinal))
        {
            throw new KeyNotFoundException("Push subscription was not found.");
        }

        subscription.IsActive = false;
        subscription.UpdatedAtUtc = clock.UtcNow;
        subscription.Version += 1;

        await pushSubscriptionRepository.UpsertAsync(subscription, cancellationToken);
        await auditLogRepository.AddAsync(
            new AuditLogEntry
            {
                Id = Guid.NewGuid().ToString("N"),
                ActorUserId = userId,
                TargetUserId = userId,
                Category = "NOTIFICATIONS",
                Action = "DELETE_PUSH_SUBSCRIPTION",
                Reason = "Resident push subscription removal",
                Metadata = $"subscriptionId:{subscription.Id};endpointHash:{ComputeStableHash(subscription.Endpoint)};isActive:{subscription.IsActive}",
                CreatedAtUtc = subscription.UpdatedAtUtc,
                Version = 1,
            },
            cancellationToken);
    }

    public async Task<SendTestNotificationResponse> SendTestNotificationAsync(string userId, CancellationToken cancellationToken)
    {
        _ = await GetActiveUserAsync(userId, cancellationToken);
        var subscriptions = await pushSubscriptionRepository.GetActiveByUserIdAsync(userId, cancellationToken);

        var delivered = 0;
        foreach (var subscription in subscriptions)
        {
            await webPushSender.SendReadingReminderAsync(
                subscription,
                "BaleAnchor test notification",
                "Push notifications are enabled for your account.",
                options.ReadingReminderDeepLinkPath,
                cancellationToken);
            delivered += 1;
        }

        return new SendTestNotificationResponse
        {
            UserId = userId,
            DeliveredSubscriptions = delivered,
            Message = delivered > 0
                ? "Test notification sent to active subscriptions."
                : "No active push subscriptions found for this account.",
        };
    }

    private async Task<UserAccount> GetActiveUserAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User record was not found for this session.");

        if (user.Status != UserAccountStatus.Active)
        {
            throw new InvalidOperationException("Only active accounts can manage push subscriptions.");
        }

        return user;
    }

    private static PushSubscriptionResponse ToResponse(PushSubscription subscription)
    {
        return new PushSubscriptionResponse
        {
            SubscriptionId = subscription.Id,
            Endpoint = subscription.Endpoint,
            IsActive = subscription.IsActive,
            ExpiresAtUtc = subscription.ExpiresAtUtc?.ToString("O"),
            UpdatedAtUtc = subscription.UpdatedAtUtc.ToString("O"),
        };
    }

    private static string ComputeStableHash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes[..8]);
    }
}
