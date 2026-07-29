using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Notifications.Dtos;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Domain.Notifications;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Application.Notifications;

public sealed class ReminderDispatchService
{
    private const string ReminderKind = "ReadingReminder";
    private const string EmailChannel = "Email";
    private const string PushChannel = "Push";

    private static readonly int[] ReminderOffsetsInDays = [7, 2, 0];

    private readonly IUserRepository userRepository;
    private readonly INotificationPreferencesRepository preferencesRepository;
    private readonly IPushSubscriptionRepository pushSubscriptionRepository;
    private readonly IReminderDispatchJobRepository reminderDispatchJobRepository;
    private readonly IEmailSender emailSender;
    private readonly IWebPushSender webPushSender;
    private readonly ISystemClock clock;
    private readonly PushNotificationOptions pushOptions;
    private readonly ILogger<ReminderDispatchService> logger;

    public ReminderDispatchService(
        IUserRepository userRepository,
        INotificationPreferencesRepository preferencesRepository,
        IPushSubscriptionRepository pushSubscriptionRepository,
        IReminderDispatchJobRepository reminderDispatchJobRepository,
        IEmailSender emailSender,
        IWebPushSender webPushSender,
        ISystemClock clock,
        IOptions<PushNotificationOptions> pushOptions,
        ILogger<ReminderDispatchService> logger)
    {
        this.userRepository = userRepository;
        this.preferencesRepository = preferencesRepository;
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.reminderDispatchJobRepository = reminderDispatchJobRepository;
        this.emailSender = emailSender;
        this.webPushSender = webPushSender;
        this.clock = clock;
        this.pushOptions = pushOptions.Value;
        this.logger = logger;
    }

    public async Task<int> ScheduleForNextRecommendedDateAsync(
        string userId,
        DateOnly latestSubmittedReadingDate,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User record was not found for this session.");

        await CancelFutureRemindersAsync(userId, cancellationToken);

        var preferences = await GetOrCreatePreferencesAsync(userId, cancellationToken);
        if (!preferences.ReadingReminderEnabled)
        {
            return 0;
        }

        var timeZone = NotificationPreferencesService.ResolveTimeZoneOrThrow(preferences.TimeZoneId);
        var recommendedDate = latestSubmittedReadingDate.AddMonths(1);
        var now = clock.UtcNow;
        var created = 0;

        foreach (var offset in ReminderOffsetsInDays)
        {
            var reminderDate = recommendedDate.AddDays(-offset);
            var scheduledUtc = ConvertLocal9AmDateToUtc(reminderDate, timeZone);
            if (scheduledUtc <= now)
            {
                continue;
            }

            if (preferences.EmailRemindersEnabled)
            {
                created += await EnsureJobAsync(
                    userId,
                    recommendedDate,
                    preferences.TimeZoneId,
                    offset,
                    EmailChannel,
                    scheduledUtc,
                    cancellationToken);
            }

            if (preferences.PushRemindersEnabled)
            {
                created += await EnsureJobAsync(
                    userId,
                    recommendedDate,
                    preferences.TimeZoneId,
                    offset,
                    PushChannel,
                    scheduledUtc,
                    cancellationToken);
            }
        }

        logger.LogInformation(
            "Scheduled {JobCount} reminder jobs for user {UserId}. Recommended reading date: {RecommendedDate}",
            created,
            userId,
            recommendedDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));

        return created;
    }

    public async Task<int> CancelFutureRemindersAsync(string userId, CancellationToken cancellationToken)
    {
        var jobs = await reminderDispatchJobRepository.GetByUserIdAsync(userId, cancellationToken);
        var now = clock.UtcNow;
        var cancelled = 0;

        foreach (var job in jobs)
        {
            if (job.ScheduledForUtc <= now)
            {
                continue;
            }

            if (!string.Equals(job.Status, ReminderStatus.Pending, StringComparison.Ordinal)
                && !string.Equals(job.Status, ReminderStatus.Retrying, StringComparison.Ordinal))
            {
                continue;
            }

            job.Status = ReminderStatus.Cancelled;
            job.NextAttemptAtUtc = null;
            job.UpdatedAtUtc = now;
            job.Version += 1;
            job.AttemptHistory.Add(new ReminderDispatchAttempt
            {
                AttemptedAtUtc = now,
                Outcome = ReminderStatus.Cancelled,
                ErrorCode = "READING_SUBMITTED",
                ErrorMessage = "Future reminder cancelled after reading submission.",
            });

            await reminderDispatchJobRepository.UpsertAsync(job, cancellationToken);
            cancelled += 1;
        }

        return cancelled;
    }

    public async Task<int> DispatchDueAsync(int limit, CancellationToken cancellationToken)
    {
        var due = await reminderDispatchJobRepository.GetDueAsync(clock.UtcNow, limit, cancellationToken);
        var sent = 0;

        foreach (var job in due)
        {
            var now = clock.UtcNow;

            try
            {
                await DispatchSingleJobAsync(job, cancellationToken);

                job.Status = ReminderStatus.Sent;
                job.NextAttemptAtUtc = null;
                job.LastErrorCode = null;
                job.LastErrorMessage = null;
                job.UpdatedAtUtc = now;
                job.Version += 1;
                job.AttemptHistory.Add(new ReminderDispatchAttempt
                {
                    AttemptedAtUtc = now,
                    Outcome = ReminderStatus.Sent,
                });

                await reminderDispatchJobRepository.UpsertAsync(job, cancellationToken);
                sent += 1;
            }
            catch (Exception ex)
            {
                job.AttemptCount += 1;
                job.LastErrorCode = "DISPATCH_FAILED";
                job.LastErrorMessage = ex.Message;
                job.UpdatedAtUtc = now;
                job.Version += 1;

                var deadLetter = job.AttemptCount >= job.MaxAttempts;
                if (deadLetter)
                {
                    job.Status = ReminderStatus.DeadLetter;
                    job.NextAttemptAtUtc = null;
                }
                else
                {
                    job.Status = ReminderStatus.Retrying;
                    job.NextAttemptAtUtc = now.Add(GetBackoff(job.AttemptCount));
                }

                job.AttemptHistory.Add(new ReminderDispatchAttempt
                {
                    AttemptedAtUtc = now,
                    Outcome = deadLetter ? ReminderStatus.DeadLetter : ReminderStatus.Retrying,
                    ErrorCode = "DISPATCH_FAILED",
                    ErrorMessage = ex.Message,
                });

                await reminderDispatchJobRepository.UpsertAsync(job, cancellationToken);
                logger.LogWarning(ex, "Reminder dispatch failed for job {JobId}. Attempt {AttemptCount}/{MaxAttempts}.", job.Id, job.AttemptCount, job.MaxAttempts);
            }
        }

        return sent;
    }

    public async Task<ReminderJobListResponse> GetUserReminderJobsAsync(string userId, CancellationToken cancellationToken)
    {
        _ = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User record was not found for this session.");

        var jobs = await reminderDispatchJobRepository.GetByUserIdAsync(userId, cancellationToken);
        var items = jobs.Select(x => new ReminderJobItemResponse
        {
            JobId = x.Id,
            Kind = x.Kind,
            Channel = x.Channel,
            RecommendedReadingDate = x.RecommendedReadingDate,
            ScheduledForUtc = x.ScheduledForUtc.ToString("O"),
            Status = x.Status,
            AttemptCount = x.AttemptCount,
            MaxAttempts = x.MaxAttempts,
            LastErrorCode = x.LastErrorCode,
            LastErrorMessage = x.LastErrorMessage,
        }).ToList();

        return new ReminderJobListResponse
        {
            UserId = userId,
            Count = items.Count,
            Items = items,
        };
    }

    private async Task DispatchSingleJobAsync(ReminderDispatchJob job, CancellationToken cancellationToken)
    {
        if (string.Equals(job.Channel, EmailChannel, StringComparison.Ordinal))
        {
            var user = await userRepository.GetByIdAsync(job.UserId, cancellationToken)
                ?? throw new InvalidOperationException("User account was not found for reminder dispatch.");

            await emailSender.SendReadingReminderAsync(
                user.EmailDisplay,
                job.RecommendedReadingDate,
                job.TimeZoneId,
                cancellationToken);
            return;
        }

        if (string.Equals(job.Channel, PushChannel, StringComparison.Ordinal))
        {
            var subscriptions = await pushSubscriptionRepository.GetActiveByUserIdAsync(job.UserId, cancellationToken);
            if (subscriptions.Count == 0)
            {
                return;
            }

            var title = "Reading reminder";
            var body = $"Please submit your utility readings on {job.RecommendedReadingDate}.";

            foreach (var subscription in subscriptions)
            {
                await webPushSender.SendReadingReminderAsync(
                    subscription,
                    title,
                    body,
                    pushOptions.ReadingReminderDeepLinkPath,
                    cancellationToken);
            }

            return;
        }

        throw new InvalidOperationException($"Unsupported reminder channel '{job.Channel}'.");
    }

    private async Task<int> EnsureJobAsync(
        string userId,
        DateOnly recommendedDate,
        string timeZoneId,
        int offsetDays,
        string channel,
        DateTimeOffset scheduledUtc,
        CancellationToken cancellationToken)
    {
        var dedupeKey = $"{userId}:{ReminderKind}:{channel}:{recommendedDate:yyyy-MM-dd}:d-{offsetDays}";
        var existing = await reminderDispatchJobRepository.GetByDeduplicationKeyAsync(dedupeKey, cancellationToken);
        if (existing is not null && !string.Equals(existing.Status, ReminderStatus.Cancelled, StringComparison.Ordinal))
        {
            return 0;
        }

        var now = clock.UtcNow;
        var newJob = new ReminderDispatchJob
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            Kind = ReminderKind,
            Channel = channel,
            RecommendedReadingDate = recommendedDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            TimeZoneId = timeZoneId,
            ScheduledForUtc = scheduledUtc,
            NextAttemptAtUtc = scheduledUtc,
            Status = ReminderStatus.Pending,
            AttemptCount = 0,
            MaxAttempts = 5,
            TemplateVersion = "reading-reminder-v1",
            DeduplicationKey = dedupeKey,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        };

        await reminderDispatchJobRepository.UpsertAsync(newJob, cancellationToken);
        return 1;
    }

    private async Task<Domain.Notifications.NotificationPreferences> GetOrCreatePreferencesAsync(string userId, CancellationToken cancellationToken)
    {
        var existing = await preferencesRepository.GetByUserIdAsync(userId, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var now = clock.UtcNow;
        var defaults = new Domain.Notifications.NotificationPreferences
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

    private static DateTimeOffset ConvertLocal9AmDateToUtc(DateOnly date, TimeZoneInfo timeZone)
    {
        var localDateTime = date.ToDateTime(new TimeOnly(9, 0), DateTimeKind.Unspecified);
        var utcDateTime = TimeZoneInfo.ConvertTimeToUtc(localDateTime, timeZone);
        return new DateTimeOffset(utcDateTime, TimeSpan.Zero);
    }

    private static TimeSpan GetBackoff(int attemptCount)
    {
        return attemptCount switch
        {
            <= 1 => TimeSpan.FromMinutes(5),
            2 => TimeSpan.FromMinutes(15),
            3 => TimeSpan.FromMinutes(60),
            4 => TimeSpan.FromMinutes(180),
            _ => TimeSpan.FromHours(12),
        };
    }
}
