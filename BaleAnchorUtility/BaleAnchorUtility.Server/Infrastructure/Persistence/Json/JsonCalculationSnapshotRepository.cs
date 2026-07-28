using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Calculations;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonCalculationSnapshotRepository : ICalculationSnapshotRepository
{
    private const string Collection = "CalculationSnapshots";
    private readonly JsonCollectionStore store;

    public JsonCalculationSnapshotRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public Task AddAsync(CalculationSnapshot snapshot, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, snapshot.Id, snapshot, cancellationToken);
    }

    public async Task<CalculationSnapshot?> GetLatestByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<CalculationSnapshot>(Collection, cancellationToken);

        return all
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefault();
    }

    public async Task<IReadOnlyList<CalculationSnapshot>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<CalculationSnapshot>(Collection, cancellationToken);

        var results = all
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderBy(x => x.PeriodStartDate, StringComparer.Ordinal)
            .ThenBy(x => x.CreatedAtUtc)
            .ToList();

        return results;
    }
}
