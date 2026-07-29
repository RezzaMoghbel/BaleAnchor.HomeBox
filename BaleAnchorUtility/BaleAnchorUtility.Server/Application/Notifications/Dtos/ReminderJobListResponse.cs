namespace BaleAnchorUtility.Server.Application.Notifications.Dtos;

public sealed class ReminderJobListResponse
{
    public required string UserId { get; init; }
    public int Count { get; init; }
    public required IReadOnlyList<ReminderJobItemResponse> Items { get; init; }
}
