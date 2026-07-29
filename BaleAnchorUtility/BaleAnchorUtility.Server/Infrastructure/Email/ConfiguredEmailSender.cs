using BaleAnchorUtility.Server.Application.Abstractions;

namespace BaleAnchorUtility.Server.Infrastructure.Email;

public sealed class ConfiguredEmailSender : IEmailSender
{
    private readonly IEmailTransportSettingsProvider settingsProvider;
    private readonly LoggingEmailSender loggingSender;
    private readonly SmtpEmailSender smtpSender;
    private readonly ILogger<ConfiguredEmailSender> logger;

    public ConfiguredEmailSender(
        IEmailTransportSettingsProvider settingsProvider,
        LoggingEmailSender loggingSender,
        SmtpEmailSender smtpSender,
        ILogger<ConfiguredEmailSender> logger)
    {
        this.settingsProvider = settingsProvider;
        this.loggingSender = loggingSender;
        this.smtpSender = smtpSender;
        this.logger = logger;
    }

    public async Task SendOtpCodeAsync(string email, string code, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken)
    {
        var settings = await settingsProvider.GetEffectiveAsync(cancellationToken);
        var mode = (settings.Mode ?? string.Empty).Trim();
        if (string.Equals(mode, "smtp", StringComparison.OrdinalIgnoreCase))
        {
            await smtpSender.SendOtpCodeAsync(settings, email, code, expiresAtUtc, cancellationToken);
            return;
        }

        if (string.Equals(mode, "off", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogInformation("Email transport mode is off. OTP email suppressed for {EmailMasked}.", MaskEmail(email));
            return;
        }

        await loggingSender.SendOtpCodeAsync(email, code, expiresAtUtc, cancellationToken);
    }

    public async Task SendReadingReminderAsync(string email, string recommendedReadingDate, string timeZoneId, CancellationToken cancellationToken)
    {
        var settings = await settingsProvider.GetEffectiveAsync(cancellationToken);
        var mode = (settings.Mode ?? string.Empty).Trim();
        if (string.Equals(mode, "smtp", StringComparison.OrdinalIgnoreCase))
        {
            await smtpSender.SendReadingReminderAsync(settings, email, recommendedReadingDate, timeZoneId, cancellationToken);
            return;
        }

        if (string.Equals(mode, "off", StringComparison.OrdinalIgnoreCase))
        {
            logger.LogInformation("Email transport mode is off. Reading reminder email suppressed for {EmailMasked}.", MaskEmail(email));
            return;
        }

        await loggingSender.SendReadingReminderAsync(email, recommendedReadingDate, timeZoneId, cancellationToken);
    }

    private static string MaskEmail(string email)
    {
        var parts = email.Split('@');
        if (parts.Length != 2 || parts[0].Length < 2)
        {
            return "***";
        }

        return $"{parts[0][0]}***{parts[0][^1]}@{parts[1]}";
    }
}
