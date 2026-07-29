using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Audit;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryAuditLogRepository : IAuditLogRepository
{
    public List<AuditLogEntry> Entries { get; } = [];

    public Task AddAsync(AuditLogEntry entry, CancellationToken cancellationToken)
    {
        Entries.Add(entry);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<AuditLogEntry>> GetAllAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult((IReadOnlyList<AuditLogEntry>)Entries.ToList());
    }
}
