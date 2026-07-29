using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Notifications;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonNotificationPreferencesRepository : INotificationPreferencesRepository
{
    private const string Collection = "NotificationPreferences";
    private readonly JsonCollectionStore store;

    public JsonNotificationPreferencesRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<NotificationPreferences?> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<NotificationPreferences>(Collection, cancellationToken);
        return all.FirstOrDefault(x => string.Equals(x.UserId, userId, StringComparison.Ordinal));
    }

    public Task UpsertAsync(NotificationPreferences preferences, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, preferences.Id, preferences, cancellationToken);
    }
}
