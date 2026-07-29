using BaleAnchorUtility.Server.Configuration;

namespace BaleAnchorUtility.Server.Tests;

public sealed class ConfigurationOptionsValidatorTests
{
    [Fact]
    public void AuthOtpOptionsValidator_Fails_WhenOtpLengthOutOfRange()
    {
        var validator = new AuthOtpOptionsValidator();
        var result = validator.Validate(null, new AuthOtpOptions { OtpLength = 3 });

        Assert.True(result.Failed);
    }

    [Fact]
    public void AdminAccessOptionsValidator_Fails_WhenEmailIsInvalid()
    {
        var validator = new AdminAccessOptionsValidator();
        var result = validator.Validate(null, new AdminAccessOptions
        {
            BootstrapAdminEmails = ["invalid-email"],
        });

        Assert.True(result.Failed);
    }

    [Fact]
    public void SeedAccessOptionsValidator_Succeeds_WhenSeedDisabled()
    {
        var validator = new SeedAccessOptionsValidator();
        var result = validator.Validate(null, new SeedAccessOptions
        {
            Enabled = false,
            FixedOtpCode = string.Empty,
            Accounts = [],
        });

        Assert.True(result.Succeeded);
    }

    [Fact]
    public void SeedAccessOptionsValidator_Fails_WhenEnabledAndAccountMissingFields()
    {
        var validator = new SeedAccessOptionsValidator();
        var result = validator.Validate(null, new SeedAccessOptions
        {
            Enabled = true,
            FixedOtpCode = "1234",
            Accounts =
            [
                new SeedUserOptions
                {
                    Id = string.Empty,
                    Email = string.Empty,
                },
            ],
        });

        Assert.True(result.Failed);
    }
}
