using BaleAnchorUtility.Server.Domain.System;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IAuthAccessRuntimeSettingsRepository
{
    Task<AuthAccessRuntimeSettingsDocument?> GetAsync(CancellationToken cancellationToken);
    Task UpsertAsync(AuthAccessRuntimeSettingsDocument document, CancellationToken cancellationToken);
}
