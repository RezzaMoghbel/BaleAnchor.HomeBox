using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Billing.Dtos;
using BaleAnchorUtility.Server.Application.Calculations.Dtos;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Billing;

public sealed class StatementSummaryService
{
    private readonly IUserRepository userRepository;
    private readonly ICalculationSnapshotRepository calculationSnapshotRepository;
    private readonly IReadingSubmissionRepository readingSubmissionRepository;
    private readonly IPaymentRepository paymentRepository;

    public StatementSummaryService(
        IUserRepository userRepository,
        ICalculationSnapshotRepository calculationSnapshotRepository,
        IReadingSubmissionRepository readingSubmissionRepository,
        IPaymentRepository paymentRepository)
    {
        this.userRepository = userRepository;
        this.calculationSnapshotRepository = calculationSnapshotRepository;
        this.readingSubmissionRepository = readingSubmissionRepository;
        this.paymentRepository = paymentRepository;
    }

    public async Task<LatestStatementSummaryResponse> GetLatestSummaryAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);

        var latestSnapshot = await calculationSnapshotRepository.GetLatestByUserIdAsync(user.Id, cancellationToken)
            ?? throw new InvalidOperationException("No calculation snapshot is available yet.");

        return await BuildSummaryAsync(user.Id, latestSnapshot, cancellationToken);
    }

    public async Task<LatestStatementSummaryResponse> GetSelectedSummaryAsync(
        string userId,
        string? snapshotId,
        string? periodStartDate,
        string? periodEndDateExclusive,
        CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);

        var hasSnapshotId = !string.IsNullOrWhiteSpace(snapshotId);
        var hasAnyPeriod = !string.IsNullOrWhiteSpace(periodStartDate) || !string.IsNullOrWhiteSpace(periodEndDateExclusive);

        if (!hasSnapshotId && !hasAnyPeriod)
        {
            throw new ArgumentException("Provide either snapshotId or both periodStartDate and periodEndDateExclusive.");
        }

        if (hasSnapshotId && hasAnyPeriod)
        {
            throw new ArgumentException("Use either snapshotId or period dates, not both.");
        }

        Domain.Calculations.CalculationSnapshot? snapshot;

        if (hasSnapshotId)
        {
            snapshot = await calculationSnapshotRepository.GetByIdAsync(snapshotId!.Trim(), cancellationToken);
            if (snapshot is null || !string.Equals(snapshot.UserId, user.Id, StringComparison.Ordinal))
            {
                throw new KeyNotFoundException("The selected statement snapshot was not found.");
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(periodStartDate) || string.IsNullOrWhiteSpace(periodEndDateExclusive))
            {
                throw new ArgumentException("Both periodStartDate and periodEndDateExclusive are required when snapshotId is not provided.");
            }

            var start = ParseDate(periodStartDate, "periodStartDate must use yyyy-MM-dd format.");
            var end = ParseDate(periodEndDateExclusive, "periodEndDateExclusive must use yyyy-MM-dd format.");
            if (end <= start)
            {
                throw new ArgumentException("periodEndDateExclusive must be after periodStartDate.");
            }

            var startIso = start.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            var endIso = end.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

            snapshot = await calculationSnapshotRepository.GetByUserAndPeriodAsync(user.Id, startIso, endIso, cancellationToken)
                ?? throw new KeyNotFoundException("The selected statement period was not found.");
        }

        return await BuildSummaryAsync(user.Id, snapshot, cancellationToken);
    }

    public async Task<StatementPeriodListResponse> GetStatementPeriodsAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);

        var readings = await readingSubmissionRepository.GetByUserIdAsync(user.Id, cancellationToken);
        var validPeriodEndDates = readings
            .Select(x => x.ReadingDate)
            .ToHashSet(StringComparer.Ordinal);

        var snapshots = await calculationSnapshotRepository.GetByUserIdAsync(user.Id, cancellationToken);
        if (validPeriodEndDates.Count > 0)
        {
            snapshots = snapshots
                .Where(x => validPeriodEndDates.Contains(x.PeriodEndDateExclusive))
                .ToList();
        }
        var payments = await paymentRepository.GetByUserIdAsync(user.Id, cancellationToken);

        var paymentsByPeriod = payments
            .Where(x => !string.IsNullOrWhiteSpace(x.PeriodStartDate) && !string.IsNullOrWhiteSpace(x.PeriodEndDateExclusive))
            .GroupBy(x => $"{x.PeriodStartDate}|{x.PeriodEndDateExclusive}")
            .ToDictionary(
                x => x.Key,
                x => x
                    .OrderByDescending(p => p.PaymentDate, StringComparer.Ordinal)
                    .ThenByDescending(p => p.UpdatedAtUtc)
                    .ToList());

        var latestSnapshotByPeriod = snapshots
            .GroupBy(x => $"{x.PeriodStartDate}|{x.PeriodEndDateExclusive}")
            .Select(x => x.OrderByDescending(s => s.CreatedAtUtc).First())
            .ToList();

        var items = latestSnapshotByPeriod
            .OrderByDescending(x => x.PeriodEndDateExclusive, StringComparer.Ordinal)
            .ThenByDescending(x => x.CreatedAtUtc)
            .Select(snapshot =>
            {
                var key = $"{snapshot.PeriodStartDate}|{snapshot.PeriodEndDateExclusive}";
                paymentsByPeriod.TryGetValue(key, out var linkedPayments);
                linkedPayments ??= [];

                var paidAmount = linkedPayments.Sum(x => x.Amount);
                var latestPayment = linkedPayments.FirstOrDefault();
                var difference = snapshot.PeriodTotal - paidAmount;

                return new StatementPeriodItemResponse
                {
                    SnapshotId = snapshot.Id,
                    PeriodStartDate = snapshot.PeriodStartDate,
                    PeriodEndDateExclusive = snapshot.PeriodEndDateExclusive,
                    PeriodTotal = snapshot.PeriodTotal.ToString("0.00", CultureInfo.InvariantCulture),
                    HasPayment = linkedPayments.Count > 0,
                    PaymentId = latestPayment?.Id,
                    PaymentAmount = paidAmount.ToString("0.00", CultureInfo.InvariantCulture),
                    PaymentDate = latestPayment?.PaymentDate,
                    LinkedPaymentCount = linkedPayments.Count,
                    LinkedPayments = linkedPayments
                        .Select(payment => new LinkedPaymentItemResponse
                        {
                            PaymentId = payment.Id,
                            Amount = payment.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                            PaymentDate = payment.PaymentDate,
                            Method = payment.Method,
                            Reference = payment.Reference,
                            Notes = payment.Notes,
                            VerificationStatus = payment.VerificationStatus,
                        })
                        .ToList(),
                    PeriodDifference = difference.ToString("0.00", CultureInfo.InvariantCulture),
                    PeriodBalanceStatus = ToBalanceStatus(difference),
                    ContainsEstimatedSegments = snapshot.ContainsEstimatedSegments,
                };
            })
            .ToList();

        return new StatementPeriodListResponse
        {
            UserId = user.Id,
            Count = items.Count,
            Items = items,
        };
    }

    private async Task<LatestStatementSummaryResponse> BuildSummaryAsync(
        string userId,
        Domain.Calculations.CalculationSnapshot snapshot,
        CancellationToken cancellationToken)
    {
        var allPayments = await paymentRepository.GetByUserIdAsync(userId, cancellationToken);
        var periodPayments = allPayments
            .Where(x =>
                string.Equals(x.PeriodStartDate, snapshot.PeriodStartDate, StringComparison.Ordinal)
                && string.Equals(x.PeriodEndDateExclusive, snapshot.PeriodEndDateExclusive, StringComparison.Ordinal))
            .OrderByDescending(x => x.PaymentDate, StringComparer.Ordinal)
            .ThenByDescending(x => x.UpdatedAtUtc)
            .ToList();
        var latestPaymentForPeriod = periodPayments.FirstOrDefault();

        var validPeriodEndDates = (await readingSubmissionRepository.GetByUserIdAsync(userId, cancellationToken))
            .Select(x => x.ReadingDate)
            .ToHashSet(StringComparer.Ordinal);

        var allSnapshots = await calculationSnapshotRepository.GetByUserIdAsync(userId, cancellationToken);
        if (validPeriodEndDates.Count > 0)
        {
            allSnapshots = allSnapshots
                .Where(x => validPeriodEndDates.Contains(x.PeriodEndDateExclusive))
                .ToList();
        }
        var totalCalculatedCharges = allSnapshots.Sum(x => x.PeriodTotal);
        var totalRecordedPayments = allPayments.Sum(x => x.Amount);
        var currentBalance = totalCalculatedCharges - totalRecordedPayments;

        var periodPaidAmount = periodPayments.Sum(x => x.Amount);
        var periodDifference = snapshot.PeriodTotal - periodPaidAmount;

        return new LatestStatementSummaryResponse
        {
            UserId = userId,
            PeriodStartDate = snapshot.PeriodStartDate,
            PeriodEndDateExclusive = snapshot.PeriodEndDateExclusive,
            PeriodTotal = snapshot.PeriodTotal.ToString("0.00", CultureInfo.InvariantCulture),
            HasPayment = periodPayments.Count > 0,
            PaymentId = latestPaymentForPeriod?.Id,
            PaymentAmount = periodPaidAmount.ToString("0.00", CultureInfo.InvariantCulture),
            PaymentDate = latestPaymentForPeriod?.PaymentDate,
            PaymentMethod = latestPaymentForPeriod?.Method,
            PeriodDifference = periodDifference.ToString("0.00", CultureInfo.InvariantCulture),
            PeriodBalanceStatus = ToBalanceStatus(periodDifference),
            TotalCalculatedCharges = totalCalculatedCharges.ToString("0.00", CultureInfo.InvariantCulture),
            TotalRecordedPayments = totalRecordedPayments.ToString("0.00", CultureInfo.InvariantCulture),
            CurrentBalance = currentBalance.ToString("0.00", CultureInfo.InvariantCulture),
            CurrentBalanceStatus = ToBalanceStatus(currentBalance),
            ContainsEstimatedSegments = snapshot.ContainsEstimatedSegments,
            EstimatedAllocationLabel = snapshot.EstimatedAllocationLabel,
            EngineVersion = snapshot.EngineVersion,
            RoundingPolicyVersion = snapshot.RoundingPolicyVersion,
            InputHash = snapshot.InputHash,
            EquationSummary = snapshot.EquationSummary,
            BoilerAssumptions = new BoilerAssumptionSummaryResponse
            {
                HotWaterTemperatureCelsius = snapshot.HotWaterTemperatureCelsiusUsed.ToString("0.##", CultureInfo.InvariantCulture),
                HotWaterHeatCapacity = snapshot.HotWaterHeatCapacityUsed.ToString("0.######", CultureInfo.InvariantCulture),
                HotWaterDensity = snapshot.HotWaterDensityUsed.ToString("0.###", CultureInfo.InvariantCulture),
                KiloJouleToKiloWattHourFactor = snapshot.KiloJouleToKiloWattHourFactorUsed.ToString("0.###", CultureInfo.InvariantCulture),
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

    private async Task<UserAccount> GetEligibleUserAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User record was not found for this session.");

        if (user.Status != UserAccountStatus.Active)
        {
            throw new InvalidOperationException("Only active accounts can view statement summaries.");
        }

        return user;
    }

    private static DateOnly ParseDate(string value, string message)
    {
        if (!DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            throw new ArgumentException(message);
        }

        return date;
    }

    private static string ToBalanceStatus(decimal balance)
    {
        if (balance > 0m)
        {
            return "Amount outstanding";
        }

        if (balance < 0m)
        {
            return "In credit";
        }

        return "Paid in full";
    }
}
