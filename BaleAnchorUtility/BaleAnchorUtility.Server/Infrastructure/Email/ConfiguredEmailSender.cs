using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Configuration;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Infrastructure.Email;

public sealed class ConfiguredEmailSender : IEmailSender
{
    private readonly IOptions<EmailTransportOptions> options;
    private readonly LoggingEmailSender loggingSender;
    private readonly SmtpEmailSender smtpSender;

    public ConfiguredEmailSender(
        IOptions<EmailTransportOptions> options,
        LoggingEmailSender loggingSender,
        SmtpEmailSender smtpSender)
    {
        this.options = options;
        this.loggingSender = loggingSender;
        this.smtpSender = smtpSender;
    }

    public Task SendOtpCodeAsync(string email, string code, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken)
    {
        var mode = (options.Value.Mode ?? string.Empty).Trim();
        if (string.Equals(mode, "smtp", StringComparison.OrdinalIgnoreCase))
        {
            return smtpSender.SendOtpCodeAsync(email, code, expiresAtUtc, cancellationToken);
        }

        return loggingSender.SendOtpCodeAsync(email, code, expiresAtUtc, cancellationToken);
    }

    public Task SendReadingReminderAsync(string email, string recommendedReadingDate, string timeZoneId, CancellationToken cancellationToken)
    {
        var mode = (options.Value.Mode ?? string.Empty).Trim();
        if (string.Equals(mode, "smtp", StringComparison.OrdinalIgnoreCase))
        {
            return smtpSender.SendReadingReminderAsync(email, recommendedReadingDate, timeZoneId, cancellationToken);
        }

        return loggingSender.SendReadingReminderAsync(email, recommendedReadingDate, timeZoneId, cancellationToken);
    }
}
