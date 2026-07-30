namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class SendAdminEmailTransportTestRequest
{
    public string Email { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
}