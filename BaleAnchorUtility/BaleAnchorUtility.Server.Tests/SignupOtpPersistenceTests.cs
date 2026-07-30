using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Auth.Dtos;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Domain.Auth;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Tests;

public sealed class SignupOtpPersistenceTests
{
    [Fact]
    public async Task SignupRequestCodeAsync_DoesNotCreateUser_BeforeOtpVerification()
    {
        var users = new InMemoryUserRepository();
        var service = CreateAuthService(users);

        await service.SignupRequestCodeAsync(
            new SignupRequestCodeRequest
            {
                Email = "resident.signup@baleanchor.local",
                Password = "StrongPass1!",
            },
            "127.0.0.1",
            CancellationToken.None);

        var stored = await users.GetByNormalizedEmailAsync("RESIDENT.SIGNUP@BALEANCHOR.LOCAL", CancellationToken.None);
        Assert.Null(stored);
    }

    [Fact]
    public async Task VerifyCodeAsync_CreatesUser_ForSignupPurpose_WhenCodeIsValid()
    {
        var users = new InMemoryUserRepository();
        var service = CreateAuthService(users);

        await service.SignupRequestCodeAsync(
            new SignupRequestCodeRequest
            {
                Email = "resident.verify@baleanchor.local",
                Password = "StrongPass1!",
            },
            "127.0.0.1",
            CancellationToken.None);

        var verify = await service.VerifyCodeAsync(
            new VerifyCodeRequest
            {
                Email = "resident.verify@baleanchor.local",
                Code = "123456",
                Purpose = "signup",
            },
            "test-agent",
            "127.0.0.1",
            CancellationToken.None);

        Assert.True(verify.Response.Authenticated);

        var stored = await users.GetByNormalizedEmailAsync("RESIDENT.VERIFY@BALEANCHOR.LOCAL", CancellationToken.None);
        Assert.NotNull(stored);
        Assert.Equal(UserAccountStatus.TermsPending, stored!.Status);
        Assert.False(string.IsNullOrWhiteSpace(stored.PasswordSalt));
        Assert.False(string.IsNullOrWhiteSpace(stored.PasswordHash));
    }

    private static AuthService CreateAuthService(InMemoryUserRepository users)
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
            new InMemoryOtpChallengeRepository(),
            new PassThroughSessionRepository(),
            new NoOpEmailSender(),
            new FixedAuthAccessSettingsProvider(),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-29T00:00:00Z") },
            options,
            new FakeHostEnvironment { EnvironmentName = "Development" },
            NullLogger<AuthService>.Instance);
    }

    private sealed class FixedAuthAccessSettingsProvider : IAuthAccessSettingsProvider
    {
        public Task<AuthAccessRuntimeSettings> GetEffectiveAsync(CancellationToken cancellationToken)
        {
            return Task.FromResult(new AuthAccessRuntimeSettings
            {
                OtpEnabled = true,
                AllowLocalDomainFixedOtp = true,
                FixedOtpCode = "123456",
                LocalFixedOtpDomains = ["baleanchor.local"],
            });
        }
    }

    private sealed class InMemoryOtpChallengeRepository : IOtpChallengeRepository
    {
        private readonly List<OtpChallenge> items = [];

        public Task<OtpChallenge?> GetLatestActiveAsync(string emailNormalized, string purpose, CancellationToken cancellationToken)
        {
            var challenge = items
                .Where(x => string.Equals(x.EmailNormalized, emailNormalized, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(x.Purpose, purpose, StringComparison.Ordinal)
                    && x.ConsumedAtUtc is null
                    && x.RevokedAtUtc is null)
                .OrderByDescending(x => x.CreatedAtUtc)
                .FirstOrDefault();

            return Task.FromResult(challenge);
        }

        public Task<int> CountCreatedSinceAsync(string emailNormalized, string purpose, DateTimeOffset sinceUtc, CancellationToken cancellationToken)
        {
            var count = items.Count(x =>
                string.Equals(x.EmailNormalized, emailNormalized, StringComparison.OrdinalIgnoreCase)
                && string.Equals(x.Purpose, purpose, StringComparison.Ordinal)
                && x.CreatedAtUtc >= sinceUtc);

            return Task.FromResult(count);
        }

        public Task AddAsync(OtpChallenge challenge, CancellationToken cancellationToken)
        {
            items.Add(challenge);
            return Task.CompletedTask;
        }

        public Task InvalidateActiveAsync(string emailNormalized, string purpose, CancellationToken cancellationToken)
        {
            foreach (var challenge in items.Where(x =>
                         string.Equals(x.EmailNormalized, emailNormalized, StringComparison.OrdinalIgnoreCase)
                         && string.Equals(x.Purpose, purpose, StringComparison.Ordinal)
                         && x.ConsumedAtUtc is null
                         && x.RevokedAtUtc is null))
            {
                challenge.RevokedAtUtc = DateTimeOffset.UtcNow;
                challenge.Version += 1;
            }

            return Task.CompletedTask;
        }

        public Task UpdateAsync(OtpChallenge challenge, CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}