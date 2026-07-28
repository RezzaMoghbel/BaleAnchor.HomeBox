using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryStatementExportRepository : IStatementExportRepository
{
    private readonly List<StatementExportRecord> records = [];

    public Task AddAsync(StatementExportRecord record, CancellationToken cancellationToken)
    {
        records.Add(record);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<StatementExportRecord>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var result = records
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToList();

        return Task.FromResult((IReadOnlyList<StatementExportRecord>)result);
    }
}
