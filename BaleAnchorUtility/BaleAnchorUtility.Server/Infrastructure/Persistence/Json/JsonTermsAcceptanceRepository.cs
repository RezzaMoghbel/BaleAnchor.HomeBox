using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Terms;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonTermsAcceptanceRepository : ITermsAcceptanceRepository
{
    private const string Collection = "TermsAcceptances";
    private readonly JsonCollectionStore store;

    public JsonTermsAcceptanceRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<TermsAcceptance?> GetByUserAndVersionAsync(string userId, string termsVersionId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<TermsAcceptance>(Collection, cancellationToken);
        return all.FirstOrDefault(x =>
            string.Equals(x.UserId, userId, StringComparison.Ordinal)
            && string.Equals(x.TermsVersionId, termsVersionId, StringComparison.Ordinal));
    }

    public Task AddAsync(TermsAcceptance acceptance, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, acceptance.Id, acceptance, cancellationToken);
    }
}
