namespace BaleAnchorUtility.Server.Domain.Auth;

public sealed class OtpChallenge
{
    public required string Id { get; init; }
    public required string EmailNormalized { get; set; }
    public required string Purpose { get; set; }
    public required string OtpHash { get; set; }
    public required string OtpSalt { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset CooldownUntilUtc { get; set; }
    public int AttemptCount { get; set; }
    public int MaxAttempts { get; set; }
    public string? SignupPasswordSalt { get; set; }
    public string? SignupPasswordHash { get; set; }
    public DateTimeOffset? ConsumedAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
    public int Version { get; set; }
}
