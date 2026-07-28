using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Auth;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonOtpChallengeRepository : IOtpChallengeRepository
{
    private const string Collection = "OtpChallenges";
    private readonly JsonCollectionStore store;

    public JsonOtpChallengeRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<OtpChallenge?> GetLatestActiveAsync(string emailNormalized, string purpose, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<OtpChallenge>(Collection, cancellationToken);
        return all
            .Where(x => string.Equals(x.EmailNormalized, emailNormalized, StringComparison.OrdinalIgnoreCase)
                && string.Equals(x.Purpose, purpose, StringComparison.Ordinal)
                && x.ConsumedAtUtc is null
                && x.RevokedAtUtc is null)
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefault();
    }

    public async Task<int> CountCreatedSinceAsync(string emailNormalized, string purpose, DateTimeOffset sinceUtc, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<OtpChallenge>(Collection, cancellationToken);
        return all.Count(x =>
            string.Equals(x.EmailNormalized, emailNormalized, StringComparison.OrdinalIgnoreCase)
            && string.Equals(x.Purpose, purpose, StringComparison.Ordinal)
            && x.CreatedAtUtc >= sinceUtc);
    }

    public Task AddAsync(OtpChallenge challenge, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, challenge.Id, challenge, cancellationToken);
    }

    public async Task InvalidateActiveAsync(string emailNormalized, string purpose, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<OtpChallenge>(Collection, cancellationToken);
        var active = all.Where(x =>
            string.Equals(x.EmailNormalized, emailNormalized, StringComparison.OrdinalIgnoreCase)
            && string.Equals(x.Purpose, purpose, StringComparison.Ordinal)
            && x.ConsumedAtUtc is null
            && x.RevokedAtUtc is null);

        foreach (var challenge in active)
        {
            challenge.RevokedAtUtc = DateTimeOffset.UtcNow;
            challenge.Version += 1;
            await store.UpsertAsync(Collection, challenge.Id, challenge, cancellationToken);
        }
    }

    public Task UpdateAsync(OtpChallenge challenge, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, challenge.Id, challenge, cancellationToken);
    }
}
