using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Admin;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonTenantGapRepository : ITenantGapRepository
{
    private const string Collection = "TenantGaps";
    private readonly JsonCollectionStore store;

    public JsonTenantGapRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<IReadOnlyList<TenantGapAllocation>> GetByFlatNumberAsync(string flatNumberNormalized, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<TenantGapAllocation>(Collection, cancellationToken);
        return all.Where(x => string.Equals(x.FlatNumberNormalized, flatNumberNormalized, StringComparison.Ordinal)).ToList();
    }

    public Task<IReadOnlyList<TenantGapAllocation>> GetAllAsync(CancellationToken cancellationToken)
    {
        return store.GetAllAsync<TenantGapAllocation>(Collection, cancellationToken);
    }

    public Task UpsertAsync(TenantGapAllocation allocation, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, allocation.Id, allocation, cancellationToken);
    }
}
