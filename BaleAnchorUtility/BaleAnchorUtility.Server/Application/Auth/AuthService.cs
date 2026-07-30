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

    private const string LoginPurpose = "LOGIN";
    private const string SignupPurpose = "SIGNUP";

    private readonly IUserRepository userRepository;
    private readonly IOtpChallengeRepository otpChallengeRepository;
    private readonly ISessionRepository sessionRepository;
    private readonly IEmailSender emailSender;
    private readonly IAuthAccessSettingsProvider authAccessSettingsProvider;
    private readonly ISystemClock clock;
    private readonly AuthOtpOptions options;
    private readonly IHostEnvironment environment;
    private readonly ILogger<AuthService> logger;

    public AuthService(
        IUserRepository userRepository,
        IOtpChallengeRepository otpChallengeRepository,
        ISessionRepository sessionRepository,
        IEmailSender emailSender,
        IAuthAccessSettingsProvider authAccessSettingsProvider,
        ISystemClock clock,
        IOptions<AuthOtpOptions> options,
        IHostEnvironment environment,
        ILogger<AuthService> logger)
    {
        this.userRepository = userRepository;
        this.otpChallengeRepository = otpChallengeRepository;
        this.sessionRepository = sessionRepository;
        this.emailSender = emailSender;
        this.authAccessSettingsProvider = authAccessSettingsProvider;
        this.clock = clock;
        this.options = options.Value;
        this.environment = environment;
        this.logger = logger;
    }

    public async Task<RequestCodeResponse> RequestCodeAsync(RequestCodeRequest request, string ipAddress, CancellationToken cancellationToken)
    {
        var authSettings = await authAccessSettingsProvider.GetEffectiveAsync(cancellationToken);
        if (!authSettings.OtpEnabled)
        {
            return new RequestCodeResponse
            {
                Message = "OTP login is currently disabled. Please sign in with email and password.",
                ResendAfterSeconds = 0,
                ExpiresInSeconds = 0,
            };
        }

        var normalizedEmail = NormalizeEmail(request.Email);
        var user = await userRepository.GetByNormalizedEmailAsync(normalizedEmail, cancellationToken);

        if (user is null && !ShouldBypassWithLocalFixedOtp(normalizedEmail, authSettings))
        {
            logger.LogInformation("Login request ignored for unknown email hash {EmailHash} from IP {IP}", Sha256Hex(normalizedEmail), ipAddress);
            return new RequestCodeResponse
            {
                Message = "If the details are valid, a code has been sent.",
                ResendAfterSeconds = options.ResendCooldownSeconds,
                ExpiresInSeconds = options.OtpExpiryMinutes * 60,
            };
        }

        return await RequestCodeCoreAsync(request.Email, ipAddress, LoginPurpose, cancellationToken);
    }

    public async Task<RequestCodeResponse> SignupRequestCodeAsync(SignupRequestCodeRequest request, string ipAddress, CancellationToken cancellationToken)
    {
        var authSettings = await authAccessSettingsProvider.GetEffectiveAsync(cancellationToken);
        var normalizedEmail = NormalizeEmail(request.Email);
        var existing = await userRepository.GetByNormalizedEmailAsync(normalizedEmail, cancellationToken);
        if (existing is not null)
        {
            throw new InvalidOperationException("An account with this email already exists. Please use login.");
        }

        ValidateSignupPassword(request.Password);

        if (!authSettings.OtpEnabled)
        {
            var now = clock.UtcNow;
            var passwordSalt = GenerateRandomBase64(16);
            var user = new UserAccount
            {
                Id = Guid.NewGuid().ToString("N"),
                EmailDisplay = request.Email.Trim(),
                EmailNormalized = normalizedEmail,
                PasswordSalt = passwordSalt,
                PasswordHash = ComputePasswordHash(request.Password.Trim(), passwordSalt),
                PasswordUpdatedAtUtc = now,
                Role = UserRole.Resident,
                Status = UserAccountStatus.TermsPending,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
                Version = 1,
            };

            await userRepository.UpsertAsync(user, cancellationToken);

            return new RequestCodeResponse
            {
                Message = "Signup completed. You can now sign in with email and password.",
                ResendAfterSeconds = 0,
                ExpiresInSeconds = 0,
            };
        }

        return await RequestCodeCoreAsync(
            request.Email,
            ipAddress,
            SignupPurpose,
            cancellationToken,
            request.Password);
    }

    private async Task<RequestCodeResponse> RequestCodeCoreAsync(
        string emailInput,
        string ipAddress,
        string purpose,
        CancellationToken cancellationToken,
        string? signupPassword = null)
    {
        var now = clock.UtcNow;
        var normalizedEmail = NormalizeEmail(emailInput);
        var latestActive = await otpChallengeRepository.GetLatestActiveAsync(normalizedEmail, purpose, cancellationToken);
        var authSettings = await authAccessSettingsProvider.GetEffectiveAsync(cancellationToken);
        var developmentCode = GetDevelopmentOtpCode(normalizedEmail, authSettings);

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
        var sendsLastHour = await otpChallengeRepository.CountCreatedSinceAsync(normalizedEmail, purpose, oneHourAgo, cancellationToken);
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

        await otpChallengeRepository.InvalidateActiveAsync(normalizedEmail, purpose, cancellationToken);

        var code = developmentCode ?? GenerateNumericCode(options.OtpLength);
        var salt = GenerateRandomBase64(16);
        var challenge = new OtpChallenge
        {
            Id = Guid.NewGuid().ToString("N"),
            EmailNormalized = normalizedEmail,
            Purpose = purpose,
            OtpSalt = salt,
            OtpHash = ComputeSecretHash(code, salt),
            CreatedAtUtc = now,
            ExpiresAtUtc = now.AddMinutes(options.OtpExpiryMinutes),
            CooldownUntilUtc = now.AddSeconds(options.ResendCooldownSeconds),
            AttemptCount = 0,
            MaxAttempts = options.MaxVerificationAttempts,
            SignupPasswordSalt = null,
            SignupPasswordHash = null,
            Version = 1,
        };

        if (string.Equals(purpose, SignupPurpose, StringComparison.Ordinal))
        {
            if (string.IsNullOrWhiteSpace(signupPassword))
            {
                throw new InvalidOperationException("Signup password is required for signup OTP challenge.");
            }

            var passwordSalt = GenerateRandomBase64(16);
            challenge.SignupPasswordSalt = passwordSalt;
            challenge.SignupPasswordHash = ComputePasswordHash(signupPassword.Trim(), passwordSalt);
        }

        await otpChallengeRepository.AddAsync(challenge, cancellationToken);

        try
        {
            await emailSender.SendOtpCodeAsync(emailInput.Trim(), code, challenge.ExpiresAtUtc, cancellationToken);
        }
        catch (Exception ex) when (developmentCode is not null)
        {
            logger.LogWarning(
                ex,
                "SMTP delivery failed for email hash {EmailHash}, using development fixed OTP fallback.",
                Sha256Hex(normalizedEmail));
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "OTP delivery failed for email hash {EmailHash} from IP {IP}.",
                Sha256Hex(normalizedEmail),
                ipAddress);

            throw new OtpDeliveryException(
                "We could not deliver the verification code right now. Please try again shortly.",
                ex);
        }

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
        var authSettings = await authAccessSettingsProvider.GetEffectiveAsync(cancellationToken);
        if (!authSettings.OtpEnabled)
        {
            return new VerificationResult
            {
                Response = new VerifyCodeResponse
                {
                    Authenticated = false,
                    UserStatus = UserAccountStatus.EmailUnverified.ToString(),
                    Message = "OTP login is currently disabled. Please sign in with email and password.",
                }
            };
        }

        var normalizedEmail = NormalizeEmail(request.Email);
        var purpose = ResolvePurpose(request.Purpose);
        var challenge = await otpChallengeRepository.GetLatestActiveAsync(normalizedEmail, purpose, cancellationToken);

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

        var user = await userRepository.GetByNormalizedEmailAsync(normalizedEmail, cancellationToken);

        if (user is null)
        {
            if (purpose == SignupPurpose)
            {
                if (string.IsNullOrWhiteSpace(challenge.SignupPasswordSalt)
                    || string.IsNullOrWhiteSpace(challenge.SignupPasswordHash))
                {
                    logger.LogWarning("Signup OTP verify failed due to missing signup password material for email hash {EmailHash} from IP {IP}", Sha256Hex(normalizedEmail), ipAddress);
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

                user = new UserAccount
                {
                    Id = Guid.NewGuid().ToString("N"),
                    EmailDisplay = request.Email.Trim(),
                    EmailNormalized = normalizedEmail,
                    PasswordSalt = challenge.SignupPasswordSalt,
                    PasswordHash = challenge.SignupPasswordHash,
                    PasswordUpdatedAtUtc = now,
                    Role = UserRole.Resident,
                    Status = UserAccountStatus.TermsPending,
                    CreatedAtUtc = now,
                    UpdatedAtUtc = now,
                    Version = 1,
                };
            }
            else if (!ShouldBypassWithLocalFixedOtp(normalizedEmail, authSettings))
            {
                logger.LogWarning("Login OTP verify failed due to missing account for email hash {EmailHash} from IP {IP}", Sha256Hex(normalizedEmail), ipAddress);
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

            user = new UserAccount
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
        }

        if (user.Status is UserAccountStatus.EmailUnverified or UserAccountStatus.EmailVerified)
        {
            user.Status = UserAccountStatus.TermsPending;
        }

        user.UpdatedAtUtc = now;
        user.Version += 1;
        await userRepository.UpsertAsync(user, cancellationToken);

        var (rawToken, expiresAtUtc) = await CreateSessionAsync(user, deviceSummary, cancellationToken);
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
            SessionExpiresAtUtc = expiresAtUtc,
        };
    }

    public async Task<VerificationResult> PasswordLoginAsync(PasswordLoginRequest request, string deviceSummary, string ipAddress, CancellationToken cancellationToken)
    {
        if (!await IsPasswordLoginAllowedAsync(cancellationToken))
        {
            logger.LogInformation("Password login attempt blocked because OTP mode is enabled from IP {IP}.", ipAddress);
            return InvalidPasswordLoginResponse();
        }

        var normalizedEmail = NormalizeEmail(request.Email);
        var user = await userRepository.GetByNormalizedEmailAsync(normalizedEmail, cancellationToken);
        if (user is null || string.IsNullOrWhiteSpace(user.PasswordSalt) || string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return InvalidPasswordLoginResponse();
        }

        var providedHash = ComputePasswordHash((request.Password ?? string.Empty).Trim(), user.PasswordSalt);
        if (!SlowEquals(providedHash, user.PasswordHash))
        {
            return InvalidPasswordLoginResponse();
        }

        if (user.Status is UserAccountStatus.EmailUnverified or UserAccountStatus.EmailVerified)
        {
            user.Status = UserAccountStatus.TermsPending;
            user.UpdatedAtUtc = clock.UtcNow;
            user.Version += 1;
            await userRepository.UpsertAsync(user, cancellationToken);
        }

        var (rawToken, expiresAtUtc) = await CreateSessionAsync(user, deviceSummary, cancellationToken);
        logger.LogInformation("Password login succeeded for email hash {EmailHash} from IP {IP}", Sha256Hex(normalizedEmail), ipAddress);

        return new VerificationResult
        {
            Response = new VerifyCodeResponse
            {
                Authenticated = true,
                UserStatus = user.Status.ToString(),
                Message = "Authentication successful.",
            },
            SessionToken = rawToken,
            SessionExpiresAtUtc = expiresAtUtc,
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

    public async Task<AuthModeResponse> GetAuthModeAsync(CancellationToken cancellationToken)
    {
        var settings = await authAccessSettingsProvider.GetEffectiveAsync(cancellationToken);
        return new AuthModeResponse
        {
            OtpEnabled = settings.OtpEnabled,
        };
    }

    private string? GetDevelopmentOtpCode(string normalizedEmail, AuthAccessRuntimeSettings settings)
    {
        if (!environment.IsDevelopment())
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(settings.FixedOtpCode))
        {
            return null;
        }

        if (ShouldBypassWithLocalFixedOtp(normalizedEmail, settings))
        {
            return settings.FixedOtpCode.Trim();
        }

        return null;
    }

    private bool ShouldBypassWithLocalFixedOtp(string normalizedEmail, AuthAccessRuntimeSettings settings)
    {
        if (!settings.AllowLocalDomainFixedOtp || !environment.IsDevelopment())
        {
            return false;
        }

        var at = normalizedEmail.IndexOf('@');
        if (at < 0 || at == normalizedEmail.Length - 1)
        {
            return false;
        }

        var domain = normalizedEmail[(at + 1)..].ToLowerInvariant();
        return settings.LocalFixedOtpDomains.Any(x => string.Equals(x, domain, StringComparison.OrdinalIgnoreCase));
    }

    private static string ResolvePurpose(string? purpose)
    {
        return string.Equals((purpose ?? string.Empty).Trim(), "signup", StringComparison.OrdinalIgnoreCase)
            ? SignupPurpose
            : LoginPurpose;
    }

    private static void ValidateSignupPassword(string password)
    {
        var trimmed = password?.Trim() ?? string.Empty;
        if (trimmed.Length < 8)
        {
            throw new InvalidOperationException("Password must be at least 8 characters long.");
        }

        var hasUpper = trimmed.Any(char.IsUpper);
        var hasLower = trimmed.Any(char.IsLower);
        var hasDigit = trimmed.Any(char.IsDigit);
        var hasSymbol = trimmed.Any(ch => !char.IsLetterOrDigit(ch));

        if (!hasUpper || !hasLower || !hasDigit || !hasSymbol)
        {
            throw new InvalidOperationException("Password must include uppercase, lowercase, number, and special character.");
        }
    }

    private static string ComputePasswordHash(string password, string salt)
    {
        var saltBytes = Convert.FromBase64String(salt);
        var hashBytes = Rfc2898DeriveBytes.Pbkdf2(password, saltBytes, 100_000, HashAlgorithmName.SHA256, 32);
        return Convert.ToBase64String(hashBytes);
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

    private async Task<(string RawToken, DateTimeOffset ExpiresAtUtc)> CreateSessionAsync(
        UserAccount user,
        string deviceSummary,
        CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
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
        return (rawToken, session.ExpiresAtUtc);
    }

    private async Task<bool> IsPasswordLoginAllowedAsync(CancellationToken cancellationToken)
    {
        var authSettings = await authAccessSettingsProvider.GetEffectiveAsync(cancellationToken);
        return !authSettings.OtpEnabled;
    }

    private static VerificationResult InvalidPasswordLoginResponse()
    {
        return new VerificationResult
        {
            Response = new VerifyCodeResponse
            {
                Authenticated = false,
                UserStatus = UserAccountStatus.EmailUnverified.ToString(),
                Message = "The email or password is invalid.",
            },
        };
    }
}
