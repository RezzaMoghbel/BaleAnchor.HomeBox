using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Terms;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryTermsVersionRepository : ITermsVersionRepository
{
    private readonly List<TermsVersion> versions = [];

    public Task<TermsVersion?> GetActiveAsync(CancellationToken cancellationToken)
    {
        var active = versions
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.UpdatedAtUtc)
            .FirstOrDefault();
        return Task.FromResult(active);
    }

    public Task<TermsVersion?> GetByIdAsync(string id, CancellationToken cancellationToken)
    {
        var match = versions.FirstOrDefault(x => string.Equals(x.Id, id, StringComparison.Ordinal));
        return Task.FromResult(match);
    }

    public Task<IReadOnlyList<TermsVersion>> GetAllAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult((IReadOnlyList<TermsVersion>)versions.ToList());
    }

    public Task UpsertAsync(TermsVersion termsVersion, CancellationToken cancellationToken)
    {
        var index = versions.FindIndex(x => string.Equals(x.Id, termsVersion.Id, StringComparison.Ordinal));
        if (index >= 0)
        {
            versions[index] = termsVersion;
        }
        else
        {
            versions.Add(termsVersion);
        }

        return Task.CompletedTask;
    }
}
