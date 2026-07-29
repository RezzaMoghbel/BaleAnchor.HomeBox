using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal static class AuthServiceTestFactory
{
    public static AuthService Create(InMemoryUserRepository users, PassThroughSessionRepository sessions)
    {
        var options = Options.Create(new AuthOtpOptions
        {
            SessionCookieName = "bau.sid",
        });

        return new AuthService(
            users,
            new NoOpOtpChallengeRepository(),
            sessions,
            new NoOpEmailSender(),
            new NoOpAuthAccessSettingsProvider(),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-28T12:00:00Z") },
            options,
            new FakeHostEnvironment(),
            NullLogger<AuthService>.Instance);
    }

    private sealed class NoOpAuthAccessSettingsProvider : IAuthAccessSettingsProvider
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
}
