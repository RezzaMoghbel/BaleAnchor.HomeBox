using BaleAnchorUtility.Server.Domain.Terms;

namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface ITermsAcceptanceRepository
{
    Task<TermsAcceptance?> GetByUserAndVersionAsync(string userId, string termsVersionId, CancellationToken cancellationToken);
    Task AddAsync(TermsAcceptance acceptance, CancellationToken cancellationToken);
}
