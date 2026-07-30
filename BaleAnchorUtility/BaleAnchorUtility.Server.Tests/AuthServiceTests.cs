using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Auth.Dtos;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Tests;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task RequestCodeAsync_UsesDevelopmentFallback_WhenEmailDeliveryFails_ForLocalDomain()
    {
        var service = CreateAuthService(
            settings: new AuthAccessRuntimeSettings
            {
                OtpEnabled = true,
                AllowLocalDomainFixedOtp = true,
                FixedOtpCode = "123456",
                LocalFixedOtpDomains = ["baleanchor.local"],
            });

        var response = await service.RequestCodeAsync(
            new RequestCodeRequest { Email = "resident@baleanchor.local" },
            "127.0.0.1",
            CancellationToken.None);

        Assert.Equal("If the details are valid, a code has been sent.", response.Message);
        Assert.Equal("123456", response.DevelopmentCode);
    }

    [Fact]
    public async Task RequestCodeAsync_ThrowsOtpDeliveryException_WhenEmailDeliveryFails_WithoutFallback()
    {
        var users = new InMemoryUserRepository();
        var now = DateTimeOffset.Parse("2026-07-29T00:00:00Z");
        users.Seed(new UserAccount
        {
            Id = "user-1",
            EmailDisplay = "resident@example.com",
            EmailNormalized = "RESIDENT@EXAMPLE.COM",
            Role = UserRole.Resident,
            Status = UserAccountStatus.Active,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        });

        var service = CreateAuthService(
            users,
            new AuthAccessRuntimeSettings
            {
                OtpEnabled = true,
                AllowLocalDomainFixedOtp = false,
                FixedOtpCode = "123456",
                LocalFixedOtpDomains = ["baleanchor.local"],
            });

        var exception = await Assert.ThrowsAsync<OtpDeliveryException>(() =>
            service.RequestCodeAsync(
                new RequestCodeRequest { Email = "resident@example.com" },
                "127.0.0.1",
                CancellationToken.None));

        Assert.Equal("We could not deliver the verification code right now. Please try again shortly.", exception.Message);
    }

    private static AuthService CreateAuthService(AuthAccessRuntimeSettings settings)
    {
        return CreateAuthService(new InMemoryUserRepository(), settings);
    }

    private static AuthService CreateAuthService(
        InMemoryUserRepository users,
        AuthAccessRuntimeSettings settings)
    {
        var options = Options.Create(new AuthOtpOptions
        {
            OtpLength = 6,
            OtpExpiryMinutes = 10,
            MaxVerificationAttempts = 5,
            ResendCooldownSeconds = 30,
            MaxCodesPerHourPerEmail = 10,
            SessionDurationHours = 24,
            SessionCookieName = "bau.sid",
        });

        return new AuthService(
            users,
            new NoOpOtpChallengeRepository(),
            new PassThroughSessionRepository(),
            new ThrowingEmailSender(),
            new FixedAuthAccessSettingsProvider(settings),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-29T00:00:00Z") },
            options,
            new FakeHostEnvironment { EnvironmentName = "Development" },
            NullLogger<AuthService>.Instance);
    }

    private sealed class FixedAuthAccessSettingsProvider : IAuthAccessSettingsProvider
    {
        private readonly AuthAccessRuntimeSettings settings;

        public FixedAuthAccessSettingsProvider(AuthAccessRuntimeSettings settings)
        {
            this.settings = settings;
        }

        public Task<AuthAccessRuntimeSettings> GetEffectiveAsync(CancellationToken cancellationToken)
        {
            return Task.FromResult(settings);
        }
    }

    private sealed class ThrowingEmailSender : IEmailSender
    {
        public Task SendOtpCodeAsync(string email, string code, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken)
        {
            throw new InvalidOperationException("SMTP mailbox unavailable.");
        }

        public Task SendReadingReminderAsync(string email, string recommendedReadingDate, string timeZoneId, CancellationToken cancellationToken)
        {
            throw new InvalidOperationException("SMTP mailbox unavailable.");
        }
    }
}