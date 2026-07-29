namespace BaleAnchorUtility.Server.Domain.Notifications;

public sealed class NotificationPreferences
{
    public required string Id { get; init; }
    public required string UserId { get; set; }
    public bool EmailRemindersEnabled { get; set; } = true;
    public bool PushRemindersEnabled { get; set; }
    public bool ReadingReminderEnabled { get; set; } = true;
    public string TimeZoneId { get; set; } = "Europe/London";
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
