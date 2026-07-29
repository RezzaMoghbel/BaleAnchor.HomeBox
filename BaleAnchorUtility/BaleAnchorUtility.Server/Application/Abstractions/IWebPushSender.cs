using BaleAnchorUtility.Server.Domain.Notifications;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IWebPushSender
{
    Task SendReadingReminderAsync(PushSubscription subscription, string title, string body, string deepLink, CancellationToken cancellationToken);
}
