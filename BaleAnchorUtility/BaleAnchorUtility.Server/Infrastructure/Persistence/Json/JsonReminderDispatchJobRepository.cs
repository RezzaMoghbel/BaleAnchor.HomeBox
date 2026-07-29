using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Notifications;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonReminderDispatchJobRepository : IReminderDispatchJobRepository
{
    private const string Collection = "ReminderDispatchJobs";
    private readonly JsonCollectionStore store;

    public JsonReminderDispatchJobRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<IReadOnlyList<ReminderDispatchJob>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<ReminderDispatchJob>(Collection, cancellationToken);
        return all
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderByDescending(x => x.ScheduledForUtc)
            .ToList();
    }

    public async Task<IReadOnlyList<ReminderDispatchJob>> GetDueAsync(DateTimeOffset utcNow, int limit, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<ReminderDispatchJob>(Collection, cancellationToken);
        return all
            .Where(x =>
                (string.Equals(x.Status, ReminderStatuses.Pending, StringComparison.Ordinal)
                 || string.Equals(x.Status, ReminderStatuses.Retrying, StringComparison.Ordinal))
                && (x.NextAttemptAtUtc ?? x.ScheduledForUtc) <= utcNow)
            .OrderBy(x => x.NextAttemptAtUtc ?? x.ScheduledForUtc)
            .ThenBy(x => x.CreatedAtUtc)
            .Take(Math.Max(1, limit))
            .ToList();
    }

    public async Task<ReminderDispatchJob?> GetByDeduplicationKeyAsync(string deduplicationKey, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<ReminderDispatchJob>(Collection, cancellationToken);
        return all.FirstOrDefault(x => string.Equals(x.DeduplicationKey, deduplicationKey, StringComparison.Ordinal));
    }

    public Task UpsertAsync(ReminderDispatchJob job, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, job.Id, job, cancellationToken);
    }

    private static class ReminderStatuses
    {
        public const string Pending = "Pending";
        public const string Retrying = "Retrying";
    }
}
