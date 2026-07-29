using BaleAnchorUtility.Server.Domain.Admin;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface ITenantGapRepository
{
    Task<IReadOnlyList<TenantGapAllocation>> GetByFlatNumberAsync(string flatNumberNormalized, CancellationToken cancellationToken);
    Task<IReadOnlyList<TenantGapAllocation>> GetAllAsync(CancellationToken cancellationToken);
    Task UpsertAsync(TenantGapAllocation allocation, CancellationToken cancellationToken);
}
