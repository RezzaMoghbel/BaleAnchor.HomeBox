using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryReadingSubmissionRepository : IReadingSubmissionRepository
{
    private readonly List<ReadingSubmission> submissions = [];

    public Task AddAsync(ReadingSubmission submission, CancellationToken cancellationToken)
    {
        submissions.Add(submission);
        return Task.CompletedTask;
    }

    public Task<ReadingSubmission?> GetLatestByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var latest = submissions
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderByDescending(x => DateOnly.ParseExact(x.ReadingDate, "yyyy-MM-dd", CultureInfo.InvariantCulture))
            .ThenByDescending(x => x.UpdatedAtUtc)
            .FirstOrDefault();

        return Task.FromResult(latest);
    }
}
