using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Notifications;
using BaleAnchorUtility.Server.Domain.Notifications;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryReminderDispatchJobRepository : IReminderDispatchJobRepository
{
    private readonly Dictionary<string, ReminderDispatchJob> records = new(StringComparer.Ordinal);

    public Task<IReadOnlyList<ReminderDispatchJob>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        IReadOnlyList<ReminderDispatchJob> values = records.Values
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderByDescending(x => x.ScheduledForUtc)
            .ToList();

        return Task.FromResult(values);
    }

    public Task<IReadOnlyList<ReminderDispatchJob>> GetDueAsync(DateTimeOffset utcNow, int limit, CancellationToken cancellationToken)
    {
        IReadOnlyList<ReminderDispatchJob> values = records.Values
            .Where(x =>
                (x.Status == ReminderStatus.Pending || x.Status == ReminderStatus.Retrying)
                && (x.NextAttemptAtUtc ?? x.ScheduledForUtc) <= utcNow)
            .OrderBy(x => x.NextAttemptAtUtc ?? x.ScheduledForUtc)
            .Take(limit)
            .ToList();

        return Task.FromResult(values);
    }

    public Task<ReminderDispatchJob?> GetByDeduplicationKeyAsync(string deduplicationKey, CancellationToken cancellationToken)
    {
        var value = records.Values.FirstOrDefault(x => x.DeduplicationKey == deduplicationKey);
        return Task.FromResult(value);
    }

    public Task UpsertAsync(ReminderDispatchJob job, CancellationToken cancellationToken)
    {
        records[job.Id] = job;
        return Task.CompletedTask;
    }
}
