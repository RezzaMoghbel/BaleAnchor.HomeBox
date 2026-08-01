using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IBoilerAssumptionVersionRepository
{
    Task AddAsync(BoilerAssumptionVersion version, CancellationToken cancellationToken);
    Task<BoilerAssumptionVersion?> GetByUserAndEffectiveFromDateAsync(string userId, string effectiveFromDate, CancellationToken cancellationToken);
    Task<BoilerAssumptionVersion?> GetActiveByUserAndDateAsync(string userId, string onDate, CancellationToken cancellationToken);
    Task<IReadOnlyList<BoilerAssumptionVersion>> GetByUserUpToDateAsync(string userId, string onDateInclusive, CancellationToken cancellationToken);
}
