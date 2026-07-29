using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Admin;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryTenancyRepository : ITenancyRepository
{
    private readonly List<TenancyRecord> tenancies = [];

    public Task<TenancyRecord?> GetByIdAsync(string tenancyId, CancellationToken cancellationToken)
    {
        var match = tenancies.FirstOrDefault(x => string.Equals(x.Id, tenancyId, StringComparison.Ordinal));
        return Task.FromResult(match);
    }

    public Task<IReadOnlyList<TenancyRecord>> GetByUserIdAsync(string userId, CancellationToken cancellationToken)
    {
        var results = tenancies.Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal)).ToList();
        return Task.FromResult((IReadOnlyList<TenancyRecord>)results);
    }

    public Task<IReadOnlyList<TenancyRecord>> GetByFlatNumberAsync(string flatNumberNormalized, CancellationToken cancellationToken)
    {
        var results = tenancies.Where(x => string.Equals(x.FlatNumberNormalized, flatNumberNormalized, StringComparison.Ordinal)).ToList();
        return Task.FromResult((IReadOnlyList<TenancyRecord>)results);
    }

    public Task<IReadOnlyList<TenancyRecord>> GetAllAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult((IReadOnlyList<TenancyRecord>)tenancies.ToList());
    }

    public Task UpsertAsync(TenancyRecord tenancy, CancellationToken cancellationToken)
    {
        var index = tenancies.FindIndex(x => string.Equals(x.Id, tenancy.Id, StringComparison.Ordinal));
        if (index >= 0)
        {
            tenancies[index] = tenancy;
        }
        else
        {
            tenancies.Add(tenancy);
        }

        return Task.CompletedTask;
    }
}
