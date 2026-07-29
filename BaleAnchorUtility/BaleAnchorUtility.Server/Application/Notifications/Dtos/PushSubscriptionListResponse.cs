namespace BaleAnchorUtility.Server.Application.Notifications.Dtos;

public sealed class PushSubscriptionListResponse
{
    public required string UserId { get; init; }
    public int Count { get; init; }
    public required IReadOnlyList<PushSubscriptionResponse> Items { get; init; }
}
