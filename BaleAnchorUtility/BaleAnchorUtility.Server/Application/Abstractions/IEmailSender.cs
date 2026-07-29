namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IEmailSender
{
    Task SendOtpCodeAsync(string email, string code, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken);
    Task SendReadingReminderAsync(string email, string recommendedReadingDate, string timeZoneId, CancellationToken cancellationToken);
}
