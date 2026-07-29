using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Admin;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryFlatRepository : IFlatRepository
{
    private readonly List<FlatRecord> flats = [];

    public Task<FlatRecord?> GetByFlatNumberAsync(string flatNumberNormalized, CancellationToken cancellationToken)
    {
        var match = flats.FirstOrDefault(x =>
            string.Equals(x.FlatNumberNormalized, flatNumberNormalized, StringComparison.Ordinal));
        return Task.FromResult(match);
    }

    public Task<IReadOnlyList<FlatRecord>> GetAllAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult((IReadOnlyList<FlatRecord>)flats.ToList());
    }

    public Task UpsertAsync(FlatRecord flat, CancellationToken cancellationToken)
    {
        var index = flats.FindIndex(x => string.Equals(x.Id, flat.Id, StringComparison.Ordinal));
        if (index >= 0)
        {
            flats[index] = flat;
        }
        else
        {
            flats.Add(flat);
        }

        return Task.CompletedTask;
    }
}
