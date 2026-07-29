using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Notifications.Dtos;
using BaleAnchorUtility.Server.Domain.Audit;
using BaleAnchorUtility.Server.Domain.Notifications;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Notifications;

public sealed class NotificationPreferencesService
{
    private readonly IUserRepository userRepository;
    private readonly INotificationPreferencesRepository preferencesRepository;
    private readonly IAuditLogRepository auditLogRepository;
    private readonly ISystemClock clock;

    public NotificationPreferencesService(
        IUserRepository userRepository,
        INotificationPreferencesRepository preferencesRepository,
        IAuditLogRepository auditLogRepository,
        ISystemClock clock)
    {
        this.userRepository = userRepository;
        this.preferencesRepository = preferencesRepository;
        this.auditLogRepository = auditLogRepository;
        this.clock = clock;
    }

    public async Task<NotificationPreferencesResponse> GetForUserAsync(string userId, CancellationToken cancellationToken)
    {
        _ = await GetActiveUserAsync(userId, cancellationToken);
        var preferences = await GetOrCreateDefaultsAsync(userId, cancellationToken);
        return ToResponse(preferences);
    }

    public async Task<NotificationPreferencesResponse> UpdateForUserAsync(
        string userId,
        UpdateNotificationPreferencesRequest request,
        CancellationToken cancellationToken)
    {
        _ = await GetActiveUserAsync(userId, cancellationToken);

        _ = ResolveTimeZoneOrThrow(request.TimeZoneId);

        var existing = await preferencesRepository.GetByUserIdAsync(userId, cancellationToken);
        var now = clock.UtcNow;

        var preferences = existing ?? new NotificationPreferences
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        };

        preferences.EmailRemindersEnabled = request.EmailRemindersEnabled;
        preferences.PushRemindersEnabled = request.PushRemindersEnabled;
        preferences.ReadingReminderEnabled = request.ReadingReminderEnabled;
        preferences.TimeZoneId = request.TimeZoneId.Trim();
        preferences.UpdatedAtUtc = now;
        preferences.Version = existing is null ? 1 : preferences.Version + 1;

        await preferencesRepository.UpsertAsync(preferences, cancellationToken);
        await auditLogRepository.AddAsync(
            new AuditLogEntry
            {
                Id = Guid.NewGuid().ToString("N"),
                ActorUserId = userId,
                TargetUserId = userId,
                Category = "NOTIFICATIONS",
                Action = existing is null ? "CREATE_REMINDER_PREFERENCES" : "UPDATE_REMINDER_PREFERENCES",
                Reason = "Resident notification preference update",
                Metadata = $"email:{preferences.EmailRemindersEnabled};push:{preferences.PushRemindersEnabled};reading:{preferences.ReadingReminderEnabled};timeZone:{preferences.TimeZoneId}",
                CreatedAtUtc = now,
                Version = 1,
            },
            cancellationToken);

        return ToResponse(preferences);
    }

    public async Task<NotificationPreferences> GetOrCreateDefaultsAsync(string userId, CancellationToken cancellationToken)
    {
        var existing = await preferencesRepository.GetByUserIdAsync(userId, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var now = clock.UtcNow;
        var defaults = new NotificationPreferences
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            EmailRemindersEnabled = true,
            PushRemindersEnabled = false,
            ReadingReminderEnabled = true,
            TimeZoneId = "Europe/London",
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        };

        await preferencesRepository.UpsertAsync(defaults, cancellationToken);
        return defaults;
    }

    public static TimeZoneInfo ResolveTimeZoneOrThrow(string timeZoneId)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId))
        {
            throw new InvalidOperationException("Time-zone ID is required.");
        }

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId.Trim());
        }
        catch (TimeZoneNotFoundException)
        {
            throw new InvalidOperationException("The selected time-zone is not supported on this server.");
        }
        catch (InvalidTimeZoneException)
        {
            throw new InvalidOperationException("The selected time-zone is not valid.");
        }
    }

    private async Task<UserAccount> GetActiveUserAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User record was not found for this session.");

        if (user.Status != UserAccountStatus.Active)
        {
            throw new InvalidOperationException("Only active accounts can manage reminder preferences.");
        }

        return user;
    }

    private static NotificationPreferencesResponse ToResponse(NotificationPreferences preferences)
    {
        return new NotificationPreferencesResponse
        {
            UserId = preferences.UserId,
            EmailRemindersEnabled = preferences.EmailRemindersEnabled,
            PushRemindersEnabled = preferences.PushRemindersEnabled,
            ReadingReminderEnabled = preferences.ReadingReminderEnabled,
            TimeZoneId = preferences.TimeZoneId,
            UpdatedAtUtc = preferences.UpdatedAtUtc.ToString("O"),
        };
    }
}
