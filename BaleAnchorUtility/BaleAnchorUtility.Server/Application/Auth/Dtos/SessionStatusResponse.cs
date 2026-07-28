namespace BaleAnchorUtility.Server.Application.Auth.Dtos;

public sealed class SessionStatusResponse
{
    public bool IsAuthenticated { get; init; }
    public string? UserId { get; init; }
    public string? EmailMasked { get; init; }
    public string? UserStatus { get; init; }
    public string? ExpiresAtUtc { get; init; }
}
