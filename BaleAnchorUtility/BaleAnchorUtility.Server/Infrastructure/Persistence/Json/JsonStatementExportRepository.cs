using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonStatementExportRepository : IStatementExportRepository
{
    private const string Collection = "StatementExports";
    private readonly JsonCollectionStore store;

    public JsonStatementExportRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public Task AddAsync(StatementExportRecord record, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, record.Id, record, cancellationToken);
    }

    public async Task<IReadOnlyList<StatementExportRecord>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<StatementExportRecord>(Collection, cancellationToken);

        var results = all
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToList();

        return results;
    }
}
