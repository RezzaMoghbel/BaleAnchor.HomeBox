using BaleAnchorUtility.Server.Application.Abstractions;

namespace BaleAnchorUtility.Server.Infrastructure.Email;

public sealed class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger)
    {
        this.logger = logger;
    }

    public Task SendOtpCodeAsync(string email, string code, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken)
    {
        logger.LogInformation("OTP code issued to {EmailMasked}. Expires at {ExpiresAtUtc}. Code for development only: {Code}", MaskEmail(email), expiresAtUtc, code);
        return Task.CompletedTask;
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
