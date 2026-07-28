using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Auth;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class PassThroughSessionRepository : ISessionRepository
{
    public AuthSession? SessionToReturn { get; set; }

    public Task AddAsync(AuthSession session, CancellationToken cancellationToken)
    {
        SessionToReturn = session;
        return Task.CompletedTask;
    }

    public Task<AuthSession?> GetByTokenHashAsync(string tokenHash, CancellationToken cancellationToken)
    {
        return Task.FromResult(SessionToReturn);
    }

    public Task UpdateAsync(AuthSession session, CancellationToken cancellationToken)
    {
        SessionToReturn = session;
        return Task.CompletedTask;
    }

    public Task RevokeByTokenHashAsync(string tokenHash, DateTimeOffset revokedAtUtc, CancellationToken cancellationToken)
    {
        if (SessionToReturn is not null)
        {
            SessionToReturn.RevokedAtUtc = revokedAtUtc;
        }

        return Task.CompletedTask;
    }
}
