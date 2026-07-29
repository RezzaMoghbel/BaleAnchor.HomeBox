using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryUserRepository : IUserRepository
{
    private readonly Dictionary<string, UserAccount> byId = new(StringComparer.Ordinal);

    public void Seed(params UserAccount[] users)
    {
        foreach (var user in users)
        {
            byId[user.Id] = user;
        }
    }

    public Task<UserAccount?> GetByIdAsync(string userId, CancellationToken cancellationToken)
    {
        byId.TryGetValue(userId, out var user);
        return Task.FromResult(user);
    }

    public Task<UserAccount?> GetByNormalizedEmailAsync(string emailNormalized, CancellationToken cancellationToken)
    {
        var user = byId.Values.FirstOrDefault(x =>
            string.Equals(x.EmailNormalized, emailNormalized, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(user);
    }

    public Task<IReadOnlyList<UserAccount>> GetByStatusAsync(UserAccountStatus status, CancellationToken cancellationToken)
    {
        var users = byId.Values.Where(x => x.Status == status).ToList();
        return Task.FromResult((IReadOnlyList<UserAccount>)users);
    }

    public Task<IReadOnlyList<UserAccount>> GetAllAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult((IReadOnlyList<UserAccount>)byId.Values.ToList());
    }

    public Task UpsertAsync(UserAccount user, CancellationToken cancellationToken)
    {
        byId[user.Id] = user;
        return Task.CompletedTask;
    }
}
