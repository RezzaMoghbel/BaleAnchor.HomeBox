namespace BaleAnchorUtility.Server.Configuration;

public sealed class AuthOtpOptions
{
    public const string SectionName = "Auth:Otp";

    public int OtpLength { get; set; } = 6;
    public int OtpExpiryMinutes { get; set; } = 10;
    public int MaxVerificationAttempts { get; set; } = 5;
    public int ResendCooldownSeconds { get; set; } = 60;
    public int MaxCodesPerHourPerEmail { get; set; } = 6;
    public int SessionDurationHours { get; set; } = 24;
    public string SessionCookieName { get; set; } = "bau.sid";
}
