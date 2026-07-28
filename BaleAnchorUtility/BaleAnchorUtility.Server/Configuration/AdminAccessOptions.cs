namespace BaleAnchorUtility.Server.Configuration;

public sealed class AdminAccessOptions
{
    public const string SectionName = "AdminAccess";

    public string[] AllowedEmails { get; set; } = [];
}
