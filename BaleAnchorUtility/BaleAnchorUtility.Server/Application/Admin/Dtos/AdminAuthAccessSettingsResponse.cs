namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class AdminAuthAccessSettingsResponse
{
    public bool OtpEnabled { get; init; }
    public bool AllowLocalDomainFixedOtp { get; init; }
    public string FixedOtpCode { get; init; } = "123456";
    public string[] LocalFixedOtpDomains { get; init; } = [];
    public string? UpdatedByUserId { get; init; }
    public string? UpdatedAtUtc { get; init; }
}
