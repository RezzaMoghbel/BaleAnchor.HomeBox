using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Configuration;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Infrastructure.Email;

public sealed class DatabaseBackedEmailTransportSettingsProvider : IEmailTransportSettingsProvider
{
    private readonly IEmailTransportRuntimeSettingsRepository settingsRepository;
    private readonly ISecretProtector secretProtector;
    private readonly IOptions<EmailTransportOptions> fallbackOptions;
    private readonly ILogger<DatabaseBackedEmailTransportSettingsProvider> logger;

    public DatabaseBackedEmailTransportSettingsProvider(
        IEmailTransportRuntimeSettingsRepository settingsRepository,
        ISecretProtector secretProtector,
        IOptions<EmailTransportOptions> fallbackOptions,
        ILogger<DatabaseBackedEmailTransportSettingsProvider> logger)
    {
        this.settingsRepository = settingsRepository;
        this.secretProtector = secretProtector;
        this.fallbackOptions = fallbackOptions;
        this.logger = logger;
    }

    public async Task<EmailTransportRuntimeSettings> GetEffectiveAsync(CancellationToken cancellationToken)
    {
        var baseConfig = fallbackOptions.Value;
        var document = await settingsRepository.GetAsync(cancellationToken);

        if (document is null)
        {
            return FromBaseOptions(baseConfig);
        }

        var mode = NormalizeMode(document.Mode, defaultMode: baseConfig.Mode);
        var fromName = string.IsNullOrWhiteSpace(document.FromName) ? baseConfig.FromName : document.FromName.Trim();
        var fromAddress = string.IsNullOrWhiteSpace(document.FromAddress) ? baseConfig.FromAddress : document.FromAddress.Trim();
        var smtpHost = string.IsNullOrWhiteSpace(document.SmtpHost) ? baseConfig.SmtpHost : document.SmtpHost.Trim();
        var smtpPort = document.SmtpPort is < 1 or > 65535 ? baseConfig.SmtpPort : document.SmtpPort;
        var smtpUseSsl = document.SmtpUseSsl;
        var smtpUsername = string.IsNullOrWhiteSpace(document.SmtpUsername) ? baseConfig.SmtpUsername : document.SmtpUsername.Trim();

        var smtpPassword = baseConfig.SmtpPassword;
        if (!string.IsNullOrWhiteSpace(document.SmtpPasswordCiphertext))
        {
            if (secretProtector.TryUnprotect(document.SmtpPasswordCiphertext, out var decrypted))
            {
                smtpPassword = decrypted;
            }
            else
            {
                logger.LogWarning("Stored SMTP password in SystemSettings could not be decrypted. Falling back to static configuration value.");
            }
        }

        return new EmailTransportRuntimeSettings
        {
            Mode = mode,
            FromName = fromName,
            FromAddress = fromAddress,
            SmtpHost = smtpHost,
            SmtpPort = smtpPort,
            SmtpUseSsl = smtpUseSsl,
            SmtpUsername = smtpUsername,
            SmtpPassword = smtpPassword,
        };
    }

    private static EmailTransportRuntimeSettings FromBaseOptions(EmailTransportOptions options)
    {
        return new EmailTransportRuntimeSettings
        {
            Mode = NormalizeMode(options.Mode, defaultMode: "log"),
            FromName = options.FromName,
            FromAddress = options.FromAddress,
            SmtpHost = options.SmtpHost,
            SmtpPort = options.SmtpPort,
            SmtpUseSsl = options.SmtpUseSsl,
            SmtpUsername = options.SmtpUsername,
            SmtpPassword = options.SmtpPassword,
        };
    }

    private static string NormalizeMode(string? mode, string defaultMode)
    {
        var normalized = (mode ?? string.Empty).Trim().ToLowerInvariant();
        return normalized is "smtp" or "log" or "off"
            ? normalized
            : (string.IsNullOrWhiteSpace(defaultMode) ? "log" : defaultMode.Trim().ToLowerInvariant());
    }
}
