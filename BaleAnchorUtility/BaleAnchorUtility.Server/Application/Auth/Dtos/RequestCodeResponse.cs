namespace BaleAnchorUtility.Server.Application.Auth.Dtos;

public sealed class RequestCodeResponse
{
    public required string Message { get; init; }
    public int ResendAfterSeconds { get; init; }
    public int ExpiresInSeconds { get; init; }
    public string? DevelopmentCode { get; init; }
}
