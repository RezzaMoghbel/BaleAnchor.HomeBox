using BaleAnchorUtility.Server.Application.Admin;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.Extensions.Logging.Abstractions;

namespace BaleAnchorUtility.Server.Tests;

public sealed class AdminApprovalServiceTests
{
    [Fact]
    public async Task ApproveAsync_ChangesStatusToActive_AndWritesAuditLog()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateUser("u-pending", "pending@example.com", UserAccountStatus.PendingApproval));

        var auditLogs = new InMemoryAuditLogRepository();
        var clock = new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-28T10:00:00Z") };
        var service = new AdminApprovalService(users, auditLogs, clock, NullLogger<AdminApprovalService>.Instance);

        var result = await service.ApproveAsync("admin-1", "u-pending", "Approved after review", CancellationToken.None);

        Assert.Equal("u-pending", result.UserId);
        Assert.Equal("Active", result.NewStatus);

        var user = await users.GetByIdAsync("u-pending", CancellationToken.None);
        Assert.NotNull(user);
        Assert.Equal(UserAccountStatus.Active, user!.Status);

        Assert.Single(auditLogs.Entries);
        var audit = auditLogs.Entries[0];
        Assert.Equal("ADMIN_APPROVAL", audit.Category);
        Assert.Equal("APPROVE", audit.Action);
        Assert.Equal("admin-1", audit.ActorUserId);
        Assert.Equal("u-pending", audit.TargetUserId);
        Assert.Equal("status:Active", audit.Metadata);
    }

    [Fact]
    public async Task ApproveAsync_ThrowsForShortReason()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateUser("u-pending", "pending@example.com", UserAccountStatus.PendingApproval));

        var service = new AdminApprovalService(
            users,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<AdminApprovalService>.Instance);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.ApproveAsync("admin-1", "u-pending", " x ", CancellationToken.None));
    }

    [Fact]
    public async Task RejectAsync_ThrowsWhenUserNotPending()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateUser("u-active", "active@example.com", UserAccountStatus.Active));

        var service = new AdminApprovalService(
            users,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<AdminApprovalService>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RejectAsync("admin-1", "u-active", "Invalid state", CancellationToken.None));
    }

    private static UserAccount CreateUser(string id, string email, UserAccountStatus status)
    {
        return new UserAccount
        {
            Id = id,
            EmailDisplay = email,
            EmailNormalized = email.ToUpperInvariant(),
            Role = UserRole.Resident,
            Status = status,
            CreatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            UpdatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            Version = 1,
        };
    }
}
