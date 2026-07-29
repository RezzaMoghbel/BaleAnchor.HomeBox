using BaleAnchorUtility.Server.Application.Abstractions;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class NoOpEmailSender : IEmailSender
{
    public Task SendOtpCodeAsync(string email, string code, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    public Task SendReadingReminderAsync(string email, string recommendedReadingDate, string timeZoneId, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
