namespace BaleAnchorUtility.Server.Domain.Users;

public sealed class UserAccount
{
    public required string Id { get; init; }
    public required string EmailDisplay { get; set; }
    public required string EmailNormalized { get; set; }
    public string? SurnameNormalized { get; set; }
    public string? DateOfBirth { get; set; }
    public string? FlatNumberNormalized { get; set; }
    public string? MobileNumber { get; set; }
    public UserAccountStatus Status { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
