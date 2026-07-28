using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class InMemoryTariffVersionRepository : ITariffVersionRepository
{
    private readonly List<TariffVersion> versions = [];

    public Task AddAsync(TariffVersion version, CancellationToken cancellationToken)
    {
        versions.Add(version);
        return Task.CompletedTask;
    }

    public Task<TariffVersion?> GetByUserAndEffectiveFromDateAsync(string userId, string effectiveFromDate, CancellationToken cancellationToken)
    {
        var match = versions.FirstOrDefault(x =>
            string.Equals(x.UserId, userId, StringComparison.Ordinal)
            && string.Equals(x.EffectiveFromDate, effectiveFromDate, StringComparison.Ordinal));

        return Task.FromResult(match);
    }

    public Task<TariffVersion?> GetActiveByUserAndDateAsync(string userId, string onDate, CancellationToken cancellationToken)
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
}
