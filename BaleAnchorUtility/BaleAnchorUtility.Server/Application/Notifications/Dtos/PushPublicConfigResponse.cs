namespace BaleAnchorUtility.Server.Application.Notifications.Dtos;

public sealed class PushPublicConfigResponse
{
    public bool PushEnabled { get; init; }
    public string? VapidPublicKey { get; init; }
    public required string DeepLinkPath { get; init; }
}
