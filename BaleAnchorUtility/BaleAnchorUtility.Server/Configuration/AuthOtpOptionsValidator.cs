using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Configuration;

public sealed class AuthOtpOptionsValidator : IValidateOptions<AuthOtpOptions>
{
    public ValidateOptionsResult Validate(string? name, AuthOtpOptions options)
    {
        var errors = new List<string>();

        if (options.OtpLength < 4 || options.OtpLength > 8)
        {
            errors.Add("Auth:Otp:OtpLength must be between 4 and 8.");
        }

        if (options.OtpExpiryMinutes < 1 || options.OtpExpiryMinutes > 30)
        {
            errors.Add("Auth:Otp:OtpExpiryMinutes must be between 1 and 30.");
        }

        if (options.MaxVerificationAttempts < 1 || options.MaxVerificationAttempts > 10)
        {
            errors.Add("Auth:Otp:MaxVerificationAttempts must be between 1 and 10.");
        }

        if (options.ResendCooldownSeconds < 0 || options.ResendCooldownSeconds > 600)
        {
            errors.Add("Auth:Otp:ResendCooldownSeconds must be between 0 and 600.");
        }

        if (options.MaxCodesPerHourPerEmail < 1 || options.MaxCodesPerHourPerEmail > 50)
        {
            errors.Add("Auth:Otp:MaxCodesPerHourPerEmail must be between 1 and 50.");
        }

        if (options.SessionDurationHours < 1 || options.SessionDurationHours > 336)
        {
            errors.Add("Auth:Otp:SessionDurationHours must be between 1 and 336.");
        }

        if (string.IsNullOrWhiteSpace(options.SessionCookieName))
        {
            errors.Add("Auth:Otp:SessionCookieName is required.");
        }

        return errors.Count == 0 ? ValidateOptionsResult.Success : ValidateOptionsResult.Fail(errors);
    }
}
