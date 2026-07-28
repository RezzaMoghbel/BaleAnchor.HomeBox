using BaleAnchorUtility.Server.Domain.Onboarding;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IUtilitySetupRepository
{
    Task<UtilitySetupSubmission?> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task UpsertAsync(UtilitySetupSubmission submission, CancellationToken cancellationToken);
}
