using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Calculations.Dtos;
using BaleAnchorUtility.Server.Domain.Billing;
using BaleAnchorUtility.Server.Domain.Calculations;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Calculations;

public sealed class CalculationSnapshotService
{
    private const string EngineVersion = "calc-engine-v1";
    private const string RoundingPolicyVersion = "money-2dp-awayfromzero:v1";
    private const string EstimatedAllocationLabel = "Estimated tariff allocation - no meter reading was available on the tariff-change date.";

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
        if (allReadings.Count == 0)
        {
            throw new InvalidOperationException("At least one reading is required to calculate a period.");
        }

        var orderedReadings = allReadings
            .OrderBy(x => x.ReadingDate, StringComparer.Ordinal)
            .ThenBy(x => x.UpdatedAtUtc)
            .ToList();

        var setup = await utilitySetupRepository.GetByUserIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("Utility setup is required before calculating charges.");

        ReadingSubmission start;
        ReadingSubmission end;
        if (orderedReadings.Count >= 2)
        {
            start = orderedReadings[^2];
            end = orderedReadings[^1];
        }
        else
        {
            end = orderedReadings[^1];
            start = new ReadingSubmission
            {
                Id = "utility-setup-opening",
                UserId = userId,
                ReadingDate = setup.MoveInDate,
                ColdWaterReading = setup.OpeningColdWaterReading,
                HotWaterReading = setup.OpeningHotWaterReading,
                ElectricityReading = setup.OpeningElectricityReading,
                CreatedAtUtc = setup.CreatedAtUtc,
                UpdatedAtUtc = setup.UpdatedAtUtc,
                Version = 1,
            };
        }

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
        var coldUsageBySegment = AllocateUsageBySegment(coldUsed, days, periodTariffs);
        var hotUsageBySegment = AllocateUsageBySegment(hotUsed, days, periodTariffs);
        var apartmentUsageBySegment = AllocateUsageBySegment(apartmentUsed, days, periodTariffs);
        var boilerUsageBySegment = AllocateUsageBySegment(boilerUsed, days, periodTariffs);

        var cold = CalculateComponent(
            coldUsageBySegment,
            periodTariffs,
            x => x.WaterTariffPerUnit,
            x => x.WaterStandingChargePerDay,
            x => x.WaterVatPercent,
            includeStandingCharge: true);

        var hot = CalculateComponent(
            hotUsageBySegment,
            periodTariffs,
            x => x.WaterTariffPerUnit,
            x => x.WaterStandingChargePerDay,
            x => x.WaterVatPercent,
            includeStandingCharge: false);

        var apartment = CalculateComponent(
            apartmentUsageBySegment,
            periodTariffs,
            x => x.ElectricityTariffPerUnit,
            x => x.ElectricityStandingChargePerDay,
            x => x.ElectricityVatPercent,
            includeStandingCharge: true);

        var boiler = CalculateComponent(
            boilerUsageBySegment,
            periodTariffs,
            x => x.ElectricityTariffPerUnit,
            x => x.ElectricityStandingChargePerDay,
            x => x.ElectricityVatPercent,
            includeStandingCharge: false);

        var coldTotal = cold.Total;
        var hotWaterTotal = hot.Total;
        var apartmentElectricityTotal = apartment.Total;
        var boilerElectricityTotal = boiler.Total;

        var waterTotal = coldTotal + hotWaterTotal;
        var electricityTotal = apartmentElectricityTotal + boilerElectricityTotal;
        var periodTotal = waterTotal + electricityTotal;

        ValidateIntegrity(
            coldUsed,
            hotUsed,
            apartmentUsed,
            boilerUsed,
            coldUsageBySegment,
            hotUsageBySegment,
            apartmentUsageBySegment,
            boilerUsageBySegment,
            coldTotal,
            hotWaterTotal,
            apartmentElectricityTotal,
            boilerElectricityTotal,
            waterTotal,
            electricityTotal,
            periodTotal);

        var equation = "PeriodTotal = WaterTotal + ElectricityTotal; WaterTotal = ColdWaterTotal + HotWaterTotal; ElectricityTotal = ApartmentElectricityTotal + BoilerElectricityTotal.";
        var segmentTraces = BuildSegmentTraces(
            periodTariffs,
            coldUsageBySegment,
            hotUsageBySegment,
            apartmentUsageBySegment,
            boilerUsageBySegment,
            hasEstimatedSegments);

        var componentLines = new List<CalculationComponentLineTrace>
        {
            CreateComponentLine("ColdWater", coldUsed, cold),
            CreateComponentLine("HotWater", hotUsed, hot),
            CreateComponentLine("ApartmentElectricity", apartmentUsed, apartment),
            CreateComponentLine("BoilerElectricity", boilerUsed, boiler),
        };

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
            ColdWaterTotal = decimal.Round(coldTotal, 2, MidpointRounding.AwayFromZero),
            HotWaterTotal = decimal.Round(hotWaterTotal, 2, MidpointRounding.AwayFromZero),
            ApartmentElectricityTotal = decimal.Round(apartmentElectricityTotal, 2, MidpointRounding.AwayFromZero),
            BoilerElectricityTotal = decimal.Round(boilerElectricityTotal, 2, MidpointRounding.AwayFromZero),
            WaterTotal = decimal.Round(waterTotal, 2, MidpointRounding.AwayFromZero),
            ElectricityTotal = decimal.Round(electricityTotal, 2, MidpointRounding.AwayFromZero),
            PeriodTotal = decimal.Round(periodTotal, 2, MidpointRounding.AwayFromZero),
            ContainsEstimatedSegments = hasEstimatedSegments,
            EstimatedAllocationLabel = hasEstimatedSegments ? EstimatedAllocationLabel : null,
            EngineVersion = EngineVersion,
            RoundingPolicyVersion = RoundingPolicyVersion,
            InputHash = inputHash,
            EquationSummary = equation,
            BoilerKwhPerCubicMeterUsed = setup.BoilerKwhPerCubicMeter,
            BoilerEfficiencyPercentUsed = setup.BoilerEfficiencyPercent,
            TariffSegments = segmentTraces,
            ComponentLines = componentLines,
            IntegrityChecksPassed = true,
            IntegrityDigest = "Validated: usage sums, segment sums, component totals, combined totals.",
            CreatedAtUtc = now,
            Version = 1,
        };

        await calculationSnapshotRepository.AddAsync(snapshot, cancellationToken);

        logger.LogInformation("Calculation snapshot {SnapshotId} created for user {UserId}.", snapshot.Id, userId);

        return ToResponse(snapshot);
    }

    public async Task<CalculateLatestPeriodResponse> GetLatestSnapshotAsync(string userId, CancellationToken cancellationToken)
    {
        var snapshot = await calculationSnapshotRepository.GetLatestByUserIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("No calculation snapshot is available yet.");

        return ToResponse(snapshot);
    }

    private static CalculateLatestPeriodResponse ToResponse(CalculationSnapshot snapshot)
    {
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
            ColdWaterTotal = snapshot.ColdWaterTotal.ToString("0.00", CultureInfo.InvariantCulture),
            HotWaterTotal = snapshot.HotWaterTotal.ToString("0.00", CultureInfo.InvariantCulture),
            ApartmentElectricityTotal = snapshot.ApartmentElectricityTotal.ToString("0.00", CultureInfo.InvariantCulture),
            BoilerElectricityTotal = snapshot.BoilerElectricityTotal.ToString("0.00", CultureInfo.InvariantCulture),
            WaterTotal = snapshot.WaterTotal.ToString("0.00", CultureInfo.InvariantCulture),
            ElectricityTotal = snapshot.ElectricityTotal.ToString("0.00", CultureInfo.InvariantCulture),
            PeriodTotal = snapshot.PeriodTotal.ToString("0.00", CultureInfo.InvariantCulture),
            ContainsEstimatedSegments = snapshot.ContainsEstimatedSegments,
            EngineVersion = snapshot.EngineVersion,
            RoundingPolicyVersion = snapshot.RoundingPolicyVersion,
            InputHash = snapshot.InputHash,
            EquationSummary = snapshot.EquationSummary,
            EstimatedAllocationLabel = snapshot.EstimatedAllocationLabel,
            BoilerAssumptions = new BoilerAssumptionSummaryResponse
            {
                BoilerKwhPerCubicMeter = snapshot.BoilerKwhPerCubicMeterUsed.ToString("0.#####", CultureInfo.InvariantCulture),
                BoilerEfficiencyPercent = snapshot.BoilerEfficiencyPercentUsed.ToString("0.#####", CultureInfo.InvariantCulture),
            },
            TariffSegments = snapshot.TariffSegments
                .Select(x => new CalculationTariffSegmentResponse
                {
                    StartDate = x.StartDate,
                    EndDateExclusive = x.EndDateExclusive,
                    Days = x.Days,
                    IsEstimatedAllocation = x.IsEstimatedAllocation,
                    WaterTariffPerUnit = x.WaterTariffPerUnit.ToString("0.#####", CultureInfo.InvariantCulture),
                    WaterStandingChargePerDay = x.WaterStandingChargePerDay.ToString("0.#####", CultureInfo.InvariantCulture),
                    WaterVatPercent = x.WaterVatPercent.ToString("0.#####", CultureInfo.InvariantCulture),
                    ElectricityTariffPerUnit = x.ElectricityTariffPerUnit.ToString("0.#####", CultureInfo.InvariantCulture),
                    ElectricityStandingChargePerDay = x.ElectricityStandingChargePerDay.ToString("0.#####", CultureInfo.InvariantCulture),
                    ElectricityVatPercent = x.ElectricityVatPercent.ToString("0.#####", CultureInfo.InvariantCulture),
                    ColdWaterUsage = x.ColdWaterUsage.ToString("0.######", CultureInfo.InvariantCulture),
                    HotWaterUsage = x.HotWaterUsage.ToString("0.######", CultureInfo.InvariantCulture),
                    ApartmentElectricityUsage = x.ApartmentElectricityUsage.ToString("0.######", CultureInfo.InvariantCulture),
                    BoilerElectricityUsage = x.BoilerElectricityUsage.ToString("0.######", CultureInfo.InvariantCulture),
                })
                .ToList(),
            ComponentLines = snapshot.ComponentLines
                .Select(x => new CalculationComponentLineResponse
                {
                    Component = x.Component,
                    Usage = x.Usage.ToString("0.######", CultureInfo.InvariantCulture),
                    UsageSubtotal = x.UsageSubtotal.ToString("0.######", CultureInfo.InvariantCulture),
                    StandingSubtotal = x.StandingSubtotal.ToString("0.######", CultureInfo.InvariantCulture),
                    VatAmount = x.VatAmount.ToString("0.######", CultureInfo.InvariantCulture),
                    Total = x.Total.ToString("0.00", CultureInfo.InvariantCulture),
                    Equation = x.Equation,
                })
                .ToList(),
            IntegrityChecksPassed = snapshot.IntegrityChecksPassed,
            IntegrityDigest = snapshot.IntegrityDigest,
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
                    WaterStandingChargePerDay = currentTariff.WaterStandingChargePerDay,
                    WaterVatPercent = currentTariff.WaterVatPercent,
                    ElectricityTariffPerUnit = currentTariff.ElectricityTariffPerUnit,
                    ElectricityStandingChargePerDay = currentTariff.ElectricityStandingChargePerDay,
                    ElectricityVatPercent = currentTariff.ElectricityVatPercent,
                });
            }

            currentStart = segmentEnd;
            cursor++;
        }

        return result;
    }

    private static ComponentComputationResult CalculateComponent(
        IReadOnlyList<decimal> usageBySegment,
        IReadOnlyList<TariffSegment> segments,
        Func<TariffSegment, decimal> unitRate,
        Func<TariffSegment, decimal> standingRate,
        Func<TariffSegment, decimal> vatPercent,
        bool includeStandingCharge)
    {
        if (segments.Count == 0 || usageBySegment.Count == 0)
        {
            return new ComponentComputationResult();
        }

        decimal usageSubtotal = 0m;
        decimal standingSubtotal = 0m;
        decimal vatAmount = 0m;
        decimal total = 0m;

        for (var index = 0; index < segments.Count; index++)
        {
            var segment = segments[index];
            var segmentUsage = usageBySegment[index];
            var segmentUsageSubtotal = segmentUsage * unitRate(segment);
            var segmentStandingSubtotal = includeStandingCharge ? segment.Days * standingRate(segment) : 0m;
            var subtotal = segmentUsageSubtotal + segmentStandingSubtotal;
            var segmentVatAmount = subtotal * vatPercent(segment) / 100m;
            total += subtotal + segmentVatAmount;

            usageSubtotal += segmentUsageSubtotal;
            standingSubtotal += segmentStandingSubtotal;
            vatAmount += segmentVatAmount;
        }

        return new ComponentComputationResult
        {
            UsageSubtotal = usageSubtotal,
            StandingSubtotal = standingSubtotal,
            VatAmount = vatAmount,
            Total = total,
        };
    }

    private static decimal[] AllocateUsageBySegment(decimal totalUsage, int totalDays, IReadOnlyList<TariffSegment> segments)
    {
        if (segments.Count == 0)
        {
            return [];
        }

        if (totalDays <= 0)
        {
            throw new InvalidOperationException("Calculation period is invalid.");
        }

        var usage = new decimal[segments.Count];
        decimal allocated = 0m;

        for (var index = 0; index < segments.Count; index++)
        {
            if (index == segments.Count - 1)
            {
                usage[index] = totalUsage - allocated;
            }
            else
            {
                usage[index] = decimal.Round(totalUsage * segments[index].Days / totalDays, 6, MidpointRounding.AwayFromZero);
                allocated += usage[index];
            }
        }

        return usage;
    }

    private static List<CalculationTariffSegmentTrace> BuildSegmentTraces(
        IReadOnlyList<TariffSegment> segments,
        IReadOnlyList<decimal> coldUsageBySegment,
        IReadOnlyList<decimal> hotUsageBySegment,
        IReadOnlyList<decimal> apartmentUsageBySegment,
        IReadOnlyList<decimal> boilerUsageBySegment,
        bool hasEstimatedSegments)
    {
        var traces = new List<CalculationTariffSegmentTrace>(segments.Count);
        for (var i = 0; i < segments.Count; i++)
        {
            var segment = segments[i];
            traces.Add(new CalculationTariffSegmentTrace
            {
                StartDate = segment.StartDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                EndDateExclusive = segment.EndDateExclusive.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                Days = segment.Days,
                IsEstimatedAllocation = hasEstimatedSegments,
                WaterTariffPerUnit = segment.WaterTariffPerUnit,
                WaterStandingChargePerDay = segment.WaterStandingChargePerDay,
                WaterVatPercent = segment.WaterVatPercent,
                ElectricityTariffPerUnit = segment.ElectricityTariffPerUnit,
                ElectricityStandingChargePerDay = segment.ElectricityStandingChargePerDay,
                ElectricityVatPercent = segment.ElectricityVatPercent,
                ColdWaterUsage = coldUsageBySegment[i],
                HotWaterUsage = hotUsageBySegment[i],
                ApartmentElectricityUsage = apartmentUsageBySegment[i],
                BoilerElectricityUsage = boilerUsageBySegment[i],
            });
        }

        return traces;
    }

    private static CalculationComponentLineTrace CreateComponentLine(string component, decimal usage, ComponentComputationResult result)
    {
        return new CalculationComponentLineTrace
        {
            Component = component,
            Usage = usage,
            UsageSubtotal = result.UsageSubtotal,
            StandingSubtotal = result.StandingSubtotal,
            VatAmount = result.VatAmount,
            Total = decimal.Round(result.Total, 2, MidpointRounding.AwayFromZero),
            Equation = "total = (usage x unitRate + standing) + VAT",
        };
    }

    private static void ValidateIntegrity(
        decimal coldUsed,
        decimal hotUsed,
        decimal apartmentUsed,
        decimal boilerUsed,
        IReadOnlyList<decimal> coldUsageBySegment,
        IReadOnlyList<decimal> hotUsageBySegment,
        IReadOnlyList<decimal> apartmentUsageBySegment,
        IReadOnlyList<decimal> boilerUsageBySegment,
        decimal coldTotal,
        decimal hotTotal,
        decimal apartmentTotal,
        decimal boilerTotal,
        decimal waterTotal,
        decimal electricityTotal,
        decimal periodTotal)
    {
        EnsureApproximateEqual(coldUsed, coldUsageBySegment.Sum(), 0.000001m, "Cold segment usage does not sum to total cold usage.");
        EnsureApproximateEqual(hotUsed, hotUsageBySegment.Sum(), 0.000001m, "Hot segment usage does not sum to total hot usage.");
        EnsureApproximateEqual(apartmentUsed, apartmentUsageBySegment.Sum(), 0.000001m, "Apartment electricity segment usage does not sum to total apartment usage.");
        EnsureApproximateEqual(boilerUsed, boilerUsageBySegment.Sum(), 0.000001m, "Boiler electricity segment usage does not sum to total boiler usage.");
        EnsureApproximateEqual(waterTotal, coldTotal + hotTotal, 0.000001m, "Water total integrity check failed.");
        EnsureApproximateEqual(electricityTotal, apartmentTotal + boilerTotal, 0.000001m, "Electricity total integrity check failed.");
        EnsureApproximateEqual(periodTotal, waterTotal + electricityTotal, 0.000001m, "Period total integrity check failed.");
    }

    private static void EnsureApproximateEqual(decimal expected, decimal actual, decimal tolerance, string message)
    {
        var delta = decimal.Abs(expected - actual);
        if (delta > tolerance)
        {
            throw new InvalidOperationException(message);
        }
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
                .Append(':').Append(segment.WaterStandingChargePerDay.ToString(CultureInfo.InvariantCulture))
                .Append(':').Append(segment.WaterVatPercent.ToString(CultureInfo.InvariantCulture))
                .Append(':').Append(segment.ElectricityTariffPerUnit.ToString(CultureInfo.InvariantCulture))
                .Append(':').Append(segment.ElectricityStandingChargePerDay.ToString(CultureInfo.InvariantCulture))
                .Append(':').Append(segment.ElectricityVatPercent.ToString(CultureInfo.InvariantCulture));
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
        public required decimal WaterStandingChargePerDay { get; init; }
        public required decimal WaterVatPercent { get; init; }
        public required decimal ElectricityTariffPerUnit { get; init; }
        public required decimal ElectricityStandingChargePerDay { get; init; }
        public required decimal ElectricityVatPercent { get; init; }
    }

    private sealed class ComponentComputationResult
    {
        public decimal UsageSubtotal { get; init; }
        public decimal StandingSubtotal { get; init; }
        public decimal VatAmount { get; init; }
        public decimal Total { get; init; }
    }
}
