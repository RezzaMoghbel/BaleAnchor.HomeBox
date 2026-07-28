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
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User record was not found for this session.");

        if (user.Status != UserAccountStatus.Active)
        {
            throw new InvalidOperationException("Only active accounts can view statement summaries.");
        }

        var latestSnapshot = await calculationSnapshotRepository.GetLatestByUserIdAsync(user.Id, cancellationToken)
            ?? throw new InvalidOperationException("No calculation snapshot is available yet.");

        var paymentForPeriod = await paymentRepository.GetByUserAndPeriodAsync(
            user.Id,
            latestSnapshot.PeriodStartDate,
            latestSnapshot.PeriodEndDateExclusive,
            cancellationToken);

        var allSnapshots = await calculationSnapshotRepository.GetByUserIdAsync(user.Id, cancellationToken);
        var allPayments = await paymentRepository.GetByUserIdAsync(user.Id, cancellationToken);

        var totalCalculatedCharges = allSnapshots.Sum(x => x.PeriodTotal);
        var totalRecordedPayments = allPayments.Sum(x => x.Amount);
        var currentBalance = totalCalculatedCharges - totalRecordedPayments;

        var periodPaidAmount = paymentForPeriod?.Amount ?? 0m;
        var periodDifference = latestSnapshot.PeriodTotal - periodPaidAmount;

        return new LatestStatementSummaryResponse
        {
            UserId = user.Id,
            PeriodStartDate = latestSnapshot.PeriodStartDate,
            PeriodEndDateExclusive = latestSnapshot.PeriodEndDateExclusive,
            PeriodTotal = latestSnapshot.PeriodTotal.ToString("0.00", CultureInfo.InvariantCulture),
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
            ContainsEstimatedSegments = latestSnapshot.ContainsEstimatedSegments,
            EngineVersion = latestSnapshot.EngineVersion,
            InputHash = latestSnapshot.InputHash,
            EquationSummary = latestSnapshot.EquationSummary,
        };
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
