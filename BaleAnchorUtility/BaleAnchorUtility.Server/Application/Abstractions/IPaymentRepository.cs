using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IPaymentRepository
{
    Task AddAsync(PaymentRecord payment, CancellationToken cancellationToken);
    Task<PaymentRecord?> GetByIdAsync(string paymentId, CancellationToken cancellationToken);
    Task<PaymentRecord?> GetByUserAndPeriodAsync(
        string userId,
        string periodStartDate,
        string periodEndDateExclusive,
        CancellationToken cancellationToken);
    Task<PaymentRecord?> GetLatestByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<PaymentRecord>> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task DeleteAsync(string paymentId, CancellationToken cancellationToken);
}
