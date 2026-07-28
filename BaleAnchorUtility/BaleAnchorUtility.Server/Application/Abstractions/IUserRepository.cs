using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IUserRepository
{
    Task<UserAccount?> GetByIdAsync(string userId, CancellationToken cancellationToken);
    Task<UserAccount?> GetByNormalizedEmailAsync(string emailNormalized, CancellationToken cancellationToken);
    Task UpsertAsync(UserAccount user, CancellationToken cancellationToken);
}
