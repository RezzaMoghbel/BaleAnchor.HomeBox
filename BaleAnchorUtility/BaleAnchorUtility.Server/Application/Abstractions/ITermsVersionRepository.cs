using BaleAnchorUtility.Server.Domain.Terms;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface ITermsVersionRepository
{
    Task<TermsVersion?> GetActiveAsync(CancellationToken cancellationToken);
    Task<TermsVersion?> GetByIdAsync(string id, CancellationToken cancellationToken);
    Task<IReadOnlyList<TermsVersion>> GetAllAsync(CancellationToken cancellationToken);
    Task UpsertAsync(TermsVersion termsVersion, CancellationToken cancellationToken);
}
