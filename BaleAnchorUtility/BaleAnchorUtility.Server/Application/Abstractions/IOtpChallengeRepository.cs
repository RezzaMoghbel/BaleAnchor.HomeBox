using BaleAnchorUtility.Server.Domain.Auth;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IOtpChallengeRepository
{
    Task<OtpChallenge?> GetLatestActiveAsync(string emailNormalized, string purpose, CancellationToken cancellationToken);
    Task<int> CountCreatedSinceAsync(string emailNormalized, string purpose, DateTimeOffset sinceUtc, CancellationToken cancellationToken);
    Task AddAsync(OtpChallenge challenge, CancellationToken cancellationToken);
    Task InvalidateActiveAsync(string emailNormalized, string purpose, CancellationToken cancellationToken);
    Task UpdateAsync(OtpChallenge challenge, CancellationToken cancellationToken);
}
