using BaleAnchorUtility.Server.Domain.Admin;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IFlatRepository
{
    Task<FlatRecord?> GetByFlatNumberAsync(string flatNumberNormalized, CancellationToken cancellationToken);
    Task<IReadOnlyList<FlatRecord>> GetAllAsync(CancellationToken cancellationToken);
    Task UpsertAsync(FlatRecord flat, CancellationToken cancellationToken);
}
