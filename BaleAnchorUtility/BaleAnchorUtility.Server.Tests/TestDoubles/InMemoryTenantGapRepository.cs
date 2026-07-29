using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Admin;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryTenantGapRepository : ITenantGapRepository
{
    private readonly List<TenantGapAllocation> gaps = [];

    public void Seed(params TenantGapAllocation[] allocations)
    {
        gaps.AddRange(allocations);
    }

    public Task<IReadOnlyList<TenantGapAllocation>> GetByFlatNumberAsync(string flatNumberNormalized, CancellationToken cancellationToken)
    {
        var results = gaps.Where(x => string.Equals(x.FlatNumberNormalized, flatNumberNormalized, StringComparison.Ordinal)).ToList();
        return Task.FromResult((IReadOnlyList<TenantGapAllocation>)results);
    }

    public Task<IReadOnlyList<TenantGapAllocation>> GetAllAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult((IReadOnlyList<TenantGapAllocation>)gaps.ToList());
    }

    public Task UpsertAsync(TenantGapAllocation allocation, CancellationToken cancellationToken)
    {
        var index = gaps.FindIndex(x => string.Equals(x.Id, allocation.Id, StringComparison.Ordinal));
        if (index >= 0)
        {
            gaps[index] = allocation;
        }
        else
        {
            gaps.Add(allocation);
        }

        return Task.CompletedTask;
    }
}
