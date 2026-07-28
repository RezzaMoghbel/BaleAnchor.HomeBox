using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Calculations;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryCalculationSnapshotRepository : ICalculationSnapshotRepository
{
    private readonly List<CalculationSnapshot> snapshots = [];

    public Task AddAsync(CalculationSnapshot snapshot, CancellationToken cancellationToken)
    {
        snapshots.Add(snapshot);
        return Task.CompletedTask;
    }

    public Task<CalculationSnapshot?> GetLatestByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var latest = snapshots
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefault();

        return Task.FromResult(latest);
    }

    public Task<IReadOnlyList<CalculationSnapshot>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var results = snapshots
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderBy(x => x.PeriodStartDate, StringComparer.Ordinal)
            .ThenBy(x => x.CreatedAtUtc)
            .ToList();

        return Task.FromResult((IReadOnlyList<CalculationSnapshot>)results);
    }
}
