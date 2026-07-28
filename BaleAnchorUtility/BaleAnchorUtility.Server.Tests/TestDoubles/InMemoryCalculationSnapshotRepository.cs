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
}
