using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.System;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Infrastructure.Startup;

public sealed class SystemSettingsBootstrapHostedService : IHostedService
{
    private const string SuperAdminEmail = "info@moghbel.co.uk";
    private const string SuperAdminPasswordSalt = "IKX2MSFOc9tydrj888uoQQ==";
    private const string SuperAdminPasswordHash = "QtkNSDKqLyC2PrfH5vfuFEIN9z9kpIukfSwJSbPXdwA=";

    private readonly IServiceProvider serviceProvider;
    private readonly ILogger<SystemSettingsBootstrapHostedService> logger;

    public SystemSettingsBootstrapHostedService(
        IServiceProvider serviceProvider,
        ILogger<SystemSettingsBootstrapHostedService> logger)
    {
        this.serviceProvider = serviceProvider;
        this.logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = serviceProvider.CreateScope();
        var authSettingsRepository = scope.ServiceProvider.GetRequiredService<IAuthAccessRuntimeSettingsRepository>();
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();

        var now = DateTimeOffset.UtcNow;

        var authSettings = await authSettingsRepository.GetAsync(cancellationToken)
            ?? new AuthAccessRuntimeSettingsDocument
            {
                Id = AuthAccessRuntimeSettingsDocument.DocumentId,
                Version = 0,
            };

        if (authSettings.Version == 0)
        {
            authSettings.OtpEnabled = true;
            authSettings.AllowLocalDomainFixedOtp = true;
            authSettings.FixedOtpCode = "123456";
            authSettings.LocalFixedOtpDomains = ["baleanchor.local"];
            authSettings.UpdatedByUserId = "system-bootstrap";
            authSettings.UpdatedAtUtc = now;
            authSettings.Version = 1;

            await authSettingsRepository.UpsertAsync(authSettings, cancellationToken);
            logger.LogInformation("Bootstrapped auth-access system settings in Database/Collections/SystemSettings.");
        }

        var normalizedEmail = Application.Auth.AuthService.NormalizeEmail(SuperAdminEmail);
        var existing = await userRepository.GetByNormalizedEmailAsync(normalizedEmail, cancellationToken);

        if (existing is null)
        {
            var user = new UserAccount
            {
                Id = "seed-superadmin-live-0001",
                EmailDisplay = SuperAdminEmail,
                EmailNormalized = normalizedEmail,
                PasswordSalt = SuperAdminPasswordSalt,
                PasswordHash = SuperAdminPasswordHash,
                PasswordUpdatedAtUtc = now,
                Role = UserRole.SuperAdmin,
                Status = UserAccountStatus.Active,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
                Version = 1,
            };

            await userRepository.UpsertAsync(user, cancellationToken);
            logger.LogInformation("Bootstrapped superadmin account for {Email} in Users collection.", SuperAdminEmail);
            return;
        }

        // Keep role and password fields aligned with requested baseline account.
        existing.EmailDisplay = SuperAdminEmail;
        existing.PasswordSalt = SuperAdminPasswordSalt;
        existing.PasswordHash = SuperAdminPasswordHash;
        existing.PasswordUpdatedAtUtc = now;
        existing.Role = UserRole.SuperAdmin;
        if (existing.Status is UserAccountStatus.EmailUnverified or UserAccountStatus.EmailVerified)
        {
            existing.Status = UserAccountStatus.Active;
        }

        existing.UpdatedAtUtc = now;
        existing.Version += 1;
        await userRepository.UpsertAsync(existing, cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
