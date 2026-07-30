using System.Globalization;
using System.Net;
using System.Net.Mail;
using BaleAnchorUtility.Server.Application.Abstractions;

namespace BaleAnchorUtility.Server.Infrastructure.Email;

public sealed class SmtpEmailSender
{
    private readonly ILogger<SmtpEmailSender> logger;

    public SmtpEmailSender(ILogger<SmtpEmailSender> logger)
    {
        this.logger = logger;
    }

    public async Task SendOtpCodeAsync(EmailTransportRuntimeSettings cfg, string email, string code, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken)
    {
        using var message = new MailMessage
        {
            From = new MailAddress(cfg.FromAddress, cfg.FromName),
            Subject = "Your BaleAnchor verification code",
            Body = BuildOtpBody(code, expiresAtUtc),
            IsBodyHtml = false,
        };

        message.To.Add(new MailAddress(email));

        using var client = new SmtpClient(cfg.SmtpHost, cfg.SmtpPort)
        {
            EnableSsl = cfg.SmtpUseSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(cfg.SmtpUsername, cfg.SmtpPassword),
        };

        try
        {
            await client.SendMailAsync(message, cancellationToken);
            logger.LogInformation("OTP email sent via SMTP to {EmailMasked}.", MaskEmail(email));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send OTP email via SMTP to {EmailMasked}.", MaskEmail(email));
            throw;
        }
    }

    public async Task SendReadingReminderAsync(EmailTransportRuntimeSettings cfg, string email, string recommendedReadingDate, string timeZoneId, CancellationToken cancellationToken)
    {
        using var message = new MailMessage
        {
            From = new MailAddress(cfg.FromAddress, cfg.FromName),
            Subject = "Utility reading reminder",
            Body = BuildReadingReminderBody(recommendedReadingDate, timeZoneId),
            IsBodyHtml = false,
        };

        message.To.Add(new MailAddress(email));

        using var client = new SmtpClient(cfg.SmtpHost, cfg.SmtpPort)
        {
            EnableSsl = cfg.SmtpUseSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(cfg.SmtpUsername, cfg.SmtpPassword),
        };

        try
        {
            await client.SendMailAsync(message, cancellationToken);
            logger.LogInformation("Reading reminder email sent via SMTP to {EmailMasked} for date {RecommendedReadingDate}.", MaskEmail(email), recommendedReadingDate);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send reading reminder email via SMTP to {EmailMasked}.", MaskEmail(email));
            throw;
        }
    }

    private static string BuildOtpBody(string code, DateTimeOffset expiresAtUtc)
    {
        var expiresUk = expiresAtUtc.ToOffset(TimeSpan.Zero).ToString("dd/MM/yyyy HH:mm 'UTC'", CultureInfo.GetCultureInfo("en-GB"));

        return $"Your BaleAnchor verification code is: {code}{Environment.NewLine}{Environment.NewLine}"
            + $"This code expires at {expiresUk}.{Environment.NewLine}{Environment.NewLine}"
            + "If you did not request this, you can ignore this email.";
    }

    private static string BuildReadingReminderBody(string recommendedReadingDate, string timeZoneId)
    {
        return $"This is your BaleAnchor utility reading reminder.{Environment.NewLine}{Environment.NewLine}"
            + $"Recommended reading date: {recommendedReadingDate}{Environment.NewLine}"
            + $"Configured timezone: {timeZoneId}{Environment.NewLine}{Environment.NewLine}"
            + "Please sign in to the resident portal and submit your latest cold water, hot water, and electricity readings.";
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
