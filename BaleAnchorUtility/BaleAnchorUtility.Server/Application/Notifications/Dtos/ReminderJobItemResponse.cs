namespace BaleAnchorUtility.Server.Application.Notifications.Dtos;

public sealed class ReminderJobItemResponse
{
    public required string JobId { get; init; }
    public required string Kind { get; init; }
    public required string Channel { get; init; }
    public required string RecommendedReadingDate { get; init; }
    public required string ScheduledForUtc { get; init; }
    public required string Status { get; init; }
    public int AttemptCount { get; init; }
    public int MaxAttempts { get; init; }
    public string? LastErrorCode { get; init; }
    public string? LastErrorMessage { get; init; }
}
