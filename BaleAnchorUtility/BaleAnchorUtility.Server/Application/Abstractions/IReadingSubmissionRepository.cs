using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IReadingSubmissionRepository
{
    Task AddAsync(ReadingSubmission submission, CancellationToken cancellationToken);
    Task<ReadingSubmission?> GetLatestByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ReadingSubmission>> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task DeleteAsync(string readingId, CancellationToken cancellationToken);
}
