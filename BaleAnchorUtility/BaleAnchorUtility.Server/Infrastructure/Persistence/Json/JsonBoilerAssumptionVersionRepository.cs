using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonBoilerAssumptionVersionRepository : IBoilerAssumptionVersionRepository
{
    private const string Collection = "BoilerAssumptions";
    private readonly JsonCollectionStore store;

    public JsonBoilerAssumptionVersionRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public Task AddAsync(BoilerAssumptionVersion version, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, version.Id, version, cancellationToken);
    }

    public async Task<BoilerAssumptionVersion?> GetByUserAndEffectiveFromDateAsync(string userId, string effectiveFromDate, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<BoilerAssumptionVersion>(Collection, cancellationToken);

        return all.FirstOrDefault(x =>
            string.Equals(x.UserId, userId, StringComparison.Ordinal)
            && string.Equals(x.EffectiveFromDate, effectiveFromDate, StringComparison.Ordinal)
            && !x.IsDeleted);
    }

    public async Task<BoilerAssumptionVersion?> GetActiveByUserAndDateAsync(string userId, string onDate, CancellationToken cancellationToken)
    {
        var targetDate = DateOnly.ParseExact(onDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        var all = await store.GetAllAsync<BoilerAssumptionVersion>(Collection, cancellationToken);

        return all
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .Where(x => !x.IsDeleted)
            .Where(x => ParseDate(x.EffectiveFromDate) <= targetDate)
            .OrderByDescending(x => ParseDate(x.EffectiveFromDate))
            .ThenByDescending(x => x.UpdatedAtUtc)
            .FirstOrDefault();
    }

    public async Task<IReadOnlyList<BoilerAssumptionVersion>> GetByUserUpToDateAsync(string userId, string onDateInclusive, CancellationToken cancellationToken)
    {
        var targetDate = DateOnly.ParseExact(onDateInclusive, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        var all = await store.GetAllAsync<BoilerAssumptionVersion>(Collection, cancellationToken);

        return all
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .Where(x => !x.IsDeleted)
            .Where(x => ParseDate(x.EffectiveFromDate) <= targetDate)
            .OrderBy(x => ParseDate(x.EffectiveFromDate))
            .ThenBy(x => x.UpdatedAtUtc)
            .ToList();
    }

    private static DateOnly ParseDate(string value)
    {
        return DateOnly.ParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture);
    }
}
