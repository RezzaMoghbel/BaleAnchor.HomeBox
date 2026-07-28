using BaleAnchorUtility.Server.Domain.Audit;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLogEntry entry, CancellationToken cancellationToken);
}
