namespace BaleAnchorUtility.Server.Application.Abstractions;

public sealed class AuthAccessRuntimeSettings
{
    public bool OtpEnabled { get; init; } = true;
    public bool AllowLocalDomainFixedOtp { get; init; }
    public string FixedOtpCode { get; init; } = "123456";
    public string[] LocalFixedOtpDomains { get; init; } = ["baleanchor.local"];
}
