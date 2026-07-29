using System.Security.Cryptography;
using System.Text;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Auth.Dtos;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Domain.Auth;
using BaleAnchorUtility.Server.Domain.Users;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Application.Auth;

public sealed class AuthService
{
    public sealed class VerificationResult
    {
        public required VerifyCodeResponse Response { get; init; }
        public string? SessionToken { get; init; }
        public DateTimeOffset? SessionExpiresAtUtc { get; init; }
    }

    private const string AuthPurpose = "LOGIN_OR_REGISTRATION";

    private readonly IUserRepository userRepository;
    private readonly IOtpChallengeRepository otpChallengeRepository;
    private readonly ISessionRepository sessionRepository;
    private readonly IEmailSender emailSender;
    private readonly ISystemClock clock;
    private readonly AuthOtpOptions options;
    private readonly SeedAccessOptions seedAccessOptions;
    private readonly IHostEnvironment environment;
    private readonly ILogger<AuthService> logger;

    public AuthService(
        IUserRepository userRepository,
        IOtpChallengeRepository otpChallengeRepository,
        ISessionRepository sessionRepository,
        IEmailSender emailSender,
        ISystemClock clock,
        IOptions<AuthOtpOptions> options,
        IOptions<SeedAccessOptions> seedAccessOptions,
        IHostEnvironment environment,
        ILogger<AuthService> logger)
    {
        this.userRepository = userRepository;
        this.otpChallengeRepository = otpChallengeRepository;
        this.sessionRepository = sessionRepository;
        this.emailSender = emailSender;
        this.clock = clock;
        this.options = options.Value;
        this.seedAccessOptions = seedAccessOptions.Value;
        this.environment = environment;
        this.logger = logger;
    }

    public async Task<RequestCodeResponse> RequestCodeAsync(RequestCodeRequest request, string ipAddress, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var normalizedEmail = NormalizeEmail(request.Email);
        var latestActive = await otpChallengeRepository.GetLatestActiveAsync(normalizedEmail, AuthPurpose, cancellationToken);
        var developmentCode = GetDevelopmentOtpCode(normalizedEmail);

        if (latestActive is not null && latestActive.CooldownUntilUtc > now)
        {
            return new RequestCodeResponse
            {
                Message = "If the details are valid, a code has been sent.",
                ResendAfterSeconds = (int)Math.Ceiling((latestActive.CooldownUntilUtc - now).TotalSeconds),
                ExpiresInSeconds = (int)Math.Ceiling((latestActive.ExpiresAtUtc - now).TotalSeconds),
                DevelopmentCode = developmentCode,
            };
        }

        var oneHourAgo = now.AddHours(-1);
        var sendsLastHour = await otpChallengeRepository.CountCreatedSinceAsync(normalizedEmail, AuthPurpose, oneHourAgo, cancellationToken);
        if (sendsLastHour >= options.MaxCodesPerHourPerEmail)
        {
            logger.LogWarning("OTP send limit exceeded for email hash {EmailHash} from IP {IP}", Sha256Hex(normalizedEmail), ipAddress);
            return new RequestCodeResponse
            {
                Message = "If the details are valid, a code has been sent.",
                ResendAfterSeconds = options.ResendCooldownSeconds,
                ExpiresInSeconds = options.OtpExpiryMinutes * 60,
                DevelopmentCode = developmentCode,
            };
        }

        await otpChallengeRepository.InvalidateActiveAsync(normalizedEmail, AuthPurpose, cancellationToken);

        var code = developmentCode ?? GenerateNumericCode(options.OtpLength);
        var salt = GenerateRandomBase64(16);
        var challenge = new OtpChallenge
        {
            Id = Guid.NewGuid().ToString("N"),
            EmailNormalized = normalizedEmail,
            Purpose = AuthPurpose,
            OtpSalt = salt,
            OtpHash = ComputeSecretHash(code, salt),
            CreatedAtUtc = now,
            ExpiresAtUtc = now.AddMinutes(options.OtpExpiryMinutes),
            CooldownUntilUtc = now.AddSeconds(options.ResendCooldownSeconds),
            AttemptCount = 0,
            MaxAttempts = options.MaxVerificationAttempts,
            Version = 1,
        };

        await otpChallengeRepository.AddAsync(challenge, cancellationToken);
        await emailSender.SendOtpCodeAsync(request.Email.Trim(), code, challenge.ExpiresAtUtc, cancellationToken);

        logger.LogInformation("OTP challenge issued for email hash {EmailHash} from IP {IP}", Sha256Hex(normalizedEmail), ipAddress);

        return new RequestCodeResponse
        {
            Message = "If the details are valid, a code has been sent.",
            ResendAfterSeconds = options.ResendCooldownSeconds,
            ExpiresInSeconds = options.OtpExpiryMinutes * 60,
            DevelopmentCode = developmentCode,
        };
    }

    public async Task<VerificationResult> VerifyCodeAsync(VerifyCodeRequest request, string deviceSummary, string ipAddress, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var normalizedEmail = NormalizeEmail(request.Email);
        var challenge = await otpChallengeRepository.GetLatestActiveAsync(normalizedEmail, AuthPurpose, cancellationToken);

        if (challenge is null || challenge.ExpiresAtUtc <= now)
        {
            logger.LogWarning("OTP verify failed due to missing or expired challenge for email hash {EmailHash} from IP {IP}", Sha256Hex(normalizedEmail), ipAddress);
            return new VerificationResult
            {
                Response = new VerifyCodeResponse
                {
                    Authenticated = false,
                    UserStatus = UserAccountStatus.EmailUnverified.ToString(),
                    Message = "The code is invalid or has expired.",
                }
            };
        }

        challenge.AttemptCount += 1;
        if (challenge.AttemptCount > challenge.MaxAttempts)
        {
            challenge.RevokedAtUtc = now;
            challenge.Version += 1;
            await otpChallengeRepository.UpdateAsync(challenge, cancellationToken);
            logger.LogWarning("OTP verify max attempts exceeded for email hash {EmailHash} from IP {IP}", Sha256Hex(normalizedEmail), ipAddress);

            return new VerificationResult
            {
                Response = new VerifyCodeResponse
                {
                    Authenticated = false,
                    UserStatus = UserAccountStatus.EmailUnverified.ToString(),
                    Message = "The code is invalid or has expired.",
                }
            };
        }

        var providedCodeHash = ComputeSecretHash(request.Code.Trim(), challenge.OtpSalt);
        if (!SlowEquals(providedCodeHash, challenge.OtpHash))
        {
            challenge.Version += 1;
            await otpChallengeRepository.UpdateAsync(challenge, cancellationToken);
            logger.LogWarning("OTP verify failed for email hash {EmailHash} from IP {IP}", Sha256Hex(normalizedEmail), ipAddress);

            return new VerificationResult
            {
                Response = new VerifyCodeResponse
                {
                    Authenticated = false,
                    UserStatus = UserAccountStatus.EmailUnverified.ToString(),
                    Message = "The code is invalid or has expired.",
                }
            };
        }

        challenge.ConsumedAtUtc = now;
        challenge.Version += 1;
        await otpChallengeRepository.UpdateAsync(challenge, cancellationToken);

        var user = await userRepository.GetByNormalizedEmailAsync(normalizedEmail, cancellationToken)
            ?? new UserAccount
            {
                Id = Guid.NewGuid().ToString("N"),
                EmailDisplay = request.Email.Trim(),
                EmailNormalized = normalizedEmail,
                Role = UserRole.Resident,
                Status = UserAccountStatus.TermsPending,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
                Version = 1,
            };

        if (user.Status is UserAccountStatus.EmailUnverified or UserAccountStatus.EmailVerified)
        {
            user.Status = UserAccountStatus.TermsPending;
        }

        user.UpdatedAtUtc = now;
        user.Version += 1;
        await userRepository.UpsertAsync(user, cancellationToken);

        var rawToken = GenerateRandomBase64(32);
        var session = new AuthSession
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = user.Id,
            EmailNormalized = user.EmailNormalized,
            TokenHash = ComputeSecretHash(rawToken, "session"),
            DeviceSummary = TruncateDeviceSummary(deviceSummary),
            CreatedAtUtc = now,
            LastUsedAtUtc = now,
            ExpiresAtUtc = now.AddHours(options.SessionDurationHours),
            Version = 1,
        };

        await sessionRepository.AddAsync(session, cancellationToken);
        logger.LogInformation("OTP verify succeeded and session created for email hash {EmailHash} from IP {IP}", Sha256Hex(normalizedEmail), ipAddress);

        return new VerificationResult
        {
            Response = new VerifyCodeResponse
            {
                Authenticated = true,
                UserStatus = user.Status.ToString(),
                Message = "Authentication successful.",
            },
            SessionToken = rawToken,
            SessionExpiresAtUtc = session.ExpiresAtUtc,
        };
    }

    public string SessionCookieName => options.SessionCookieName;

    public async Task<SessionStatusResponse> GetSessionStatusAsync(string? rawToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return new SessionStatusResponse { IsAuthenticated = false };
        }

        var tokenHash = ComputeSecretHash(rawToken, "session");
        var session = await sessionRepository.GetByTokenHashAsync(tokenHash, cancellationToken);
        var now = clock.UtcNow;

        if (session is null || session.RevokedAtUtc is not null || session.ExpiresAtUtc <= now)
        {
            return new SessionStatusResponse { IsAuthenticated = false };
        }

        session.LastUsedAtUtc = now;
        session.Version += 1;
        await sessionRepository.UpdateAsync(session, cancellationToken);

        var user = await userRepository.GetByNormalizedEmailAsync(session.EmailNormalized, cancellationToken);

        return new SessionStatusResponse
        {
            IsAuthenticated = true,
            UserId = session.UserId,
            EmailMasked = MaskEmail(session.EmailNormalized),
            UserStatus = user?.Status.ToString(),
            UserRole = user?.Role.ToString(),
            ExpiresAtUtc = session.ExpiresAtUtc.ToString("O"),
        };
    }

    public async Task LogoutAsync(string? rawToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return;
        }

        var tokenHash = ComputeSecretHash(rawToken, "session");
        await sessionRepository.RevokeByTokenHashAsync(tokenHash, clock.UtcNow, cancellationToken);
    }

    public static string NormalizeEmail(string email) => email.Trim().ToUpperInvariant();

    private string? GetDevelopmentOtpCode(string normalizedEmail)
    {
        if (!environment.IsDevelopment() || !seedAccessOptions.Enabled)
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(seedAccessOptions.FixedOtpCode))
        {
            return null;
        }

        var isSeedEmail = seedAccessOptions.Accounts.Any(account =>
            !string.IsNullOrWhiteSpace(account.Email)
            && string.Equals(NormalizeEmail(account.Email), normalizedEmail, StringComparison.Ordinal));

        return isSeedEmail ? seedAccessOptions.FixedOtpCode.Trim() : null;
    }

    private static string MaskEmail(string normalizedEmail)
    {
        var parts = normalizedEmail.Split('@');
        if (parts.Length != 2 || parts[0].Length < 2)
        {
            return "***";
        }

        return $"{parts[0][0]}***{parts[0][^1]}@{parts[1].ToLowerInvariant()}";
    }

    private static string GenerateNumericCode(int length)
    {
        var bytes = RandomNumberGenerator.GetBytes(length);
        var builder = new StringBuilder(length);

        foreach (var b in bytes)
        {
            builder.Append((b % 10).ToString());
        }

        return builder.ToString();
    }

    private static string GenerateRandomBase64(int size)
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(size));
    }

    private static string ComputeSecretHash(string value, string salt)
    {
        using var sha = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes($"{salt}:{value}");
        var hash = sha.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }

    private static string Sha256Hex(string value)
    {
        using var sha = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(value);
        var hash = sha.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }

    private static bool SlowEquals(string left, string right)
    {
        var leftBytes = Encoding.UTF8.GetBytes(left);
        var rightBytes = Encoding.UTF8.GetBytes(right);
        return CryptographicOperations.FixedTimeEquals(leftBytes, rightBytes);
    }

    private static string TruncateDeviceSummary(string value)
    {
        const int maxLength = 256;
        var cleaned = string.IsNullOrWhiteSpace(value) ? "unknown" : value.Trim();
        return cleaned.Length <= maxLength ? cleaned : cleaned[..maxLength];
    }
}
