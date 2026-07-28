using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Calculations.Dtos;
using BaleAnchorUtility.Server.Domain.Calculations;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Calculations;

public sealed class CalculationSnapshotService
{
    private const string EngineVersion = "calc-engine-v1";

    private readonly IUserRepository userRepository;
    private readonly IReadingSubmissionRepository readingSubmissionRepository;
    private readonly ITariffVersionRepository tariffVersionRepository;
    private readonly IUtilitySetupRepository utilitySetupRepository;
    private readonly ICalculationSnapshotRepository calculationSnapshotRepository;
    private readonly ISystemClock clock;
    private readonly ILogger<CalculationSnapshotService> logger;

    public CalculationSnapshotService(
        IUserRepository userRepository,
        IReadingSubmissionRepository readingSubmissionRepository,
        ITariffVersionRepository tariffVersionRepository,
        IUtilitySetupRepository utilitySetupRepository,
        ICalculationSnapshotRepository calculationSnapshotRepository,
        ISystemClock clock,
        ILogger<CalculationSnapshotService> logger)
    {
        this.userRepository = userRepository;
        this.readingSubmissionRepository = readingSubmissionRepository;
        this.tariffVersionRepository = tariffVersionRepository;
        this.utilitySetupRepository = utilitySetupRepository;
        this.calculationSnapshotRepository = calculationSnapshotRepository;
        this.clock = clock;
        this.logger = logger;
    }

    public async Task<CalculateLatestPeriodResponse> CalculateLatestPeriodAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User record was not found for this session.");

        if (user.Status != UserAccountStatus.Active)
        {
            throw new InvalidOperationException("Only active accounts can generate calculations.");
        }

        var allReadings = await readingSubmissionRepository.GetByUserIdAsync(userId, cancellationToken);
        if (allReadings.Count < 2)
        {
            throw new InvalidOperationException("At least two readings are required to calculate a period.");
        }

        var orderedReadings = allReadings
            .OrderBy(x => x.ReadingDate, StringComparer.Ordinal)
            .ThenBy(x => x.UpdatedAtUtc)
            .ToList();

        var start = orderedReadings[^2];
        var end = orderedReadings[^1];

        var startDate = ParseDate(start.ReadingDate, "Stored start reading date is invalid.");
        var endDate = ParseDate(end.ReadingDate, "Stored end reading date is invalid.");

        if (endDate <= startDate)
        {
            throw new InvalidOperationException("Calculation period dates are invalid.");
        }

        var days = endDate.DayNumber - startDate.DayNumber;

        var coldUsed = end.ColdWaterReading - start.ColdWaterReading;
        var hotUsed = end.HotWaterReading - start.HotWaterReading;
        var apartmentUsed = end.ElectricityReading - start.ElectricityReading;

        if (coldUsed < 0m || hotUsed < 0m || apartmentUsed < 0m)
        {
            throw new InvalidOperationException("Calculation inputs are invalid because meter values rolled back.");
        }

        var setup = await utilitySetupRepository.GetByUserIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("Utility setup is required before calculating charges.");

        if (setup.BoilerKwhPerCubicMeter <= 0m || setup.BoilerEfficiencyPercent <= 0m)
        {
            throw new InvalidOperationException("Boiler assumptions are invalid for calculation.");
        }

        var boilerUsed = hotUsed * setup.BoilerKwhPerCubicMeter / (setup.BoilerEfficiencyPercent / 100m);

        var tariffs = await tariffVersionRepository.GetByUserUpToDateAsync(userId, end.ReadingDate, cancellationToken);
        var periodTariffs = BuildTariffSegments(tariffs, startDate, endDate);
        if (periodTariffs.Count == 0)
        {
            throw new InvalidOperationException("No tariffs are available for the selected calculation period.");
        }

        var hasEstimatedSegments = periodTariffs.Count > 1;
        var coldCost = AllocateAndPrice(coldUsed, days, periodTariffs, x => x.WaterTariffPerUnit);
        var hotVolumeCost = AllocateAndPrice(hotUsed, days, periodTariffs, x => x.WaterTariffPerUnit);
        var apartmentCost = AllocateAndPrice(apartmentUsed, days, periodTariffs, x => x.ElectricityTariffPerUnit);
        var boilerCost = AllocateAndPrice(boilerUsed, days, periodTariffs, x => x.ElectricityTariffPerUnit);

        var waterTotal = coldCost + hotVolumeCost;
        var electricityTotal = apartmentCost + boilerCost;
        var periodTotal = waterTotal + electricityTotal;

        var equation = $"Water=({coldUsed:0.###}+{hotUsed:0.###}) with dated tariffs; Electricity=({apartmentUsed:0.###}+{boilerUsed:0.###}) with dated tariffs; PeriodTotal={periodTotal:0.00}";

        var inputHash = ComputeInputHash(userId, start, end, setup, periodTariffs);
        var now = clock.UtcNow;
        var snapshot = new CalculationSnapshot
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            PeriodStartDate = start.ReadingDate,
            PeriodEndDateExclusive = end.ReadingDate,
            DaysInPeriod = days,
            ColdWaterUsed = coldUsed,
            HotWaterUsed = hotUsed,
            ApartmentElectricityUsed = apartmentUsed,
            BoilerElectricityUsed = boilerUsed,
            WaterTotal = decimal.Round(waterTotal, 2, MidpointRounding.AwayFromZero),
            ElectricityTotal = decimal.Round(electricityTotal, 2, MidpointRounding.AwayFromZero),
            PeriodTotal = decimal.Round(periodTotal, 2, MidpointRounding.AwayFromZero),
            ContainsEstimatedSegments = hasEstimatedSegments,
            EngineVersion = EngineVersion,
            InputHash = inputHash,
            EquationSummary = equation,
            CreatedAtUtc = now,
            Version = 1,
        };

        await calculationSnapshotRepository.AddAsync(snapshot, cancellationToken);

        logger.LogInformation("Calculation snapshot {SnapshotId} created for user {UserId}.", snapshot.Id, userId);

        return new CalculateLatestPeriodResponse
        {
            SnapshotId = snapshot.Id,
            UserId = snapshot.UserId,
            PeriodStartDate = snapshot.PeriodStartDate,
            PeriodEndDateExclusive = snapshot.PeriodEndDateExclusive,
            DaysInPeriod = snapshot.DaysInPeriod,
            ColdWaterUsed = snapshot.ColdWaterUsed.ToString("0.###", CultureInfo.InvariantCulture),
            HotWaterUsed = snapshot.HotWaterUsed.ToString("0.###", CultureInfo.InvariantCulture),
            ApartmentElectricityUsed = snapshot.ApartmentElectricityUsed.ToString("0.###", CultureInfo.InvariantCulture),
            BoilerElectricityUsed = snapshot.BoilerElectricityUsed.ToString("0.###", CultureInfo.InvariantCulture),
            WaterTotal = snapshot.WaterTotal.ToString("0.00", CultureInfo.InvariantCulture),
            ElectricityTotal = snapshot.ElectricityTotal.ToString("0.00", CultureInfo.InvariantCulture),
            PeriodTotal = snapshot.PeriodTotal.ToString("0.00", CultureInfo.InvariantCulture),
            ContainsEstimatedSegments = snapshot.ContainsEstimatedSegments,
            EngineVersion = snapshot.EngineVersion,
            InputHash = snapshot.InputHash,
            EquationSummary = snapshot.EquationSummary,
        };
    }

    public async Task<CalculateLatestPeriodResponse> GetLatestSnapshotAsync(string userId, CancellationToken cancellationToken)
    {
        var snapshot = await calculationSnapshotRepository.GetLatestByUserIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("No calculation snapshot is available yet.");

        return new CalculateLatestPeriodResponse
        {
            SnapshotId = snapshot.Id,
            UserId = snapshot.UserId,
            PeriodStartDate = snapshot.PeriodStartDate,
            PeriodEndDateExclusive = snapshot.PeriodEndDateExclusive,
            DaysInPeriod = snapshot.DaysInPeriod,
            ColdWaterUsed = snapshot.ColdWaterUsed.ToString("0.###", CultureInfo.InvariantCulture),
            HotWaterUsed = snapshot.HotWaterUsed.ToString("0.###", CultureInfo.InvariantCulture),
            ApartmentElectricityUsed = snapshot.ApartmentElectricityUsed.ToString("0.###", CultureInfo.InvariantCulture),
            BoilerElectricityUsed = snapshot.BoilerElectricityUsed.ToString("0.###", CultureInfo.InvariantCulture),
            WaterTotal = snapshot.WaterTotal.ToString("0.00", CultureInfo.InvariantCulture),
            ElectricityTotal = snapshot.ElectricityTotal.ToString("0.00", CultureInfo.InvariantCulture),
            PeriodTotal = snapshot.PeriodTotal.ToString("0.00", CultureInfo.InvariantCulture),
            ContainsEstimatedSegments = snapshot.ContainsEstimatedSegments,
            EngineVersion = snapshot.EngineVersion,
            InputHash = snapshot.InputHash,
            EquationSummary = snapshot.EquationSummary,
        };
    }

    private static List<TariffSegment> BuildTariffSegments(
        IReadOnlyList<Domain.Billing.TariffVersion> versions,
        DateOnly startDate,
        DateOnly endDateExclusive)
    {
        var ordered = versions
            .Select(x => new { Tariff = x, EffectiveDate = ParseDate(x.EffectiveFromDate, "Stored tariff date is invalid.") })
            .Where(x => x.EffectiveDate < endDateExclusive)
            .OrderBy(x => x.EffectiveDate)
            .ToList();

        if (ordered.Count == 0)
        {
            return [];
        }

        var activeAtStart = ordered.LastOrDefault(x => x.EffectiveDate <= startDate);
        if (activeAtStart is null)
        {
            return [];
        }

        var result = new List<TariffSegment>();
        var currentStart = startDate;
        var cursor = ordered.IndexOf(activeAtStart);

        while (currentStart < endDateExclusive && cursor < ordered.Count)
        {
            var currentTariff = ordered[cursor].Tariff;
            var nextEffective = cursor + 1 < ordered.Count ? ordered[cursor + 1].EffectiveDate : endDateExclusive;
            var segmentEnd = nextEffective < endDateExclusive ? nextEffective : endDateExclusive;

            if (segmentEnd > currentStart)
            {
                result.Add(new TariffSegment
                {
                    StartDate = currentStart,
                    EndDateExclusive = segmentEnd,
                    Days = segmentEnd.DayNumber - currentStart.DayNumber,
                    WaterTariffPerUnit = currentTariff.WaterTariffPerUnit,
                    ElectricityTariffPerUnit = currentTariff.ElectricityTariffPerUnit,
                });
            }

            currentStart = segmentEnd;
            cursor++;
        }

        return result;
    }

    private static decimal AllocateAndPrice(decimal totalUsage, int totalDays, IReadOnlyList<TariffSegment> segments, Func<TariffSegment, decimal> unitRate)
    {
        if (totalUsage == 0m)
        {
            return 0m;
        }

        decimal allocatedUsage = 0m;
        decimal totalCost = 0m;

        for (var index = 0; index < segments.Count; index++)
        {
            var segment = segments[index];
            var segmentUsage = index == segments.Count - 1
                ? totalUsage - allocatedUsage
                : decimal.Round(totalUsage * segment.Days / totalDays, 6, MidpointRounding.AwayFromZero);

            allocatedUsage += segmentUsage;
            totalCost += segmentUsage * unitRate(segment);
        }

        return totalCost;
    }

    private static string ComputeInputHash(
        string userId,
        Domain.Billing.ReadingSubmission start,
        Domain.Billing.ReadingSubmission end,
        Domain.Onboarding.UtilitySetupSubmission setup,
        IReadOnlyList<TariffSegment> segments)
    {
        var content = new StringBuilder()
            .Append(userId)
            .Append('|').Append(start.Id).Append(':').Append(start.Version)
            .Append('|').Append(end.Id).Append(':').Append(end.Version)
            .Append('|').Append(setup.Id).Append(':').Append(setup.Version)
            .Append('|').Append(setup.BoilerKwhPerCubicMeter.ToString(CultureInfo.InvariantCulture))
            .Append('|').Append(setup.BoilerEfficiencyPercent.ToString(CultureInfo.InvariantCulture));

        foreach (var segment in segments)
        {
            content.Append('|').Append(segment.StartDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))
                .Append('>').Append(segment.EndDateExclusive.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))
                .Append(':').Append(segment.WaterTariffPerUnit.ToString(CultureInfo.InvariantCulture))
                .Append(':').Append(segment.ElectricityTariffPerUnit.ToString(CultureInfo.InvariantCulture));
        }

        using var sha = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(content.ToString());
        return Convert.ToHexString(sha.ComputeHash(bytes));
    }

    private static DateOnly ParseDate(string rawValue, string message)
    {
        if (!DateOnly.TryParseExact(rawValue, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var value))
        {
            throw new InvalidOperationException(message);
        }

        return value;
    }

    private sealed class TariffSegment
    {
        public required DateOnly StartDate { get; init; }
        public required DateOnly EndDateExclusive { get; init; }
        public required int Days { get; init; }
        public required decimal WaterTariffPerUnit { get; init; }
        public required decimal ElectricityTariffPerUnit { get; init; }
    }
}
