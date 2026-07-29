using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Notifications;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryPushSubscriptionRepository : IPushSubscriptionRepository
{
    private readonly Dictionary<string, PushSubscription> records = new(StringComparer.Ordinal);

    public Task<IReadOnlyList<PushSubscription>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        IReadOnlyList<PushSubscription> values = records.Values
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .ToList();

        return Task.FromResult(values);
    }

    public async Task<IReadOnlyList<PushSubscription>> GetActiveByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await GetByUserIdAsync(userId, cancellationToken);
        return all.Where(x => x.IsActive).ToList();
    }

    public Task AddAsync(PushSubscription subscription, CancellationToken cancellationToken)
    {
        records[subscription.Id] = subscription;
        return Task.CompletedTask;
    }

    public Task<PushSubscription?> GetByIdAsync(string subscriptionId, CancellationToken cancellationToken)
    {
        records.TryGetValue(subscriptionId, out var value);
        return Task.FromResult(value);
    }

    public Task UpsertAsync(PushSubscription subscription, CancellationToken cancellationToken)
    {
        records[subscription.Id] = subscription;
        return Task.CompletedTask;
    }
}
