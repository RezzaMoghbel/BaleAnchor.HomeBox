namespace BaleAnchorUtility.Server.Domain.Notifications;

public sealed class ReminderDispatchJob
{
    public required string Id { get; init; }
    public required string UserId { get; set; }
    public required string Kind { get; set; }
    public required string Channel { get; set; }
    public required string RecommendedReadingDate { get; set; }
    public required string TimeZoneId { get; set; }
    public DateTimeOffset ScheduledForUtc { get; set; }
    public DateTimeOffset? NextAttemptAtUtc { get; set; }
    public string Status { get; set; } = "Pending";
    public int AttemptCount { get; set; }
    public int MaxAttempts { get; set; } = 5;
    public string TemplateVersion { get; set; } = "reading-reminder-v1";
    public string DeduplicationKey { get; set; } = string.Empty;
    public string? LastErrorCode { get; set; }
    public string? LastErrorMessage { get; set; }
    public List<ReminderDispatchAttempt> AttemptHistory { get; set; } = [];
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
