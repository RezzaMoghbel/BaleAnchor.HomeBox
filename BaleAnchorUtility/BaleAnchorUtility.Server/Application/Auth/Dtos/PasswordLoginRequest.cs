namespace BaleAnchorUtility.Server.Application.Auth.Dtos;

public sealed class PasswordLoginRequest
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}
