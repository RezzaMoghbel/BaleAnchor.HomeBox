using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Onboarding;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonUtilitySetupRepository : IUtilitySetupRepository
{
    private const string Collection = "UtilitySetups";
    private readonly JsonCollectionStore store;

    public JsonUtilitySetupRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<UtilitySetupSubmission?> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<UtilitySetupSubmission>(Collection, cancellationToken);
        return all.FirstOrDefault(x => string.Equals(x.UserId, userId, StringComparison.Ordinal));
    }

    public Task UpsertAsync(UtilitySetupSubmission submission, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, submission.Id, submission, cancellationToken);
    }
}
