using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryBoilerAssumptionVersionRepository : IBoilerAssumptionVersionRepository
{
    private readonly List<BoilerAssumptionVersion> versions = [];

    public Task AddAsync(BoilerAssumptionVersion version, CancellationToken cancellationToken)
    {
        versions.Add(version);
        return Task.CompletedTask;
    }

    public Task<BoilerAssumptionVersion?> GetByUserAndEffectiveFromDateAsync(string userId, string effectiveFromDate, CancellationToken cancellationToken)
    {
        var match = versions.FirstOrDefault(x =>
            string.Equals(x.UserId, userId, StringComparison.Ordinal)
            && string.Equals(x.EffectiveFromDate, effectiveFromDate, StringComparison.Ordinal));

        return Task.FromResult(match);
    }

    public Task<BoilerAssumptionVersion?> GetActiveByUserAndDateAsync(string userId, string onDate, CancellationToken cancellationToken)
    {
        var lookupDate = DateOnly.ParseExact(onDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);

        var active = versions
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .Where(x => DateOnly.ParseExact(x.EffectiveFromDate, "yyyy-MM-dd", CultureInfo.InvariantCulture) <= lookupDate)
            .OrderByDescending(x => DateOnly.ParseExact(x.EffectiveFromDate, "yyyy-MM-dd", CultureInfo.InvariantCulture))
            .ThenByDescending(x => x.UpdatedAtUtc)
            .FirstOrDefault();

        return Task.FromResult(active);
    }

    public Task<IReadOnlyList<BoilerAssumptionVersion>> GetByUserUpToDateAsync(string userId, string onDateInclusive, CancellationToken cancellationToken)
    {
        var lookupDate = DateOnly.ParseExact(onDateInclusive, "yyyy-MM-dd", CultureInfo.InvariantCulture);

        var results = versions
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .Where(x => DateOnly.ParseExact(x.EffectiveFromDate, "yyyy-MM-dd", CultureInfo.InvariantCulture) <= lookupDate)
            .OrderBy(x => DateOnly.ParseExact(x.EffectiveFromDate, "yyyy-MM-dd", CultureInfo.InvariantCulture))
            .ThenBy(x => x.UpdatedAtUtc)
            .ToList();

        return Task.FromResult((IReadOnlyList<BoilerAssumptionVersion>)results);
    }
}
