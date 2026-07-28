using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonTariffVersionRepository : ITariffVersionRepository
{
    private const string Collection = "Tariffs";
    private readonly JsonCollectionStore store;

    public JsonTariffVersionRepository(JsonCollectionStore store)
    {
        this.store = store;
    }

    public Task AddAsync(TariffVersion version, CancellationToken cancellationToken)
    {
        return store.UpsertAsync(Collection, version.Id, version, cancellationToken);
    }

    public async Task<TariffVersion?> GetByUserAndEffectiveFromDateAsync(string userId, string effectiveFromDate, CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<TariffVersion>(Collection, cancellationToken);

        return all.FirstOrDefault(x =>
            string.Equals(x.UserId, userId, StringComparison.Ordinal)
            && string.Equals(x.EffectiveFromDate, effectiveFromDate, StringComparison.Ordinal));
    }

    public async Task<TariffVersion?> GetActiveByUserAndDateAsync(string userId, string onDate, CancellationToken cancellationToken)
    {
        var targetDate = DateOnly.ParseExact(onDate, "yyyy-MM-dd", CultureInfo.InvariantCulture);
        var all = await store.GetAllAsync<TariffVersion>(Collection, cancellationToken);

        return all
            .Where(x => string.Equals(x.UserId, userId, StringComparison.Ordinal))
            .Where(x => ParseDate(x.EffectiveFromDate) <= targetDate)
            .OrderByDescending(x => ParseDate(x.EffectiveFromDate))
            .ThenByDescending(x => x.UpdatedAtUtc)
            .FirstOrDefault();
    }

    private static DateOnly ParseDate(string value)
    {
        return DateOnly.ParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture);
    }
}
