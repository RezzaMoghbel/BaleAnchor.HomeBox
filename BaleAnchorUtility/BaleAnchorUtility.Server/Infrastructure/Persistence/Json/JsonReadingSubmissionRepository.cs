using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonReadingSubmissionRepository : IReadingSubmissionRepository
{
    private const string Collection = "ReadingSubmissions";
    private readonly JsonCollectionStore store;

    public JsonReadingSubmissionRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public Task AddAsync(ReadingSubmission submission, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, submission.Id, submission, cancellationToken);
    }

    public async Task<ReadingSubmission?> GetLatestByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<ReadingSubmission>(Collection, cancellationToken);

        return all
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderByDescending(x => ParseDate(x.ReadingDate))
            .ThenByDescending(x => x.UpdatedAtUtc)
            .FirstOrDefault();
    }

    private static DateOnly ParseDate(string value)
    {
        return DateOnly.ParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture);
    }
}
