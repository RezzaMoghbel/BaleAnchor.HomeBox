using BaleAnchorUtility.Server.Domain.Calculations;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface ICalculationSnapshotRepository
{
    Task AddAsync(CalculationSnapshot snapshot, CancellationToken cancellationToken);
    Task<CalculationSnapshot?> GetLatestByUserIdAsync(string userId, CancellationToken cancellationToken);
}
