namespace BaleAnchorUtility.Server.Application.Notifications.Dtos;

public sealed class PushSubscriptionResponse
{
    public required string SubscriptionId { get; init; }
    public required string Endpoint { get; init; }
    public bool IsActive { get; init; }
    public string? ExpiresAtUtc { get; init; }
    public required string UpdatedAtUtc { get; init; }
}
