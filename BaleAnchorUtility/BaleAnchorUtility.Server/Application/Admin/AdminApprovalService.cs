using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Admin.Dtos;
using BaleAnchorUtility.Server.Domain.Audit;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Admin;

public sealed class AdminApprovalService
{
    private readonly IUserRepository userRepository;
    private readonly IAuditLogRepository auditLogRepository;
    private readonly ISystemClock clock;
    private readonly ILogger<AdminApprovalService> logger;

    public AdminApprovalService(
        IUserRepository userRepository,
        IAuditLogRepository auditLogRepository,
        ISystemClock clock,
        ILogger<AdminApprovalService> logger)
    {
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.clock = clock;
        this.logger = logger;
    }

    public async Task<PendingApprovalListResponse> GetPendingAsync(CancellationToken cancellationToken)
    {
        var users = await userRepository.GetByStatusAsync(UserAccountStatus.PendingApproval, cancellationToken);
        var items = users
            .OrderByDescending(x => x.UpdatedAtUtc)
            .Select(x => new PendingApprovalUserItem
            {
                UserId = x.Id,
                EmailMasked = MaskEmail(x.EmailNormalized),
                SubmittedState = x.Status.ToString(),
                UpdatedAtUtc = x.UpdatedAtUtc.ToString("O"),
            })
            .ToList();

        return new PendingApprovalListResponse
        {
            Items = items,
            Count = items.Count,
        };
    }

    public Task<AdminDecisionResponse> ApproveAsync(
        string actorUserId,
        string targetUserId,
        string reason,
        CancellationToken cancellationToken)
    {
        return DecideAsync(actorUserId, targetUserId, true, reason, cancellationToken);
    }

    public Task<AdminDecisionResponse> RejectAsync(
        string actorUserId,
        string targetUserId,
        string reason,
        CancellationToken cancellationToken)
    {
        return DecideAsync(actorUserId, targetUserId, false, reason, cancellationToken);
    }

    public Task<AdminDecisionResponse> SuspendAsync(
        string actorUserId,
        string targetUserId,
        string reason,
        CancellationToken cancellationToken)
    {
        return TransitionStatusAsync(
            actorUserId,
            targetUserId,
            UserAccountStatus.Suspended,
            reason,
            "SUSPEND",
            "User suspended.",
            cancellationToken);
    }

    public Task<AdminDecisionResponse> MoveToOnboardingAsync(
        string actorUserId,
        string targetUserId,
        string reason,
        CancellationToken cancellationToken)
    {
        return TransitionStatusAsync(
            actorUserId,
            targetUserId,
            UserAccountStatus.TermsPending,
            reason,
            "MOVE_TO_ONBOARDING",
            "User moved to onboarding.",
            cancellationToken);
    }

    public async Task<AdminDecisionResponse> ReinstateApprovedAsync(
        string actorUserId,
        string targetUserId,
        string reason,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(targetUserId, cancellationToken)
            ?? throw new InvalidOperationException("The target user could not be found.");

        if (user.Status is not (UserAccountStatus.Rejected or UserAccountStatus.Suspended))
        {
            throw new InvalidOperationException("Only rejected or suspended users can be reinstated to active status.");
        }

        return await TransitionStatusCoreAsync(
            actorUserId,
            user,
            UserAccountStatus.Active,
            reason,
            "REINSTATE_APPROVED",
            "User reinstated to active status.",
            cancellationToken);
    }

    public Task<AdminDecisionResponse> ArchiveAsync(
        string actorUserId,
        string targetUserId,
        string reason,
        CancellationToken cancellationToken)
    {
        return TransitionStatusAsync(
            actorUserId,
            targetUserId,
            UserAccountStatus.Archived,
            reason,
            "ARCHIVE",
            "User archived.",
            cancellationToken);
    }

    private async Task<AdminDecisionResponse> DecideAsync(
        string actorUserId,
        string targetUserId,
        bool approve,
        string reason,
        CancellationToken cancellationToken)
    {
        var trimmedReason = reason.Trim();
        if (trimmedReason.Length < 3)
        {
            throw new ArgumentException("A decision reason of at least 3 characters is required.", nameof(reason));
        }

        var user = await userRepository.GetByIdAsync(targetUserId, cancellationToken)
            ?? throw new InvalidOperationException("The target user could not be found.");

        if (user.Status != UserAccountStatus.PendingApproval)
        {
            throw new InvalidOperationException("Only users in PendingApproval state can be reviewed.");
        }

        var now = clock.UtcNow;
        user.Status = approve ? UserAccountStatus.Active : UserAccountStatus.Rejected;
        user.UpdatedAtUtc = now;
        user.Version += 1;

        await userRepository.UpsertAsync(user, cancellationToken);

        var auditEntry = new AuditLogEntry
        {
            Id = Guid.NewGuid().ToString("N"),
            ActorUserId = actorUserId,
            TargetUserId = user.Id,
            Category = "ADMIN_APPROVAL",
            Action = approve ? "APPROVE" : "REJECT",
            Reason = trimmedReason,
            Metadata = $"status:{user.Status}",
            CreatedAtUtc = now,
            Version = 1,
        };

        await auditLogRepository.AddAsync(auditEntry, cancellationToken);

        logger.LogInformation(
            "Admin decision completed. Actor={ActorUserId}, Target={TargetUserId}, Action={Action}",
            actorUserId,
            user.Id,
            auditEntry.Action);

        return new AdminDecisionResponse
        {
            UserId = user.Id,
            NewStatus = user.Status.ToString(),
            Message = approve
                ? "User approved and activated."
                : "User rejected.",
        };
    }

    private async Task<AdminDecisionResponse> TransitionStatusAsync(
        string actorUserId,
        string targetUserId,
        UserAccountStatus newStatus,
        string reason,
        string action,
        string message,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(targetUserId, cancellationToken)
            ?? throw new InvalidOperationException("The target user could not be found.");

        if (user.Status == newStatus)
        {
            throw new InvalidOperationException($"User is already in {newStatus} status.");
        }

        if (newStatus == UserAccountStatus.Archived && user.Role is UserRole.Admin or UserRole.SuperAdmin)
        {
            throw new InvalidOperationException("Admin and SuperAdmin accounts cannot be archived via this operation.");
        }

        if (newStatus == UserAccountStatus.TermsPending && user.Status == UserAccountStatus.Archived)
        {
            throw new InvalidOperationException("Archived users cannot be moved back to onboarding.");
        }

        return await TransitionStatusCoreAsync(
            actorUserId,
            user,
            newStatus,
            reason,
            action,
            message,
            cancellationToken);
    }

    private async Task<AdminDecisionResponse> TransitionStatusCoreAsync(
        string actorUserId,
        UserAccount user,
        UserAccountStatus newStatus,
        string reason,
        string action,
        string message,
        CancellationToken cancellationToken)
    {
        var trimmedReason = reason.Trim();
        if (trimmedReason.Length < 3)
        {
            throw new ArgumentException("A decision reason of at least 3 characters is required.", nameof(reason));
        }

        var now = clock.UtcNow;
        user.Status = newStatus;
        user.UpdatedAtUtc = now;
        user.Version += 1;

        await userRepository.UpsertAsync(user, cancellationToken);

        await auditLogRepository.AddAsync(
            new AuditLogEntry
            {
                Id = Guid.NewGuid().ToString("N"),
                ActorUserId = actorUserId,
                TargetUserId = user.Id,
                Category = "ADMIN_APPROVAL",
                Action = action,
                Reason = trimmedReason,
                Metadata = $"status:{user.Status}",
                CreatedAtUtc = now,
                Version = 1,
            },
            cancellationToken);

        logger.LogInformation(
            "Admin lifecycle action completed. Actor={ActorUserId}, Target={TargetUserId}, Action={Action}, Status={Status}",
            actorUserId,
            user.Id,
            action,
            user.Status);

        return new AdminDecisionResponse
        {
            UserId = user.Id,
            NewStatus = user.Status.ToString(),
            Message = message,
        };
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
}
