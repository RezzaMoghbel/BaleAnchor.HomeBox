using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryPaymentRepository : IPaymentRepository
{
    private readonly List<PaymentRecord> payments = [];

    public Task AddAsync(PaymentRecord payment, CancellationToken cancellationToken)
    {
        payments.Add(payment);
        return Task.CompletedTask;
    }

    public Task<PaymentRecord?> GetByIdAsync(string paymentId, CancellationToken cancellationToken)
    {
        var payment = payments.FirstOrDefault(x => string.Equals(x.Id, paymentId, StringComparison.Ordinal));
        return Task.FromResult(payment);
    }

    public Task<PaymentRecord?> GetByUserAndPeriodAsync(
        string userId,
        string periodStartDate,
        string periodEndDateExclusive,
        CancellationToken cancellationToken)
    {
        var payment = payments.FirstOrDefault(x =>
            string.Equals(x.UserId, userId, StringComparison.Ordinal)
            && string.Equals(x.PeriodStartDate, periodStartDate, StringComparison.Ordinal)
            && string.Equals(x.PeriodEndDateExclusive, periodEndDateExclusive, StringComparison.Ordinal));

        return Task.FromResult(payment);
    }

    public Task<PaymentRecord?> GetLatestByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var latest = payments
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderByDescending(x => x.PeriodEndDateExclusive, StringComparer.Ordinal)
            .ThenByDescending(x => x.PaymentDate, StringComparer.Ordinal)
            .ThenByDescending(x => x.UpdatedAtUtc)
            .FirstOrDefault();

        return Task.FromResult(latest);
    }

    public Task<IReadOnlyList<PaymentRecord>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var results = payments
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .OrderBy(x => x.PeriodStartDate, StringComparer.Ordinal)
            .ThenBy(x => x.PaymentDate, StringComparer.Ordinal)
            .ThenBy(x => x.CreatedAtUtc)
            .ToList();

        return Task.FromResult((IReadOnlyList<PaymentRecord>)results);
    }

    public Task DeleteAsync(string paymentId, CancellationToken cancellationToken)
    {
        var index = payments.FindIndex(x => string.Equals(x.Id, paymentId, StringComparison.Ordinal));
        if (index >= 0)
        {
            payments.RemoveAt(index);
        }

        return Task.CompletedTask;
    }
}
