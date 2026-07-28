using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Billing.Dtos;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Billing;

public sealed class StatementSummaryService
{
    private readonly IUserRepository userRepository;
    private readonly ICalculationSnapshotRepository calculationSnapshotRepository;
    private readonly IPaymentRepository paymentRepository;

    public StatementSummaryService(
        IUserRepository userRepository,
        ICalculationSnapshotRepository calculationSnapshotRepository,
        IPaymentRepository paymentRepository)
    {
        this.userRepository = userRepository;
        this.calculationSnapshotRepository = calculationSnapshotRepository;
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

        var snapshots = await calculationSnapshotRepository.GetByUserIdAsync(user.Id, cancellationToken);
        var payments = await paymentRepository.GetByUserIdAsync(user.Id, cancellationToken);

        var paymentByPeriod = payments
            .GroupBy(x => $"{x.PeriodStartDate}|{x.PeriodEndDateExclusive}")
            .ToDictionary(
                x => x.Key,
                x => x.OrderByDescending(p => p.UpdatedAtUtc).First());

        var items = snapshots
            .OrderByDescending(x => x.PeriodEndDateExclusive, StringComparer.Ordinal)
            .ThenByDescending(x => x.CreatedAtUtc)
            .Select(snapshot =>
            {
                var key = $"{snapshot.PeriodStartDate}|{snapshot.PeriodEndDateExclusive}";
                paymentByPeriod.TryGetValue(key, out var payment);

                var paidAmount = payment?.Amount ?? 0m;
                var difference = snapshot.PeriodTotal - paidAmount;

                return new StatementPeriodItemResponse
                {
                    SnapshotId = snapshot.Id,
                    PeriodStartDate = snapshot.PeriodStartDate,
                    PeriodEndDateExclusive = snapshot.PeriodEndDateExclusive,
                    PeriodTotal = snapshot.PeriodTotal.ToString("0.00", CultureInfo.InvariantCulture),
                    HasPayment = payment is not null,
                    PaymentAmount = payment?.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                    PaymentDate = payment?.PaymentDate,
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
        var paymentForPeriod = await paymentRepository.GetByUserAndPeriodAsync(
            userId,
            snapshot.PeriodStartDate,
            snapshot.PeriodEndDateExclusive,
            cancellationToken);

        var allSnapshots = await calculationSnapshotRepository.GetByUserIdAsync(userId, cancellationToken);
        var allPayments = await paymentRepository.GetByUserIdAsync(userId, cancellationToken);

        var totalCalculatedCharges = allSnapshots.Sum(x => x.PeriodTotal);
        var totalRecordedPayments = allPayments.Sum(x => x.Amount);
        var currentBalance = totalCalculatedCharges - totalRecordedPayments;

        var periodPaidAmount = paymentForPeriod?.Amount ?? 0m;
        var periodDifference = snapshot.PeriodTotal - periodPaidAmount;

        return new LatestStatementSummaryResponse
        {
            UserId = userId,
            PeriodStartDate = snapshot.PeriodStartDate,
            PeriodEndDateExclusive = snapshot.PeriodEndDateExclusive,
            PeriodTotal = snapshot.PeriodTotal.ToString("0.00", CultureInfo.InvariantCulture),
            HasPayment = paymentForPeriod is not null,
            PaymentId = paymentForPeriod?.Id,
            PaymentAmount = paymentForPeriod?.Amount.ToString("0.00", CultureInfo.InvariantCulture),
            PaymentDate = paymentForPeriod?.PaymentDate,
            PaymentMethod = paymentForPeriod?.Method,
            PeriodDifference = periodDifference.ToString("0.00", CultureInfo.InvariantCulture),
            PeriodBalanceStatus = ToBalanceStatus(periodDifference),
            TotalCalculatedCharges = totalCalculatedCharges.ToString("0.00", CultureInfo.InvariantCulture),
            TotalRecordedPayments = totalRecordedPayments.ToString("0.00", CultureInfo.InvariantCulture),
            CurrentBalance = currentBalance.ToString("0.00", CultureInfo.InvariantCulture),
            CurrentBalanceStatus = ToBalanceStatus(currentBalance),
            ContainsEstimatedSegments = snapshot.ContainsEstimatedSegments,
            EngineVersion = snapshot.EngineVersion,
            InputHash = snapshot.InputHash,
            EquationSummary = snapshot.EquationSummary,
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
