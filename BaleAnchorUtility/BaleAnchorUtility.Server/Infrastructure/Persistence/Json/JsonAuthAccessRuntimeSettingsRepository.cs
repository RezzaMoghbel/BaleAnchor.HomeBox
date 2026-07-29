using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.System;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonAuthAccessRuntimeSettingsRepository : IAuthAccessRuntimeSettingsRepository
{
    private const string Collection = "SystemSettings";
    private readonly JsonCollectionStore store;

    public JsonAuthAccessRuntimeSettingsRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<AuthAccessRuntimeSettingsDocument?> GetAsync(CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<AuthAccessRuntimeSettingsDocument>(Collection, cancellationToken);
        return all.FirstOrDefault(x => string.Equals(x.Id, AuthAccessRuntimeSettingsDocument.DocumentId, StringComparison.Ordinal));
    }

    public Task UpsertAsync(AuthAccessRuntimeSettingsDocument document, CancellationToken cancellationToken)
    {
        document.Id = AuthAccessRuntimeSettingsDocument.DocumentId;
        return store.UpsertAsync(Collection, AuthAccessRuntimeSettingsDocument.DocumentId, document, cancellationToken);
    }
}
