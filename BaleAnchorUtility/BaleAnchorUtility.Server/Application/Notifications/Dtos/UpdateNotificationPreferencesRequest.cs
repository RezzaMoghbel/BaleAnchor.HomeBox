using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Notifications.Dtos;

public sealed class UpdateNotificationPreferencesRequest
{
    public bool EmailRemindersEnabled { get; init; } = true;
    public bool PushRemindersEnabled { get; init; }
    public bool ReadingReminderEnabled { get; init; } = true;

    [Required]
    [StringLength(80, MinimumLength = 2)]
    public string TimeZoneId { get; init; } = "Europe/London";
}
