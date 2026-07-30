using BaleAnchorUtility.Server.Application.Abstractions;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryAdminUserPurgeRepository : IAdminUserPurgeRepository
{
    public AdminUserPurgeSummary SummaryToReturn { get; set; } = new()
    {
        UsersDeleted = 1,
    };

    public string? LastUserId { get; private set; }
    public string? LastEmailNormalized { get; private set; }

    public Task<AdminUserPurgeSummary> PurgeUserDataAsync(
        string userId,
        string emailNormalized,
        CancellationToken cancellationToken)
    {
        LastUserId = userId;
        LastEmailNormalized = emailNormalized;
        return Task.FromResult(SummaryToReturn);
    }
}