using BaleAnchorUtility.Server.Application.Notifications;
using BaleAnchorUtility.Server.Application.Notifications.Dtos;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;

namespace BaleAnchorUtility.Server.Tests;

public sealed class NotificationPreferencesServiceTests
{
    [Fact]
    public async Task GetForUserAsync_ReturnsDefaults_WhenNoExistingRecord()
    {
        var users = new InMemoryUserRepository();
        users.Seed(new UserAccount
        {
            Id = "u1",
            EmailDisplay = "resident@example.com",
            EmailNormalized = "resident@example.com",
            Status = UserAccountStatus.Active,
            Role = UserRole.Resident,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        });

        var service = new NotificationPreferencesService(
            users,
            new InMemoryNotificationPreferencesRepository(),
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-08-01T00:00:00Z") });

        var result = await service.GetForUserAsync("u1", CancellationToken.None);

        Assert.Equal("u1", result.UserId);
        Assert.True(result.EmailRemindersEnabled);
        Assert.False(result.PushRemindersEnabled);
        Assert.True(result.ReadingReminderEnabled);
        Assert.Equal("Europe/London", result.TimeZoneId);
    }

    [Fact]
    public async Task UpdateForUserAsync_PersistsValues()
    {
        var users = new InMemoryUserRepository();
        users.Seed(new UserAccount
        {
            Id = "u2",
            EmailDisplay = "resident2@example.com",
            EmailNormalized = "resident2@example.com",
            Status = UserAccountStatus.Active,
            Role = UserRole.Resident,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        });

        var repository = new InMemoryNotificationPreferencesRepository();
        var audit = new InMemoryAuditLogRepository();

        var service = new NotificationPreferencesService(
            users,
            repository,
            audit,
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-08-01T00:00:00Z") });

        var updated = await service.UpdateForUserAsync(
            "u2",
            new UpdateNotificationPreferencesRequest
            {
                EmailRemindersEnabled = true,
                PushRemindersEnabled = true,
                ReadingReminderEnabled = true,
                TimeZoneId = "UTC",
            },
            CancellationToken.None);

        Assert.True(updated.PushRemindersEnabled);
        Assert.Equal("UTC", updated.TimeZoneId);

        var stored = await repository.GetByUserIdAsync("u2", CancellationToken.None);
        Assert.NotNull(stored);
        Assert.Equal("UTC", stored!.TimeZoneId);
        Assert.True(stored.PushRemindersEnabled);
        Assert.Contains(audit.Entries, x => x.Action == "CREATE_REMINDER_PREFERENCES");
    }
}
