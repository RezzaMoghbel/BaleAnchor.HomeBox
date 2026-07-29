using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Configuration;

public sealed class SeedAccessOptionsValidator : IValidateOptions<SeedAccessOptions>
{
    public ValidateOptionsResult Validate(string? name, SeedAccessOptions options)
    {
        if (!options.Enabled)
        {
            return ValidateOptionsResult.Success;
        }

        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(options.FixedOtpCode))
        {
            errors.Add("SeedAccess:FixedOtpCode is required.");
        }

        if (options.FixedOtpCode.Length < 4 || options.FixedOtpCode.Length > 8)
        {
            errors.Add("SeedAccess:FixedOtpCode must be between 4 and 8 characters.");
        }

        if (options.Accounts is null)
        {
            errors.Add("SeedAccess:Accounts must be provided.");
            return ValidateOptionsResult.Fail(errors);
        }

        var duplicateEmail = options.Accounts
            .Where(account => !string.IsNullOrWhiteSpace(account.Email))
            .GroupBy(account => account.Email.Trim(), StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault(group => group.Count() > 1);

        if (duplicateEmail is not null)
        {
            errors.Add($"SeedAccess:Accounts contains duplicate email '{duplicateEmail.Key}'.");
        }

        for (var i = 0; i < options.Accounts.Length; i++)
        {
            var account = options.Accounts[i];
            if (string.IsNullOrWhiteSpace(account.Id))
            {
                errors.Add($"SeedAccess:Accounts[{i}]:Id is required.");
            }

            if (string.IsNullOrWhiteSpace(account.Email))
            {
                errors.Add($"SeedAccess:Accounts[{i}]:Email is required.");
            }
        }

        return errors.Count == 0 ? ValidateOptionsResult.Success : ValidateOptionsResult.Fail(errors);
    }
}
