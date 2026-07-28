using BaleAnchorUtility.Server.Application.Auth;
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
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-28T12:00:00Z") },
            options,
            NullLogger<AuthService>.Instance);
    }
}
