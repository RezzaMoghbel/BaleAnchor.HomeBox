namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IEmailTransportSettingsProvider
{
    Task<EmailTransportRuntimeSettings> GetEffectiveAsync(CancellationToken cancellationToken);
}
