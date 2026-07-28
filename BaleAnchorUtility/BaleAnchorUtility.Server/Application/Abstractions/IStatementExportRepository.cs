using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IStatementExportRepository
{
    Task AddAsync(StatementExportRecord record, CancellationToken cancellationToken);
    Task<IReadOnlyList<StatementExportRecord>> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
}
