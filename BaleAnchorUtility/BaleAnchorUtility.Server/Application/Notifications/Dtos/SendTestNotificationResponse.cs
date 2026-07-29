namespace BaleAnchorUtility.Server.Application.Notifications.Dtos;

public sealed class SendTestNotificationResponse
{
    public required string UserId { get; init; }
    public int DeliveredSubscriptions { get; init; }
    public required string Message { get; init; }
}
