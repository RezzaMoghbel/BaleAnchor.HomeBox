using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Configuration;

public sealed class AdminAccessOptionsValidator : IValidateOptions<AdminAccessOptions>
{
    public ValidateOptionsResult Validate(string? name, AdminAccessOptions options)
    {
        if (options.BootstrapAdminEmails is null)
        {
            return ValidateOptionsResult.Fail("AdminAccess:BootstrapAdminEmails must be an array.");
        }

        var normalized = options.BootstrapAdminEmails
            .Where(email => !string.IsNullOrWhiteSpace(email))
            .Select(email => email.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (normalized.Any(email => !email.Contains('@')))
        {
            return ValidateOptionsResult.Fail("AdminAccess:BootstrapAdminEmails contains one or more invalid email values.");
        }

        return ValidateOptionsResult.Success;
    }
}
