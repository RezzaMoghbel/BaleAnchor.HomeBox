using System.Net.Mail;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Application.Admin.Dtos;
using BaleAnchorUtility.Server.Domain.Audit;
using BaleAnchorUtility.Server.Domain.System;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Admin;

public sealed class AdminSystemSettingsService
{
    private readonly IEmailTransportRuntimeSettingsRepository settingsRepository;
    private readonly IAuthAccessRuntimeSettingsRepository authAccessSettingsRepository;
    private readonly IEmailTransportSettingsProvider emailTransportSettingsProvider;
    private readonly IEmailSender emailSender;
    private readonly ISecretProtector secretProtector;
    private readonly IAuditLogRepository auditLogRepository;
    private readonly ISystemClock clock;
    private readonly ILogger<AdminSystemSettingsService> logger;

    public AdminSystemSettingsService(
        IEmailTransportRuntimeSettingsRepository settingsRepository,
        IAuthAccessRuntimeSettingsRepository authAccessSettingsRepository,
        IEmailTransportSettingsProvider emailTransportSettingsProvider,
        IEmailSender emailSender,
        ISecretProtector secretProtector,
        IAuditLogRepository auditLogRepository,
        ISystemClock clock,
        ILogger<AdminSystemSettingsService> logger)
    {
        this.settingsRepository = settingsRepository;
        this.authAccessSettingsRepository = authAccessSettingsRepository;
        this.emailTransportSettingsProvider = emailTransportSettingsProvider;
        this.emailSender = emailSender;
        this.secretProtector = secretProtector;
        this.auditLogRepository = auditLogRepository;
        this.clock = clock;
        this.logger = logger;
    }

    public async Task<AdminEmailTransportSettingsResponse> GetEmailTransportAsync(CancellationToken cancellationToken)
    {
        var document = await settingsRepository.GetAsync(cancellationToken);
        if (document is null)
        {
            return new AdminEmailTransportSettingsResponse();
        }

        return new AdminEmailTransportSettingsResponse
        {
            Mode = document.Mode,
            FromName = document.FromName,
            FromAddress = document.FromAddress,
            SmtpHost = document.SmtpHost,
            SmtpPort = document.SmtpPort,
            SmtpUseSsl = document.SmtpUseSsl,
            SmtpUsername = document.SmtpUsername,
            HasSmtpPassword = !string.IsNullOrWhiteSpace(document.SmtpPasswordCiphertext),
            UpdatedByUserId = string.IsNullOrWhiteSpace(document.UpdatedByUserId) ? null : document.UpdatedByUserId,
            UpdatedAtUtc = document.UpdatedAtUtc == default ? null : document.UpdatedAtUtc.ToString("O"),
        };
    }

    public async Task<AdminEmailTransportSettingsResponse> UpdateEmailTransportAsync(
        UserAccount actor,
        UpdateAdminEmailTransportSettingsRequest request,
        CancellationToken cancellationToken)
    {
        var mode = NormalizeMode(request.Mode);
        var fromName = RequireLength(request.FromName, 1, 120, nameof(request.FromName), "From name is required and must be between 1 and 120 characters.");
        var fromAddress = ValidateEmail(request.FromAddress, nameof(request.FromAddress), "From address must be a valid email address.");

        var existing = await settingsRepository.GetAsync(cancellationToken);
        var now = clock.UtcNow;

        var document = existing ?? new EmailTransportRuntimeSettingsDocument
        {
            Id = EmailTransportRuntimeSettingsDocument.DocumentId,
            Version = 0,
        };

        document.Mode = mode;
        document.FromName = fromName;
        document.FromAddress = fromAddress;
        var smtpPasswordUpdated = false;

        if (mode == "smtp")
        {
            document.SmtpHost = RequireLength(request.SmtpHost, 1, 200, nameof(request.SmtpHost), "SMTP host is required when mode is smtp.");
            if (request.SmtpPort is < 1 or > 65535)
            {
                throw new ArgumentException("SMTP port must be between 1 and 65535.", nameof(request.SmtpPort));
            }

            document.SmtpPort = request.SmtpPort;
            document.SmtpUseSsl = request.SmtpUseSsl;
            document.SmtpUsername = RequireLength(request.SmtpUsername, 1, 200, nameof(request.SmtpUsername), "SMTP username is required when mode is smtp.");

            if (!string.IsNullOrWhiteSpace(request.SmtpPassword))
            {
                document.SmtpPasswordCiphertext = secretProtector.Protect(request.SmtpPassword.Trim());
                smtpPasswordUpdated = true;
            }
            else if (string.IsNullOrWhiteSpace(document.SmtpPasswordCiphertext))
            {
                throw new ArgumentException("SMTP password is required when mode is smtp.", nameof(request.SmtpPassword));
            }
        }
        else
        {
            document.SmtpHost = string.IsNullOrWhiteSpace(request.SmtpHost) ? document.SmtpHost : request.SmtpHost.Trim();
            document.SmtpPort = request.SmtpPort is < 1 or > 65535 ? document.SmtpPort : request.SmtpPort;
            document.SmtpUseSsl = request.SmtpUseSsl;
            document.SmtpUsername = string.IsNullOrWhiteSpace(request.SmtpUsername) ? document.SmtpUsername : request.SmtpUsername.Trim();
        }

        document.UpdatedByUserId = actor.Id;
        document.UpdatedAtUtc = now;
        document.Version += 1;

        await settingsRepository.UpsertAsync(document, cancellationToken);
        var reason = ResolveOptionalReason(
            request.Reason,
            BuildEmailTransportReason(existing, document, smtpPasswordUpdated));

        await auditLogRepository.AddAsync(
            new AuditLogEntry
            {
                Id = Guid.NewGuid().ToString("N"),
                ActorUserId = actor.Id,
                TargetUserId = actor.Id,
                Category = "ADMIN_SYSTEM_SETTINGS",
                Action = "UPDATE_EMAIL_TRANSPORT",
                Reason = reason,
                Metadata = $"mode:{document.Mode};host:{document.SmtpHost};port:{document.SmtpPort};ssl:{document.SmtpUseSsl};username:{document.SmtpUsername};passwordUpdated:{smtpPasswordUpdated}",
                CreatedAtUtc = now,
                Version = 1,
            },
            cancellationToken);

        return new AdminEmailTransportSettingsResponse
        {
            Mode = document.Mode,
            FromName = document.FromName,
            FromAddress = document.FromAddress,
            SmtpHost = document.SmtpHost,
            SmtpPort = document.SmtpPort,
            SmtpUseSsl = document.SmtpUseSsl,
            SmtpUsername = document.SmtpUsername,
            HasSmtpPassword = !string.IsNullOrWhiteSpace(document.SmtpPasswordCiphertext),
            UpdatedByUserId = document.UpdatedByUserId,
            UpdatedAtUtc = document.UpdatedAtUtc.ToString("O"),
        };
    }

    public async Task<AdminAuthAccessSettingsResponse> GetAuthAccessAsync(CancellationToken cancellationToken)
    {
        var document = await authAccessSettingsRepository.GetAsync(cancellationToken);
        if (document is null)
        {
            return new AdminAuthAccessSettingsResponse
            {
                OtpEnabled = true,
                AllowLocalDomainFixedOtp = false,
                FixedOtpCode = "123456",
                LocalFixedOtpDomains = ["baleanchor.local"],
            };
        }

        return new AdminAuthAccessSettingsResponse
        {
            OtpEnabled = document.OtpEnabled,
            AllowLocalDomainFixedOtp = document.AllowLocalDomainFixedOtp,
            FixedOtpCode = string.IsNullOrWhiteSpace(document.FixedOtpCode) ? "123456" : document.FixedOtpCode,
            LocalFixedOtpDomains = document.LocalFixedOtpDomains,
            UpdatedByUserId = string.IsNullOrWhiteSpace(document.UpdatedByUserId) ? null : document.UpdatedByUserId,
            UpdatedAtUtc = document.UpdatedAtUtc == default ? null : document.UpdatedAtUtc.ToString("O"),
        };
    }

    public async Task<AdminAuthAccessSettingsResponse> UpdateAuthAccessAsync(
        UserAccount actor,
        UpdateAdminAuthAccessSettingsRequest request,
        CancellationToken cancellationToken)
    {
        var fixedOtpCode = RequireLength(request.FixedOtpCode, 4, 8, nameof(request.FixedOtpCode), "Fixed OTP code must be between 4 and 8 characters.");

        var domains = (request.LocalFixedOtpDomains ?? [])
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim().ToLowerInvariant())
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (domains.Length == 0)
        {
            domains = ["baleanchor.local"];
        }

        var now = clock.UtcNow;
        var document = await authAccessSettingsRepository.GetAsync(cancellationToken)
            ?? new Domain.System.AuthAccessRuntimeSettingsDocument
            {
                Id = Domain.System.AuthAccessRuntimeSettingsDocument.DocumentId,
                Version = 0,
            };

        document.OtpEnabled = request.OtpEnabled;
        document.AllowLocalDomainFixedOtp = request.AllowLocalDomainFixedOtp;
        document.FixedOtpCode = fixedOtpCode;
        document.LocalFixedOtpDomains = domains;
        document.UpdatedByUserId = actor.Id;
        document.UpdatedAtUtc = now;
        document.Version += 1;

        await authAccessSettingsRepository.UpsertAsync(document, cancellationToken);
        var reason = ResolveOptionalReason(
            request.Reason,
            BuildAuthAccessReason(document.OtpEnabled, document.AllowLocalDomainFixedOtp));

        await auditLogRepository.AddAsync(
            new AuditLogEntry
            {
                Id = Guid.NewGuid().ToString("N"),
                ActorUserId = actor.Id,
                TargetUserId = actor.Id,
                Category = "ADMIN_SYSTEM_SETTINGS",
                Action = "UPDATE_AUTH_ACCESS",
                Reason = reason,
                Metadata = $"otpEnabled:{document.OtpEnabled};allowLocalFixedOtp:{document.AllowLocalDomainFixedOtp};domains:{string.Join(',', document.LocalFixedOtpDomains)}",
                CreatedAtUtc = now,
                Version = 1,
            },
            cancellationToken);

        return new AdminAuthAccessSettingsResponse
        {
            OtpEnabled = document.OtpEnabled,
            AllowLocalDomainFixedOtp = document.AllowLocalDomainFixedOtp,
            FixedOtpCode = document.FixedOtpCode,
            LocalFixedOtpDomains = document.LocalFixedOtpDomains,
            UpdatedByUserId = document.UpdatedByUserId,
            UpdatedAtUtc = document.UpdatedAtUtc.ToString("O"),
        };
    }

    public async Task<AdminEmailTransportTestResponse> SendEmailTransportTestAsync(
        UserAccount actor,
        SendAdminEmailTransportTestRequest request,
        CancellationToken cancellationToken)
    {
        var testEmail = ValidateEmail(request.Email, nameof(request.Email), "A valid target email address is required.");
        var effective = await emailTransportSettingsProvider.GetEffectiveAsync(cancellationToken);

        if (!string.Equals(effective.Mode, "smtp", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Email mode must be smtp before sending a transport test email.");
        }

        var now = clock.UtcNow;
        try
        {
            await emailSender.SendReadingReminderAsync(
                testEmail,
                now.ToString("yyyy-MM-dd"),
                "Europe/London",
                cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "SMTP transport test failed for {Email}.", testEmail);
            throw new OtpDeliveryException("SMTP test email could not be delivered. Check sender mailbox, recipient mailbox, and SMTP credentials.", ex);
        }

        var reason = ResolveOptionalReason(request.Reason, BuildEmailTransportTestReason(testEmail));

        await auditLogRepository.AddAsync(
            new AuditLogEntry
            {
                Id = Guid.NewGuid().ToString("N"),
                ActorUserId = actor.Id,
                TargetUserId = actor.Id,
                Category = "ADMIN_SYSTEM_SETTINGS",
                Action = "SEND_EMAIL_TRANSPORT_TEST",
                Reason = reason,
                Metadata = $"mode:{effective.Mode};email:{testEmail}",
                CreatedAtUtc = now,
                Version = 1,
            },
            cancellationToken);

        return new AdminEmailTransportTestResponse
        {
            Email = testEmail,
            Mode = effective.Mode,
            Message = "SMTP test email sent.",
        };
    }

    private static string NormalizeMode(string mode)
    {
        var normalized = (mode ?? string.Empty).Trim().ToLowerInvariant();
        if (normalized is not ("smtp" or "log" or "off"))
        {
            throw new ArgumentException("Mode must be one of: smtp, log, off.", nameof(mode));
        }

        return normalized;
    }

    private static string ValidateEmail(string value, string paramName, string error)
    {
        var trimmed = value?.Trim() ?? string.Empty;
        try
        {
            _ = new MailAddress(trimmed);
            return trimmed;
        }
        catch
        {
            throw new ArgumentException(error, paramName);
        }
    }

    private static string RequireLength(string value, int min, int max, string paramName, string error)
    {
        var trimmed = value?.Trim() ?? string.Empty;
        if (trimmed.Length < min || trimmed.Length > max)
        {
            throw new ArgumentException(error, paramName);
        }

        return trimmed;
    }

    private static string ResolveOptionalReason(string? providedReason, string generatedReason)
    {
        var trimmed = providedReason?.Trim();
        if (!string.IsNullOrWhiteSpace(trimmed) && trimmed.Length >= 3 && trimmed.Length <= 240)
        {
            return trimmed;
        }

        return generatedReason;
    }

    private static string BuildEmailTransportReason(
        EmailTransportRuntimeSettingsDocument? previous,
        EmailTransportRuntimeSettingsDocument current,
        bool smtpPasswordUpdated)
    {
        var changes = new List<string>();

        if (previous is null)
        {
            changes.Add("initial email transport setup");
        }

        if (previous is null || !string.Equals(previous.Mode, current.Mode, StringComparison.Ordinal))
        {
            changes.Add($"mode set to {current.Mode}");
        }

        if (previous is null || !string.Equals(previous.FromAddress, current.FromAddress, StringComparison.OrdinalIgnoreCase))
        {
            changes.Add("from address updated");
        }

        if (string.Equals(current.Mode, "smtp", StringComparison.Ordinal))
        {
            if (previous is null || !string.Equals(previous.SmtpHost, current.SmtpHost, StringComparison.OrdinalIgnoreCase))
            {
                changes.Add("smtp host updated");
            }

            if (previous is null || previous.SmtpPort != current.SmtpPort)
            {
                changes.Add("smtp port updated");
            }

            if (previous is null || previous.SmtpUseSsl != current.SmtpUseSsl)
            {
                changes.Add("smtp ssl flag updated");
            }

            if (previous is null || !string.Equals(previous.SmtpUsername, current.SmtpUsername, StringComparison.OrdinalIgnoreCase))
            {
                changes.Add("smtp username updated");
            }

            if (smtpPasswordUpdated)
            {
                changes.Add("smtp password rotated");
            }
        }

        if (changes.Count == 0)
        {
            changes.Add("email transport settings saved");
        }

        return $"System settings update: {string.Join(", ", changes)}.";
    }

    private static string BuildAuthAccessReason(bool otpEnabled, bool allowLocalFixedOtp)
    {
        var otpState = otpEnabled ? "enabled" : "disabled";
        var localFixedOtpState = allowLocalFixedOtp ? "enabled" : "disabled";
        return $"System settings update: OTP {otpState}; local fixed OTP {localFixedOtpState}.";
    }

    private static string BuildEmailTransportTestReason(string testEmail)
    {
        return $"System settings action: SMTP test sent to {testEmail}.";
    }
}
