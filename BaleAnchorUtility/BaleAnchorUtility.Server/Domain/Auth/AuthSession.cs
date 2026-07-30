namespace BaleAnchorUtility.Server.Domain.Auth;

public sealed class AuthSession
{
    public required string Id { get; init; }
    public required string TokenHash { get; set; }
    public required string EmailNormalized { get; set; }
    public required string UserId { get; set; }
    public required string DeviceSummary { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset LastUsedAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
    public bool IsDelegatedSession { get; set; }
    public string? DelegatedByUserId { get; set; }
    public string? DelegationReason { get; set; }
    public int Version { get; set; }
}
