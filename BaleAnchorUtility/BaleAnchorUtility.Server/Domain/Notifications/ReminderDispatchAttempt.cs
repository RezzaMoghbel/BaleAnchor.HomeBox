namespace BaleAnchorUtility.Server.Domain.Notifications;

public sealed class ReminderDispatchAttempt
{
    public DateTimeOffset AttemptedAtUtc { get; set; }
    public string Outcome { get; set; } = "Unknown";
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
}
