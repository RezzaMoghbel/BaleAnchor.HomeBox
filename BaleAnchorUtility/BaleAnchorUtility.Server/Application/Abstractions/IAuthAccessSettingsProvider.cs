namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IAuthAccessSettingsProvider
{
    Task<AuthAccessRuntimeSettings> GetEffectiveAsync(CancellationToken cancellationToken);
}
