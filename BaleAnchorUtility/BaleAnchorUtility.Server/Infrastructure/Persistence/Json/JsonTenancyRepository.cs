using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Admin;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonTenancyRepository : ITenancyRepository
{
    private const string Collection = "Tenancies";
    private readonly JsonCollectionStore store;

    public JsonTenancyRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<TenancyRecord?> GetByIdAsync(string tenancyId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<TenancyRecord>(Collection, cancellationToken);
        return all.FirstOrDefault(x => string.Equals(x.Id, tenancyId, StringComparison.Ordinal));
    }

    public async Task<IReadOnlyList<TenancyRecord>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<TenancyRecord>(Collection, cancellationToken);
        return all.Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal)).ToList();
    }

    public async Task<IReadOnlyList<TenancyRecord>> GetByFlatNumberAsync(string flatNumberNormalized, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<TenancyRecord>(Collection, cancellationToken);
        return all.Where(x => string.Equals(x.FlatNumberNormalized, flatNumberNormalized, StringComparison.Ordinal)).ToList();
    }

    public Task<IReadOnlyList<TenancyRecord>> GetAllAsync(CancellationToken cancellationToken)
    {
        return store.GetAllAsync<TenancyRecord>(Collection, cancellationToken);
    }

    public Task UpsertAsync(TenancyRecord tenancy, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, tenancy.Id, tenancy, cancellationToken);
    }
}
