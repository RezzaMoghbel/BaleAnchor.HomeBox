using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Auth;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonSessionRepository : ISessionRepository
{
    private const string Collection = "Sessions";
    private readonly JsonCollectionStore store;

    public JsonSessionRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public Task AddAsync(AuthSession session, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, session.Id, session, cancellationToken);
    }

    public async Task<AuthSession?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<AuthSession>(Collection, cancellationToken);
        return all.FirstOrDefault(x => string.Equals(x.TokenHash, tokenHash, StringComparison.Ordinal));
    }

    public Task UpdateAsync(AuthSession session, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, session.Id, session, cancellationToken);
    }

    public async Task RevokeByTokenHashAsync(string tokenHash, DateTimeOffset revokedAtUtc, CancellationToken cancellationToken)
    {
        var session = await GetByTokenHashAsync(tokenHash, cancellationToken);
        if (session is null)
        {
            return;
        }

        session.RevokedAtUtc = revokedAtUtc;
        session.Version += 1;
        await store.UpsertAsync(Collection, session.Id, session, cancellationToken);
    }
}
