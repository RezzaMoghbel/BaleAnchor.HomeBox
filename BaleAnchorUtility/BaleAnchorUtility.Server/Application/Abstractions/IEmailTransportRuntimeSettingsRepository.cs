using BaleAnchorUtility.Server.Domain.System;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IEmailTransportRuntimeSettingsRepository
{
    Task<EmailTransportRuntimeSettingsDocument?> GetAsync(CancellationToken cancellationToken);
    Task UpsertAsync(EmailTransportRuntimeSettingsDocument document, CancellationToken cancellationToken);
}
