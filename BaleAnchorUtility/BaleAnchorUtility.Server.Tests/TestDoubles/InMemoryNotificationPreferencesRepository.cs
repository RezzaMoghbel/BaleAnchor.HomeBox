using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Notifications;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryNotificationPreferencesRepository : INotificationPreferencesRepository
{
    private readonly Dictionary<string, NotificationPreferences> records = new(StringComparer.Ordinal);

    public Task<NotificationPreferences?> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        records.TryGetValue(userId, out var value);
        return Task.FromResult(value);
    }

    public Task UpsertAsync(NotificationPreferences preferences, CancellationToken cancellationToken)
    {
        records[preferences.UserId] = preferences;
        return Task.CompletedTask;
    }
}
