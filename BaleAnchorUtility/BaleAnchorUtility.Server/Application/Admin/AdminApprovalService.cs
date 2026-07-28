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
