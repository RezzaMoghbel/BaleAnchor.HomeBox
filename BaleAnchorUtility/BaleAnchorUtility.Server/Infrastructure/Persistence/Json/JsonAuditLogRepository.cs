using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Audit;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonAuditLogRepository : IAuditLogRepository
{
    private const string Collection = "AuditLogs";
    private readonly JsonCollectionStore store;

    public JsonAuditLogRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public Task AddAsync(AuditLogEntry entry, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, entry.Id, entry, cancellationToken);
    }
}
