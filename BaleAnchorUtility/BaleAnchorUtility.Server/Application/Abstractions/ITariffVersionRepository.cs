using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface ITariffVersionRepository
{
    Task AddAsync(TariffVersion version, CancellationToken cancellationToken);
    Task<TariffVersion?> GetByUserAndEffectiveFromDateAsync(string userId, string effectiveFromDate, CancellationToken cancellationToken);
    Task<TariffVersion?> GetActiveByUserAndDateAsync(string userId, string onDate, CancellationToken cancellationToken);
    Task<IReadOnlyList<TariffVersion>> GetByUserUpToDateAsync(string userId, string onDateInclusive, CancellationToken cancellationToken);
}
