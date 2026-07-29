using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.System;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonEmailTransportRuntimeSettingsRepository : IEmailTransportRuntimeSettingsRepository
{
    private const string Collection = "SystemSettings";
    private readonly JsonCollectionStore store;

    public JsonEmailTransportRuntimeSettingsRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<EmailTransportRuntimeSettingsDocument?> GetAsync(CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<EmailTransportRuntimeSettingsDocument>(Collection, cancellationToken);
        return all.FirstOrDefault(x => string.Equals(x.Id, EmailTransportRuntimeSettingsDocument.DocumentId, StringComparison.Ordinal));
    }

    public Task UpsertAsync(EmailTransportRuntimeSettingsDocument document, CancellationToken cancellationToken)
    {
        document.Id = EmailTransportRuntimeSettingsDocument.DocumentId;
        return store.UpsertAsync(Collection, EmailTransportRuntimeSettingsDocument.DocumentId, document, cancellationToken);
    }
}
