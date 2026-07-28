using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonUserRepository : IUserRepository
{
    private const string Collection = "Users";
    private readonly JsonCollectionStore store;

    public JsonUserRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<UserAccount?> GetByNormalizedEmailAsync(string emailNormalized, CancellationToken cancellationToken)
    {
        var users = await store.GetAllAsync<UserAccount>(Collection, cancellationToken);
        return users.FirstOrDefault(x => string.Equals(x.EmailNormalized, emailNormalized, StringComparison.OrdinalIgnoreCase));
    }

    public Task UpsertAsync(UserAccount user, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, user.Id, user, cancellationToken);
    }
}
