using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Terms;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryTermsAcceptanceRepository : ITermsAcceptanceRepository
{
    private readonly List<TermsAcceptance> acceptances = [];

    public Task<TermsAcceptance?> GetByUserAndVersionAsync(string userId, string termsVersionId, CancellationToken cancellationToken)
    {
        var match = acceptances.FirstOrDefault(x =>
            string.Equals(x.UserId, userId, StringComparison.Ordinal)
            && string.Equals(x.TermsVersionId, termsVersionId, StringComparison.Ordinal));
        return Task.FromResult(match);
    }

    public Task<IReadOnlyList<TermsAcceptance>> GetAllAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult((IReadOnlyList<TermsAcceptance>)acceptances.ToList());
    }

    public Task AddAsync(TermsAcceptance acceptance, CancellationToken cancellationToken)
    {
        acceptances.Add(acceptance);
        return Task.CompletedTask;
    }
}
