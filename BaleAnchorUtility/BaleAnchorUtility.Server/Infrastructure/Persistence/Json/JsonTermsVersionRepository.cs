using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Terms;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonTermsVersionRepository : ITermsVersionRepository
{
    private const string Collection = "TermsVersions";
    private readonly JsonCollectionStore store;

    public JsonTermsVersionRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<TermsVersion?> GetActiveAsync(CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<TermsVersion>(Collection, cancellationToken);
        return all
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.PublishedAtUtc)
            .FirstOrDefault();
    }

    public async Task<TermsVersion?> GetByIdAsync(string id, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<TermsVersion>(Collection, cancellationToken);
        return all.FirstOrDefault(x => string.Equals(x.Id, id, StringComparison.Ordinal));
    }

    public Task<IReadOnlyList<TermsVersion>> GetAllAsync(CancellationToken cancellationToken)
    {
        return store.GetAllAsync<TermsVersion>(Collection, cancellationToken);
    }

    public Task UpsertAsync(TermsVersion termsVersion, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, termsVersion.Id, termsVersion, cancellationToken);
    }
}
