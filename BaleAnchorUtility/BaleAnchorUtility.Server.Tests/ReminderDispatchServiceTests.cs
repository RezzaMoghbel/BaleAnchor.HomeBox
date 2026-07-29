using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Notifications;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Domain.Notifications;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Tests;

public sealed class ReminderDispatchServiceTests
{
    [Fact]
    public async Task ScheduleForNextRecommendedDateAsync_CreatesExpectedReminderJobs()
    {
        var users = new InMemoryUserRepository();
        users.Seed(new UserAccount
        {
            Id = "u-reminders",
            EmailDisplay = "resident@example.com",
            EmailNormalized = "resident@example.com",
            Status = UserAccountStatus.Active,
            Role = UserRole.Resident,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        });

        var preferencesRepository = new InMemoryNotificationPreferencesRepository();
        await preferencesRepository.UpsertAsync(new NotificationPreferences
        {
            Id = "pref-1",
            UserId = "u-reminders",
            EmailRemindersEnabled = true,
            PushRemindersEnabled = true,
            ReadingReminderEnabled = true,
            TimeZoneId = "UTC",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var jobs = new InMemoryReminderDispatchJobRepository();

        var service = new ReminderDispatchService(
            users,
            preferencesRepository,
            new InMemoryPushSubscriptionRepository(),
            jobs,
            new NoOpEmailSender(),
            new NoOpWebPushSender(),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-08-01T00:00:00Z") },
            Options.Create(new PushNotificationOptions()),
            NullLogger<ReminderDispatchService>.Instance);

        var created = await service.ScheduleForNextRecommendedDateAsync(
            "u-reminders",
            DateOnly.Parse("2026-08-01"),
            CancellationToken.None);

        Assert.Equal(6, created);

        var userJobs = await jobs.GetByUserIdAsync("u-reminders", CancellationToken.None);
        Assert.Equal(6, userJobs.Count);
        Assert.All(userJobs, x => Assert.Equal(ReminderStatus.Pending, x.Status));
    }

    [Fact]
    public async Task DispatchDueAsync_MarksJobsAsSent()
    {
        var users = new InMemoryUserRepository();
        users.Seed(new UserAccount
        {
            Id = "u-dispatch",
            EmailDisplay = "resident.dispatch@example.com",
            EmailNormalized = "resident.dispatch@example.com",
            Status = UserAccountStatus.Active,
            Role = UserRole.Resident,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        });

        var jobs = new InMemoryReminderDispatchJobRepository();
        await jobs.UpsertAsync(new ReminderDispatchJob
        {
            Id = "job-1",
            UserId = "u-dispatch",
            Kind = "ReadingReminder",
            Channel = "Email",
            RecommendedReadingDate = "2026-09-01",
            TimeZoneId = "UTC",
            ScheduledForUtc = DateTimeOffset.Parse("2026-08-20T09:00:00Z"),
            NextAttemptAtUtc = DateTimeOffset.Parse("2026-08-20T09:00:00Z"),
            Status = ReminderStatus.Pending,
            AttemptCount = 0,
            MaxAttempts = 5,
            TemplateVersion = "reading-reminder-v1",
            DeduplicationKey = "k1",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var service = new ReminderDispatchService(
            users,
            new InMemoryNotificationPreferencesRepository(),
            new InMemoryPushSubscriptionRepository(),
            jobs,
            new NoOpEmailSender(),
            new NoOpWebPushSender(),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-08-20T10:00:00Z") },
            Options.Create(new PushNotificationOptions()),
            NullLogger<ReminderDispatchService>.Instance);

        var sent = await service.DispatchDueAsync(20, CancellationToken.None);
        Assert.Equal(1, sent);

        var userJobs = await jobs.GetByUserIdAsync("u-dispatch", CancellationToken.None);
        Assert.Equal(ReminderStatus.Sent, userJobs[0].Status);
        Assert.Single(userJobs[0].AttemptHistory);
    }

    [Fact]
    public async Task DispatchDueAsync_SetsRetryBackoff_OnFirstFailure()
    {
        var users = new InMemoryUserRepository();
        users.Seed(new UserAccount
        {
            Id = "u-retry",
            EmailDisplay = "resident.retry@example.com",
            EmailNormalized = "resident.retry@example.com",
            Status = UserAccountStatus.Active,
            Role = UserRole.Resident,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        });

        var now = DateTimeOffset.Parse("2026-08-20T10:00:00Z");
        var jobs = new InMemoryReminderDispatchJobRepository();
        await jobs.UpsertAsync(new ReminderDispatchJob
        {
            Id = "job-retry-1",
            UserId = "u-retry",
            Kind = "ReadingReminder",
            Channel = "Email",
            RecommendedReadingDate = "2026-09-01",
            TimeZoneId = "UTC",
            ScheduledForUtc = now.AddMinutes(-1),
            NextAttemptAtUtc = now.AddMinutes(-1),
            Status = ReminderStatus.Pending,
            AttemptCount = 0,
            MaxAttempts = 5,
            TemplateVersion = "reading-reminder-v1",
            DeduplicationKey = "retry-key",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var service = new ReminderDispatchService(
            users,
            new InMemoryNotificationPreferencesRepository(),
            new InMemoryPushSubscriptionRepository(),
            jobs,
            new ThrowingEmailSender(),
            new NoOpWebPushSender(),
            new FakeSystemClock { UtcNow = now },
            Options.Create(new PushNotificationOptions()),
            NullLogger<ReminderDispatchService>.Instance);

        var sent = await service.DispatchDueAsync(20, CancellationToken.None);
        Assert.Equal(0, sent);

        var userJobs = await jobs.GetByUserIdAsync("u-retry", CancellationToken.None);
        var job = Assert.Single(userJobs);

        Assert.Equal(ReminderStatus.Retrying, job.Status);
        Assert.Equal(1, job.AttemptCount);
        Assert.Equal(now.AddMinutes(5), job.NextAttemptAtUtc);
        Assert.Single(job.AttemptHistory);
        Assert.Equal(ReminderStatus.Retrying, job.AttemptHistory[0].Outcome);
    }

    [Fact]
    public async Task DispatchDueAsync_MarksDeadLetter_WhenMaxAttemptsReached()
    {
        var users = new InMemoryUserRepository();
        users.Seed(new UserAccount
        {
            Id = "u-deadletter",
            EmailDisplay = "resident.deadletter@example.com",
            EmailNormalized = "resident.deadletter@example.com",
            Status = UserAccountStatus.Active,
            Role = UserRole.Resident,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        });

        var now = DateTimeOffset.Parse("2026-08-20T10:00:00Z");
        var jobs = new InMemoryReminderDispatchJobRepository();
        await jobs.UpsertAsync(new ReminderDispatchJob
        {
            Id = "job-dead-1",
            UserId = "u-deadletter",
            Kind = "ReadingReminder",
            Channel = "Email",
            RecommendedReadingDate = "2026-09-01",
            TimeZoneId = "UTC",
            ScheduledForUtc = now.AddMinutes(-1),
            NextAttemptAtUtc = now.AddMinutes(-1),
            Status = ReminderStatus.Retrying,
            AttemptCount = 4,
            MaxAttempts = 5,
            TemplateVersion = "reading-reminder-v1",
            DeduplicationKey = "dead-key",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var service = new ReminderDispatchService(
            users,
            new InMemoryNotificationPreferencesRepository(),
            new InMemoryPushSubscriptionRepository(),
            jobs,
            new ThrowingEmailSender(),
            new NoOpWebPushSender(),
            new FakeSystemClock { UtcNow = now },
            Options.Create(new PushNotificationOptions()),
            NullLogger<ReminderDispatchService>.Instance);

        var sent = await service.DispatchDueAsync(20, CancellationToken.None);
        Assert.Equal(0, sent);

        var userJobs = await jobs.GetByUserIdAsync("u-deadletter", CancellationToken.None);
        var job = Assert.Single(userJobs);

        Assert.Equal(ReminderStatus.DeadLetter, job.Status);
        Assert.Equal(5, job.AttemptCount);
        Assert.Null(job.NextAttemptAtUtc);
        Assert.Single(job.AttemptHistory);
        Assert.Equal(ReminderStatus.DeadLetter, job.AttemptHistory[0].Outcome);
    }

    private sealed class ThrowingEmailSender : IEmailSender
    {
        public Task SendOtpCodeAsync(string email, string code, DateTimeOffset expiresAtUtc, CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }

        public Task SendReadingReminderAsync(string email, string recommendedReadingDate, string timeZoneId, CancellationToken cancellationToken)
        {
            throw new InvalidOperationException("Simulated reminder send failure.");
        }
    }
}
