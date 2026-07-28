using BaleAnchorUtility.Server.Application.Admin;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.Extensions.Logging.Abstractions;

namespace BaleAnchorUtility.Server.Tests;

public sealed class AdminRoleServiceTests
{
    [Fact]
    public async Task ChangeRoleAsync_ChangesRole_AndWritesAuditLog()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u-super", "super@example.com", UserRole.SuperAdmin, UserAccountStatus.Active);
        var target = CreateUser("u-target", "target@example.com", UserRole.Resident, UserAccountStatus.Active);
        users.Seed(actor, target);

        var auditLogs = new InMemoryAuditLogRepository();
        var clock = new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-28T10:30:00Z") };
        var service = new AdminRoleService(users, auditLogs, clock, NullLogger<AdminRoleService>.Instance);

        var response = await service.ChangeRoleAsync(
            actor,
            target.Id,
            "Admin",
            "Promotion after verification",
            CancellationToken.None);

        Assert.Equal("Resident", response.PreviousRole);
        Assert.Equal("Admin", response.NewRole);

        var updated = await users.GetByIdAsync(target.Id, CancellationToken.None);
        Assert.NotNull(updated);
        Assert.Equal(UserRole.Admin, updated!.Role);

        Assert.Single(auditLogs.Entries);
        var audit = auditLogs.Entries[0];
        Assert.Equal("ADMIN_ROLE", audit.Category);
        Assert.Equal("CHANGE_ROLE", audit.Action);
        Assert.Equal("u-super", audit.ActorUserId);
        Assert.Equal("u-target", audit.TargetUserId);
        Assert.Equal("from:Resident;to:Admin", audit.Metadata);
    }

    [Fact]
    public async Task ChangeRoleAsync_RejectsNonSuperAdminActor()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u-admin", "admin@example.com", UserRole.Admin, UserAccountStatus.Active);
        var target = CreateUser("u-target", "target@example.com", UserRole.Resident, UserAccountStatus.Active);
        users.Seed(actor, target);

        var service = new AdminRoleService(
            users,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<AdminRoleService>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ChangeRoleAsync(actor, target.Id, "Admin", "Attempted update", CancellationToken.None));
    }

    [Fact]
    public async Task ChangeRoleAsync_RejectsSelfDemotionFromSuperAdmin()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u-super", "super@example.com", UserRole.SuperAdmin, UserAccountStatus.Active);
        users.Seed(actor);

        var service = new AdminRoleService(
            users,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<AdminRoleService>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ChangeRoleAsync(actor, actor.Id, "Admin", "Self downgrade", CancellationToken.None));
    }

    [Fact]
    public async Task ChangeRoleAsync_RejectsUnknownRoleInput()
    {
        var users = new InMemoryUserRepository();
        var actor = CreateUser("u-super", "super@example.com", UserRole.SuperAdmin, UserAccountStatus.Active);
        var target = CreateUser("u-target", "target@example.com", UserRole.Resident, UserAccountStatus.Active);
        users.Seed(actor, target);

        var service = new AdminRoleService(
            users,
            new InMemoryAuditLogRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.UtcNow },
            NullLogger<AdminRoleService>.Instance);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.ChangeRoleAsync(actor, target.Id, "Owner", "Invalid role request", CancellationToken.None));
    }

    private static UserAccount CreateUser(string id, string email, UserRole role, UserAccountStatus status)
    {
        return new UserAccount
        {
            Id = id,
            EmailDisplay = email,
            EmailNormalized = email.ToUpperInvariant(),
            Role = role,
            Status = status,
            CreatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            UpdatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            Version = 1,
        };
    }
}
