using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Configuration;

public sealed class SeedAccessOptions
{
    public const string SectionName = "SeedAccess";

    public bool Enabled { get; set; }
    public bool AllowLocalDomainFixedOtp { get; set; }
    public string FixedOtpCode { get; set; } = "123456";
    public SeedUserOptions[] Accounts { get; set; } = [];
}

public sealed class SeedUserOptions
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Resident;
    public UserAccountStatus Status { get; set; } = UserAccountStatus.TermsPending;
    public string? Surname { get; set; }
    public string? DateOfBirth { get; set; }
    public string? FlatNumber { get; set; }
    public string? MobileNumber { get; set; }
}