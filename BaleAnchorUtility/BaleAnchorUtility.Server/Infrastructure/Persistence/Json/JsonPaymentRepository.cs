using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonPaymentRepository : IPaymentRepository
{
    private const string Collection = "Payments";
    private readonly JsonCollectionStore store;

    public JsonPaymentRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public Task AddAsync(PaymentRecord payment, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, payment.Id, payment, cancellationToken);
    }

    public async Task<PaymentRecord?> GetByIdAsync(string paymentId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<PaymentRecord>(Collection, cancellationToken);
        return all.FirstOrDefault(x => string.Equals(x.Id, paymentId, StringComparison.Ordinal));
    }

    public async Task<PaymentRecord?> GetByUserAndPeriodAsync(
        string userId,
        string periodStartDate,
        string periodEndDateExclusive,
        CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<PaymentRecord>(Collection, cancellationToken);

        return all
            .Where(x =>
                string.Equals(x.UserId, userId, StringComparison.Ordinal)
                && string.Equals(x.PeriodStartDate, periodStartDate, StringComparison.Ordinal)
                && string.Equals(x.PeriodEndDateExclusive, periodEndDateExclusive, StringComparison.Ordinal))
            .OrderByDescending(x => x.UpdatedAtUtc)
            .FirstOrDefault();
    }

    public async Task<PaymentRecord?> GetLatestByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<PaymentRecord>(Collection, cancellationToken);

        return all
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderByDescending(x => x.PeriodEndDateExclusive ?? string.Empty, StringComparer.Ordinal)
            .ThenByDescending(x => x.PaymentDate, StringComparer.Ordinal)
            .ThenByDescending(x => x.UpdatedAtUtc)
            .FirstOrDefault();
    }

    public async Task<IReadOnlyList<PaymentRecord>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<PaymentRecord>(Collection, cancellationToken);

        var results = all
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderBy(x => x.PeriodStartDate ?? string.Empty, StringComparer.Ordinal)
            .ThenBy(x => x.PaymentDate, StringComparer.Ordinal)
            .ThenBy(x => x.CreatedAtUtc)
            .ToList();

        return results;
    }

    public Task DeleteAsync(string paymentId, CancellationToken cancellationToken)
    {
        return store.DeleteAsync(Collection, paymentId, cancellationToken);
    }
}
