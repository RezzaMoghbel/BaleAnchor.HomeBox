namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IAdminUserPurgeRepository
{
    Task<AdminUserPurgeSummary> PurgeUserDataAsync(
        string userId,
        string emailNormalized,
        CancellationToken cancellationToken);
}

public sealed class AdminUserPurgeSummary
{
    public int UsersDeleted { get; init; }
    public int SessionsDeleted { get; init; }
    public int OtpChallengesDeleted { get; init; }
    public int TermsAcceptancesDeleted { get; init; }
    public int UtilitySetupsDeleted { get; init; }
    public int TariffsDeleted { get; init; }
    public int ReadingsDeleted { get; init; }
    public int CalculationSnapshotsDeleted { get; init; }
    public int PaymentsDeleted { get; init; }
    public int StatementExportsDeleted { get; init; }
    public int PushSubscriptionsDeleted { get; init; }
    public int NotificationPreferencesDeleted { get; init; }
    public int ReminderJobsDeleted { get; init; }
    public int TenanciesDeleted { get; init; }
    public int TenantGapsDeleted { get; init; }

    public int TotalDeleted =>
        UsersDeleted
        + SessionsDeleted
        + OtpChallengesDeleted
        + TermsAcceptancesDeleted
        + UtilitySetupsDeleted
        + TariffsDeleted
        + ReadingsDeleted
        + CalculationSnapshotsDeleted
        + PaymentsDeleted
        + StatementExportsDeleted
        + PushSubscriptionsDeleted
        + NotificationPreferencesDeleted
        + ReminderJobsDeleted
        + TenanciesDeleted
        + TenantGapsDeleted;
}