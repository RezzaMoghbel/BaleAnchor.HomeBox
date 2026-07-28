using BaleAnchorUtility.Server.Domain.Auth;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface ISessionRepository
{
    Task AddAsync(AuthSession session, CancellationToken cancellationToken);
    Task<AuthSession?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken);
    Task UpdateAsync(AuthSession session, CancellationToken cancellationToken);
    Task RevokeByTokenHashAsync(string tokenHash, DateTimeOffset revokedAtUtc, CancellationToken cancellationToken);
}
