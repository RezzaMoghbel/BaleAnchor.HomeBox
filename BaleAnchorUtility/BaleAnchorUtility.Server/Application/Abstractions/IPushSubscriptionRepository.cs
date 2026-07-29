using BaleAnchorUtility.Server.Domain.Notifications;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IPushSubscriptionRepository
{
    Task<IReadOnlyList<PushSubscription>> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<PushSubscription>> GetActiveByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task AddAsync(PushSubscription subscription, CancellationToken cancellationToken);
    Task<PushSubscription?> GetByIdAsync(string subscriptionId, CancellationToken cancellationToken);
    Task UpsertAsync(PushSubscription subscription, CancellationToken cancellationToken);
}
