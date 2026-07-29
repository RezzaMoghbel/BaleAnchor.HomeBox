using BaleAnchorUtility.Server.Domain.Notifications;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IReminderDispatchJobRepository
{
    Task<IReadOnlyList<ReminderDispatchJob>> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ReminderDispatchJob>> GetDueAsync(DateTimeOffset utcNow, int limit, CancellationToken cancellationToken);
    Task<ReminderDispatchJob?> GetByDeduplicationKeyAsync(string deduplicationKey, CancellationToken cancellationToken);
    Task UpsertAsync(ReminderDispatchJob job, CancellationToken cancellationToken);
}
