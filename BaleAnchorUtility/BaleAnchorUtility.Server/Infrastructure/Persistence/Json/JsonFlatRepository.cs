using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Admin;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonFlatRepository : IFlatRepository
{
    private const string Collection = "Flats";
    private readonly JsonCollectionStore store;

    public JsonFlatRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<FlatRecord?> GetByFlatNumberAsync(string flatNumberNormalized, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<FlatRecord>(Collection, cancellationToken);
        return all.FirstOrDefault(x => string.Equals(x.FlatNumberNormalized, flatNumberNormalized, StringComparison.Ordinal));
    }

    public Task<IReadOnlyList<FlatRecord>> GetAllAsync(CancellationToken cancellationToken)
    {
        return store.GetAllAsync<FlatRecord>(Collection, cancellationToken);
    }

    public Task UpsertAsync(FlatRecord flat, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, flat.Id, flat, cancellationToken);
    }
}
