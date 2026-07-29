using BaleAnchorUtility.Server.Domain.Admin;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface ITenancyRepository
{
    Task<TenancyRecord?> GetByIdAsync(string tenancyId, CancellationToken cancellationToken);
    Task<IReadOnlyList<TenancyRecord>> GetByUserIdAsync(string userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<TenancyRecord>> GetByFlatNumberAsync(string flatNumberNormalized, CancellationToken cancellationToken);
    Task<IReadOnlyList<TenancyRecord>> GetAllAsync(CancellationToken cancellationToken);
    Task UpsertAsync(TenancyRecord tenancy, CancellationToken cancellationToken);
}
