using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Admin;
using BaleAnchorUtility.Server.Domain.Auth;
using BaleAnchorUtility.Server.Domain.Billing;
using BaleAnchorUtility.Server.Domain.Calculations;
using BaleAnchorUtility.Server.Domain.Notifications;
using BaleAnchorUtility.Server.Domain.Onboarding;
using BaleAnchorUtility.Server.Domain.Terms;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonAdminUserPurgeRepository : IAdminUserPurgeRepository
{
    private readonly JsonCollectionStore store;

    public JsonAdminUserPurgeRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public async Task<AdminUserPurgeSummary> PurgeUserDataAsync(
        string userId,
        string emailNormalized,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = emailNormalized.Trim().ToUpperInvariant();

        return new AdminUserPurgeSummary
        {
            SessionsDeleted = await DeleteByPredicateAsync<AuthSession>(
                "Sessions",
                x => string.Equals(x.UserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            OtpChallengesDeleted = await DeleteByPredicateAsync<OtpChallenge>(
                "OtpChallenges",
                x => string.Equals(x.EmailNormalized, normalizedEmail, StringComparison.OrdinalIgnoreCase),
                x => x.Id,
                cancellationToken),

            TermsAcceptancesDeleted = await DeleteByPredicateAsync<TermsAcceptance>(
                "TermsAcceptances",
                x => string.Equals(x.UserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            UtilitySetupsDeleted = await DeleteByPredicateAsync<UtilitySetupSubmission>(
                "UtilitySetups",
                x => string.Equals(x.UserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            TariffsDeleted = await DeleteByPredicateAsync<TariffVersion>(
                "Tariffs",
                x => string.Equals(x.UserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            ReadingsDeleted = await DeleteByPredicateAsync<ReadingSubmission>(
                "ReadingSubmissions",
                x => string.Equals(x.UserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            CalculationSnapshotsDeleted = await DeleteByPredicateAsync<CalculationSnapshot>(
                "CalculationSnapshots",
                x => string.Equals(x.UserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            PaymentsDeleted = await DeleteByPredicateAsync<PaymentRecord>(
                "Payments",
                x => string.Equals(x.UserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            StatementExportsDeleted = await DeleteByPredicateAsync<StatementExportRecord>(
                "StatementExports",
                x => string.Equals(x.UserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            PushSubscriptionsDeleted = await DeleteByPredicateAsync<PushSubscription>(
                "PushSubscriptions",
                x => string.Equals(x.UserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            NotificationPreferencesDeleted = await DeleteByPredicateAsync<NotificationPreferences>(
                "NotificationPreferences",
                x => string.Equals(x.UserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            ReminderJobsDeleted = await DeleteByPredicateAsync<ReminderDispatchJob>(
                "ReminderDispatchJobs",
                x => string.Equals(x.UserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            TenanciesDeleted = await DeleteByPredicateAsync<TenancyRecord>(
                "Tenancies",
                x => string.Equals(x.UserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            TenantGapsDeleted = await DeleteByPredicateAsync<TenantGapAllocation>(
                "TenantGaps",
                x => string.Equals(x.AssignedUserId, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),

            UsersDeleted = await DeleteByPredicateAsync<UserAccount>(
                "Users",
                x => string.Equals(x.Id, userId, StringComparison.Ordinal),
                x => x.Id,
                cancellationToken),
        };
    }

    private async Task<int> DeleteByPredicateAsync<T>(
        string collectionName,
        Func<T, bool> predicate,
        Func<T, string> idSelector,
        CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<T>(collectionName, cancellationToken);
        var ids = all.Where(predicate).Select(idSelector).Distinct(StringComparer.Ordinal).ToList();

        foreach (var id in ids)
        {
            await store.DeleteAsync(collectionName, id, cancellationToken);
        }

        return ids.Count;
    }
}