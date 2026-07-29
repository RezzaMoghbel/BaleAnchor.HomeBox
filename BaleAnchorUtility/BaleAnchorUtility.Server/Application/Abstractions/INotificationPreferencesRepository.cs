using BaleAnchorUtility.Server.Domain.Notifications;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface INotificationPreferencesRepository
{
    Task<NotificationPreferences?> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task UpsertAsync(NotificationPreferences preferences, CancellationToken cancellationToken);
}
