namespace BaleAnchorUtility.Server.Application.Auth.Dtos;

public sealed class VerifyCodeResponse
{
    public bool Authenticated { get; init; }
    public required string UserStatus { get; init; }
    public required string Message { get; init; }
}
