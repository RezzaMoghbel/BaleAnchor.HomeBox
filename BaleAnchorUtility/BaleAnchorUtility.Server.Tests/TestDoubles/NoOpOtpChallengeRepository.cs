using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Auth;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class NoOpOtpChallengeRepository : IOtpChallengeRepository
{
    public Task<OtpChallenge?> GetLatestActiveAsync(string emailNormalized, string purpose, CancellationToken cancellationToken)
    {
        return Task.FromResult<OtpChallenge?>(null);
    }

    public Task<int> CountCreatedSinceAsync(string emailNormalized, string purpose, DateTimeOffset sinceUtc, CancellationToken cancellationToken)
    {
        return Task.FromResult(0);
    }

    public Task AddAsync(OtpChallenge challenge, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    public Task InvalidateActiveAsync(string emailNormalized, string purpose, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    public Task UpdateAsync(OtpChallenge challenge, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
