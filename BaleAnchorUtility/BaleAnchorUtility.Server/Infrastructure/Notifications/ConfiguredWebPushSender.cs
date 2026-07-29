using System.Text.Json;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Configuration;
using Microsoft.Extensions.Options;
using WebPush;

namespace BaleAnchorUtility.Server.Infrastructure.Notifications;

public sealed class ConfiguredWebPushSender : IWebPushSender
{
    private readonly PushNotificationOptions options;
    private readonly ILogger<ConfiguredWebPushSender> logger;

    public ConfiguredWebPushSender(IOptions<PushNotificationOptions> options, ILogger<ConfiguredWebPushSender> logger)
    {
        this.options = options.Value;
        this.logger = logger;
    }

    public async Task SendReadingReminderAsync(
        BaleAnchorUtility.Server.Domain.Notifications.PushSubscription subscription,
        string title,
        string body,
        string deepLink,
        CancellationToken cancellationToken)
    {
        var mode = (options.Mode ?? string.Empty).Trim();
        if (!string.Equals(mode, "webpush", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogInformation(
                "Push reminder skipped (log mode) for endpoint hash {EndpointHash}. Title={Title}",
                ComputeStableHash(subscription.Endpoint),
                title);
            return;
        }

        var vapid = new VapidDetails(options.VapidSubject, options.VapidPublicKey, options.VapidPrivateKey);
        var payload = JsonSerializer.Serialize(new
        {
            title,
            body,
            url = deepLink,
            tag = "reading-reminder",
        });

        var webPushSubscription = new WebPush.PushSubscription(
            subscription.Endpoint,
            subscription.P256dh,
            subscription.Auth);

        var client = new WebPushClient();

        await client.SendNotificationAsync(
            webPushSubscription,
            payload,
            vapid,
            cancellationToken: cancellationToken);
    }

    private static string ComputeStableHash(string value)
    {
        var hash = value.GetHashCode(StringComparison.Ordinal);
        return hash.ToString("X8");
    }
}
