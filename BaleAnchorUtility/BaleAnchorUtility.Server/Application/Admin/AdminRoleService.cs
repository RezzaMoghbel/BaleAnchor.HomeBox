using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Admin.Dtos;
using BaleAnchorUtility.Server.Domain.Audit;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Admin;

public sealed class AdminRoleService
{
    private readonly IUserRepository userRepository;
    private readonly IAuditLogRepository auditLogRepository;
    private readonly ISystemClock clock;
    private readonly ILogger<AdminRoleService> logger;

    public AdminRoleService(
        IUserRepository userRepository,
        IAuditLogRepository auditLogRepository,
        ISystemClock clock,
        ILogger<AdminRoleService> logger)
    {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.clock = clock;
        this.logger = logger;
    }

    public async Task<AdminRoleChangeResponse> ChangeRoleAsync(
        UserAccount actor,
        string targetUserId,
        string requestedRole,
        string reason,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            throw new ArgumentException("A valid target user id is required.", nameof(targetUserId));
        }

        if (string.IsNullOrWhiteSpace(requestedRole) ||
            !Enum.TryParse<UserRole>(requestedRole.Trim(), true, out var newRole))
        {
            throw new ArgumentException("Role must be one of Resident, Admin, or SuperAdmin.", nameof(requestedRole));
        }

        var trimmedReason = reason.Trim();
        if (trimmedReason.Length < 3)
        {
            throw new ArgumentException("A role change reason of at least 3 characters is required.", nameof(reason));
        }

        var target = await userRepository.GetByIdAsync(targetUserId, cancellationToken)
            ?? throw new KeyNotFoundException("The target user could not be found.");

        if (target.Role == newRole)
        {
            throw new InvalidOperationException("The user already has the requested role.");
        }

        if (actor.Role != UserRole.SuperAdmin)
        {
            throw new InvalidOperationException("Only super admins can change user roles.");
        }

        if (string.Equals(actor.Id, target.Id, StringComparison.Ordinal) && newRole != UserRole.SuperAdmin)
        {
            throw new InvalidOperationException("You cannot remove your own SuperAdmin role.");
        }

        var previousRole = target.Role;
        var now = clock.UtcNow;
        target.Role = newRole;
        target.UpdatedAtUtc = now;
        target.Version += 1;

        await userRepository.UpsertAsync(target, cancellationToken);

        var auditEntry = new AuditLogEntry
        {
            Id = Guid.NewGuid().ToString("N"),
            ActorUserId = actor.Id,
            TargetUserId = target.Id,
            Category = "ADMIN_ROLE",
            Action = "CHANGE_ROLE",
            Reason = trimmedReason,
            Metadata = $"from:{previousRole};to:{target.Role}",
            CreatedAtUtc = now,
            Version = 1,
        };

        await auditLogRepository.AddAsync(auditEntry, cancellationToken);

        logger.LogInformation(
            "Admin role change completed. Actor={ActorUserId}, Target={TargetUserId}, PreviousRole={PreviousRole}, NewRole={NewRole}",
            actor.Id,
            target.Id,
            previousRole,
            target.Role);

        return new AdminRoleChangeResponse
        {
            UserId = target.Id,
            PreviousRole = previousRole.ToString(),
            NewRole = target.Role.ToString(),
            Message = "User role updated.",
        };
    }
}
