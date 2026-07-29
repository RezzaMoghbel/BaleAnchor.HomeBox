namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class UpdateAdminAuthAccessSettingsRequest
{
    public bool OtpEnabled { get; init; } = true;
    public bool AllowLocalDomainFixedOtp { get; init; }
    public string FixedOtpCode { get; init; } = "123456";
    public string[] LocalFixedOtpDomains { get; init; } = [];
    public string Reason { get; init; } = string.Empty;
}
