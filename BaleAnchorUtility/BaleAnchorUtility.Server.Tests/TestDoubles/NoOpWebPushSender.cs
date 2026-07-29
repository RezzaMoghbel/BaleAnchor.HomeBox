using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Notifications;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class NoOpWebPushSender : IWebPushSender
{
    public List<string> SentEndpoints { get; } = [];

    public Task SendReadingReminderAsync(
        PushSubscription subscription,
        string title,
        string body,
        string deepLink,
        CancellationToken cancellationToken)
    {
        SentEndpoints.Add(subscription.Endpoint);
        return Task.CompletedTask;
    }
}
