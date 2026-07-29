using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Notifications;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonPushSubscriptionRepository : IPushSubscriptionRepository
{
    private const string Collection = "PushSubscriptions";
    private readonly JsonCollectionStore store;

    public JsonPushSubscriptionRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<IReadOnlyList<PushSubscription>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<PushSubscription>(Collection, cancellationToken);
        return all
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderByDescending(x => x.UpdatedAtUtc)
            .ToList();
    }

    public async Task<IReadOnlyList<PushSubscription>> GetActiveByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await GetByUserIdAsync(userId, cancellationToken);
        return all.Where(x => x.IsActive).ToList();
    }

    public Task AddAsync(PushSubscription subscription, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, subscription.Id, subscription, cancellationToken);
    }

    public async Task<PushSubscription?> GetByIdAsync(string subscriptionId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<PushSubscription>(Collection, cancellationToken);
        return all.FirstOrDefault(x => string.Equals(x.Id, subscriptionId, StringComparison.Ordinal));
    }

    public Task UpsertAsync(PushSubscription subscription, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, subscription.Id, subscription, cancellationToken);
    }
}
