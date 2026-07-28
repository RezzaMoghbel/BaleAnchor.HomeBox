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

    public Task<UserAccount?> GetByIdAsync(string userId, CancellationToken cancellationToken)
    {
        return GetByIdFromCollectionAsync(userId, cancellationToken);
    }

    public async Task<UserAccount?> GetByNormalizedEmailAsync(string emailNormalized, CancellationToken cancellationToken)
    {
        var users = await store.GetAllAsync<UserAccount>(Collection, cancellationToken);
        return users.FirstOrDefault(x => string.Equals(x.EmailNormalized, emailNormalized, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<IReadOnlyList<UserAccount>> GetByStatusAsync(UserAccountStatus status, CancellationToken cancellationToken)
    {
        var users = await store.GetAllAsync<UserAccount>(Collection, cancellationToken);
        return users.Where(x => x.Status == status).ToList();
    }

    public Task UpsertAsync(UserAccount user, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, user.Id, user, cancellationToken);
    }

    private async Task<UserAccount?> GetByIdFromCollectionAsync(string userId, CancellationToken cancellationToken)
    {
        var users = await store.GetAllAsync<UserAccount>(Collection, cancellationToken);
        return users.FirstOrDefault(x => string.Equals(x.Id, userId, StringComparison.Ordinal));
    }
}
