namespace BaleAnchorUtility.Server.Application.Notifications.Dtos;

public sealed class NotificationPreferencesResponse
{
    public required string UserId { get; init; }
    public bool EmailRemindersEnabled { get; init; }
    public bool PushRemindersEnabled { get; init; }
    public bool ReadingReminderEnabled { get; init; }
    public required string TimeZoneId { get; init; }
    public required string UpdatedAtUtc { get; init; }
}
