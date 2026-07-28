using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Onboarding;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryUtilitySetupRepository : IUtilitySetupRepository
{
    private readonly Dictionary<string, UtilitySetupSubmission> byUserId = new(StringComparer.Ordinal);

    public void Seed(UtilitySetupSubmission submission)
    {
        byUserId[submission.UserId] = submission;
    }

    public Task<UtilitySetupSubmission?> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        byUserId.TryGetValue(userId, out var submission);
        return Task.FromResult(submission);
    }

    public Task UpsertAsync(UtilitySetupSubmission submission, CancellationToken cancellationToken)
    {
        byUserId[submission.UserId] = submission;
        return Task.CompletedTask;
    }
}
