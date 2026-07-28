namespace BaleAnchorUtility.Server.Domain.Users;

public sealed class UserAccount
{
    public required string Id { get; init; }
    public required string EmailDisplay { get; set; }
    public required string EmailNormalized { get; set; }
    public UserAccountStatus Status { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
