using BaleAnchorUtility.Server.Domain.Calculations;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface ICalculationSnapshotRepository
{
    Task AddAsync(CalculationSnapshot snapshot, CancellationToken cancellationToken);
    Task DeleteByUserAndPeriodEndDateAsync(string userId, string periodEndDateExclusive, CancellationToken cancellationToken);
    Task<CalculationSnapshot?> GetLatestByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<CalculationSnapshot>> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task<CalculationSnapshot?> GetByIdAsync(string snapshotId, CancellationToken cancellationToken);
    Task<CalculationSnapshot?> GetByUserAndPeriodAsync(
        string userId,
        string periodStartDate,
        string periodEndDateExclusive,
        CancellationToken cancellationToken);
}
