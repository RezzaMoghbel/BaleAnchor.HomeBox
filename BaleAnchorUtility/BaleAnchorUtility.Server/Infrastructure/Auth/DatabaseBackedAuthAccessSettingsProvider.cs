using BaleAnchorUtility.Server.Application.Abstractions;

namespace BaleAnchorUtility.Server.Infrastructure.Auth;

public sealed class DatabaseBackedAuthAccessSettingsProvider : IAuthAccessSettingsProvider
{
    private readonly IAuthAccessRuntimeSettingsRepository repository;

    public DatabaseBackedAuthAccessSettingsProvider(IAuthAccessRuntimeSettingsRepository repository)
    {
        this.repository = repository;
    }

    public async Task<AuthAccessRuntimeSettings> GetEffectiveAsync(CancellationToken cancellationToken)
    {
        var document = await repository.GetAsync(cancellationToken);
        if (document is null)
        {
            return new AuthAccessRuntimeSettings();
        }

        var domains = document.LocalFixedOtpDomains
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim().ToLowerInvariant())
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (domains.Length == 0)
        {
            domains = ["baleanchor.local"];
        }

        var fixedCode = string.IsNullOrWhiteSpace(document.FixedOtpCode)
            ? "123456"
            : document.FixedOtpCode.Trim();

        return new AuthAccessRuntimeSettings
        {
            OtpEnabled = document.OtpEnabled,
            AllowLocalDomainFixedOtp = document.AllowLocalDomainFixedOtp,
            FixedOtpCode = fixedCode,
            LocalFixedOtpDomains = domains,
        };
    }
}
