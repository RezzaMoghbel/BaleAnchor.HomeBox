namespace BaleAnchorUtility.Server.Domain.System;

public sealed class AuthAccessRuntimeSettingsDocument
{
    public const string DocumentId = "auth-access";

    public string Id { get; set; } = DocumentId;
    public bool OtpEnabled { get; set; } = true;
    public bool AllowLocalDomainFixedOtp { get; set; }
    public string FixedOtpCode { get; set; } = "123456";
    public string[] LocalFixedOtpDomains { get; set; } = ["baleanchor.local"];
    public string UpdatedByUserId { get; set; } = string.Empty;
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
