namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class AdminEmailTransportTestResponse
{
    public string Email { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string Mode { get; init; } = string.Empty;
}