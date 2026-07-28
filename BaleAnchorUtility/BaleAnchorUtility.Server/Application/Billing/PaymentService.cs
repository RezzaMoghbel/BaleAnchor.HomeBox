using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Billing.Dtos;
using BaleAnchorUtility.Server.Domain.Audit;
using BaleAnchorUtility.Server.Domain.Billing;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Billing;

public sealed class PaymentService
{
    private readonly IUserRepository userRepository;
    private readonly ICalculationSnapshotRepository calculationSnapshotRepository;
    private readonly IPaymentRepository paymentRepository;
    private readonly IAuditLogRepository auditLogRepository;
    private readonly ISystemClock clock;
    private readonly ILogger<PaymentService> logger;

    public PaymentService(
        IUserRepository userRepository,
        ICalculationSnapshotRepository calculationSnapshotRepository,
        IPaymentRepository paymentRepository,
        IAuditLogRepository auditLogRepository,
        ISystemClock clock,
        ILogger<PaymentService> logger)
    {
        this.userRepository = userRepository;
        this.calculationSnapshotRepository = calculationSnapshotRepository;
        this.paymentRepository = paymentRepository;
        this.auditLogRepository = auditLogRepository;
        this.clock = clock;
        this.logger = logger;
    }

    public async Task<RecordLatestPeriodPaymentResponse> RecordLatestPeriodPaymentAsync(
        string userId,
        RecordLatestPeriodPaymentRequest request,
        CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);
        var latestSnapshot = await calculationSnapshotRepository.GetLatestByUserIdAsync(user.Id, cancellationToken)
            ?? throw new InvalidOperationException("A calculation snapshot is required before recording payment.");

        var amount = ParseAmount(request.Amount);
        var paymentDate = ParseDate(request.PaymentDate, "Payment date must use yyyy-MM-dd format.");
        if (paymentDate > DateOnly.FromDateTime(clock.UtcNow.UtcDateTime))
        {
            throw new InvalidOperationException("Payment date cannot be in the future.");
        }

        var method = request.Method.Trim();
        if (method.Length < 2 || method.Length > 40)
        {
            throw new ArgumentException("Payment method must be between 2 and 40 characters.", nameof(request.Method));
        }

        var existing = await paymentRepository.GetByUserAndPeriodAsync(
            user.Id,
            latestSnapshot.PeriodStartDate,
            latestSnapshot.PeriodEndDateExclusive,
            cancellationToken);

        if (existing is not null)
        {
            throw new InvalidOperationException("A payment already exists for this period.");
        }

        var now = clock.UtcNow;
        var payment = new PaymentRecord
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = user.Id,
            PeriodStartDate = latestSnapshot.PeriodStartDate,
            PeriodEndDateExclusive = latestSnapshot.PeriodEndDateExclusive,
            Amount = amount,
            PaymentDate = paymentDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            Method = method,
            Reference = NormalizeOptional(request.Reference, 100, nameof(request.Reference)),
            Notes = NormalizeOptional(request.Notes, 300, nameof(request.Notes)),
            Source = "Resident",
            VerificationStatus = "Unverified",
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        };

        await paymentRepository.AddAsync(payment, cancellationToken);
        await auditLogRepository.AddAsync(
            new AuditLogEntry
            {
                Id = Guid.NewGuid().ToString("N"),
                ActorUserId = user.Id,
                TargetUserId = user.Id,
                Category = "PAYMENT",
                Action = "CREATE_PAYMENT",
                Reason = "Payment recorded by resident",
                Metadata = $"period:{payment.PeriodStartDate}_{payment.PeriodEndDateExclusive};amount:{payment.Amount.ToString("0.00", CultureInfo.InvariantCulture)}",
                CreatedAtUtc = now,
                Version = 1,
            },
            cancellationToken);

        logger.LogInformation("Payment {PaymentId} created for user {UserId} period {PeriodStart}..{PeriodEnd}.", payment.Id, user.Id, payment.PeriodStartDate, payment.PeriodEndDateExclusive);

        return new RecordLatestPeriodPaymentResponse
        {
            PaymentId = payment.Id,
            UserId = payment.UserId,
            PeriodStartDate = payment.PeriodStartDate,
            PeriodEndDateExclusive = payment.PeriodEndDateExclusive,
            Amount = payment.Amount.ToString("0.00", CultureInfo.InvariantCulture),
            PaymentDate = payment.PaymentDate,
            Method = payment.Method,
            Reference = payment.Reference,
            Notes = payment.Notes,
            Source = payment.Source,
            VerificationStatus = payment.VerificationStatus,
            Message = "Payment recorded by resident.",
        };
    }

    public async Task<LatestPeriodPaymentSummaryResponse> GetLatestPeriodSummaryAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);
        var latestSnapshot = await calculationSnapshotRepository.GetLatestByUserIdAsync(user.Id, cancellationToken)
            ?? throw new InvalidOperationException("No calculation snapshot is available yet.");

        var payment = await paymentRepository.GetByUserAndPeriodAsync(
            user.Id,
            latestSnapshot.PeriodStartDate,
            latestSnapshot.PeriodEndDateExclusive,
            cancellationToken);

        var paidAmount = payment?.Amount ?? 0m;
        var periodDifference = latestSnapshot.PeriodTotal - paidAmount;

        return new LatestPeriodPaymentSummaryResponse
        {
            UserId = user.Id,
            PeriodStartDate = latestSnapshot.PeriodStartDate,
            PeriodEndDateExclusive = latestSnapshot.PeriodEndDateExclusive,
            PeriodTotal = latestSnapshot.PeriodTotal.ToString("0.00", CultureInfo.InvariantCulture),
            HasPayment = payment is not null,
            PaymentId = payment?.Id,
            PaymentAmount = payment?.Amount.ToString("0.00", CultureInfo.InvariantCulture),
            PaymentDate = payment?.PaymentDate,
            PaymentMethod = payment?.Method,
            PeriodDifference = periodDifference.ToString("0.00", CultureInfo.InvariantCulture),
            PeriodBalanceStatus = ToBalanceStatus(periodDifference),
        };
    }

    public async Task<AllTimeBalanceResponse> GetAllTimeBalanceAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);

        var snapshots = await calculationSnapshotRepository.GetByUserIdAsync(user.Id, cancellationToken);
        var payments = await paymentRepository.GetByUserIdAsync(user.Id, cancellationToken);

        var totalCharges = snapshots.Sum(x => x.PeriodTotal);
        var totalPayments = payments.Sum(x => x.Amount);
        var balance = totalCharges - totalPayments;

        return new AllTimeBalanceResponse
        {
            UserId = user.Id,
            TotalCalculatedCharges = totalCharges.ToString("0.00", CultureInfo.InvariantCulture),
            TotalRecordedPayments = totalPayments.ToString("0.00", CultureInfo.InvariantCulture),
            Balance = balance.ToString("0.00", CultureInfo.InvariantCulture),
            BalanceStatus = ToBalanceStatus(balance),
        };
    }

    public async Task<PaymentHistoryResponse> GetPaymentHistoryAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);
        var payments = await paymentRepository.GetByUserIdAsync(user.Id, cancellationToken);

        var items = payments
            .OrderByDescending(x => x.PeriodEndDateExclusive, StringComparer.Ordinal)
            .ThenByDescending(x => x.PaymentDate, StringComparer.Ordinal)
            .ThenByDescending(x => x.UpdatedAtUtc)
            .Select(x => new PaymentHistoryItemResponse
            {
                PaymentId = x.Id,
                PeriodStartDate = x.PeriodStartDate,
                PeriodEndDateExclusive = x.PeriodEndDateExclusive,
                Amount = x.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                PaymentDate = x.PaymentDate,
                Method = x.Method,
                Reference = x.Reference,
                Notes = x.Notes,
                Source = x.Source,
                VerificationStatus = x.VerificationStatus,
            })
            .ToList();

        return new PaymentHistoryResponse
        {
            UserId = user.Id,
            Count = items.Count,
            Items = items,
        };
    }

    public async Task<DeletePaymentResponse> DeletePaymentAsync(string userId, string paymentId, CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);
        if (string.IsNullOrWhiteSpace(paymentId))
        {
            throw new ArgumentException("Payment id is required.", nameof(paymentId));
        }

        var payment = await paymentRepository.GetByIdAsync(paymentId, cancellationToken)
            ?? throw new KeyNotFoundException("The requested payment was not found.");

        if (!string.Equals(payment.UserId, user.Id, StringComparison.Ordinal))
        {
            throw new KeyNotFoundException("The requested payment was not found.");
        }

        var latest = await paymentRepository.GetLatestByUserIdAsync(user.Id, cancellationToken)
            ?? throw new InvalidOperationException("No payment exists to delete.");

        if (!string.Equals(latest.Id, payment.Id, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Only the latest payment can be deleted.");
        }

        await paymentRepository.DeleteAsync(payment.Id, cancellationToken);

        var now = clock.UtcNow;
        await auditLogRepository.AddAsync(
            new AuditLogEntry
            {
                Id = Guid.NewGuid().ToString("N"),
                ActorUserId = user.Id,
                TargetUserId = user.Id,
                Category = "PAYMENT",
                Action = "DELETE_PAYMENT",
                Reason = "Latest payment deleted by resident",
                Metadata = $"paymentId:{payment.Id};period:{payment.PeriodStartDate}_{payment.PeriodEndDateExclusive};amount:{payment.Amount.ToString("0.00", CultureInfo.InvariantCulture)}",
                CreatedAtUtc = now,
                Version = 1,
            },
            cancellationToken);

        logger.LogInformation("Payment {PaymentId} deleted for user {UserId}.", payment.Id, user.Id);

        return new DeletePaymentResponse
        {
            PaymentId = payment.Id,
            UserId = user.Id,
            Message = "The latest payment was deleted successfully.",
        };
    }

    public async Task<UpdatePaymentResponse> UpdatePaymentAsync(
        string userId,
        string paymentId,
        UpdatePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);

        if (string.IsNullOrWhiteSpace(paymentId))
        {
            throw new ArgumentException("Payment id is required.", nameof(paymentId));
        }

        var payment = await paymentRepository.GetByIdAsync(paymentId, cancellationToken)
            ?? throw new KeyNotFoundException("The requested payment was not found.");

        if (!string.Equals(payment.UserId, user.Id, StringComparison.Ordinal))
        {
            throw new KeyNotFoundException("The requested payment was not found.");
        }

        var amount = ParseAmount(request.Amount);
        var paymentDate = ParseDate(request.PaymentDate, "Payment date must use yyyy-MM-dd format.");
        if (paymentDate > DateOnly.FromDateTime(clock.UtcNow.UtcDateTime))
        {
            throw new InvalidOperationException("Payment date cannot be in the future.");
        }

        var method = request.Method.Trim();
        if (method.Length < 2 || method.Length > 40)
        {
            throw new ArgumentException("Payment method must be between 2 and 40 characters.", nameof(request.Method));
        }

        payment.Amount = amount;
        payment.PaymentDate = paymentDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        payment.Method = method;
        payment.Reference = NormalizeOptional(request.Reference, 100, nameof(request.Reference));
        payment.Notes = NormalizeOptional(request.Notes, 300, nameof(request.Notes));
        payment.UpdatedAtUtc = clock.UtcNow;
        payment.Version += 1;

        await paymentRepository.AddAsync(payment, cancellationToken);
        await auditLogRepository.AddAsync(
            new AuditLogEntry
            {
                Id = Guid.NewGuid().ToString("N"),
                ActorUserId = user.Id,
                TargetUserId = user.Id,
                Category = "PAYMENT",
                Action = "UPDATE_PAYMENT",
                Reason = "Payment updated by resident",
                Metadata = $"paymentId:{payment.Id};period:{payment.PeriodStartDate}_{payment.PeriodEndDateExclusive};amount:{payment.Amount.ToString("0.00", CultureInfo.InvariantCulture)}",
                CreatedAtUtc = clock.UtcNow,
                Version = 1,
            },
            cancellationToken);

        logger.LogInformation("Payment {PaymentId} updated for user {UserId}.", payment.Id, user.Id);

        return new UpdatePaymentResponse
        {
            PaymentId = payment.Id,
            UserId = payment.UserId,
            PeriodStartDate = payment.PeriodStartDate,
            PeriodEndDateExclusive = payment.PeriodEndDateExclusive,
            Amount = payment.Amount.ToString("0.00", CultureInfo.InvariantCulture),
            PaymentDate = payment.PaymentDate,
            Method = payment.Method,
            Reference = payment.Reference,
            Notes = payment.Notes,
            Source = payment.Source,
            VerificationStatus = payment.VerificationStatus,
            Message = "Payment updated.",
        };
    }

    private async Task<UserAccount> GetEligibleUserAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User record was not found for this session.");

        if (user.Status != UserAccountStatus.Active)
        {
            throw new InvalidOperationException("Only active accounts can manage payments.");
        }

        return user;
    }

    private static decimal ParseAmount(string rawAmount)
    {
        if (!decimal.TryParse(rawAmount, NumberStyles.Number, CultureInfo.InvariantCulture, out var amount))
        {
            throw new InvalidOperationException("Payment amount is invalid.");
        }

        if (amount <= 0m)
        {
            throw new InvalidOperationException("Payment amount must be greater than zero.");
        }

        return decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
    }

    private static DateOnly ParseDate(string rawValue, string message)
    {
        if (!DateOnly.TryParseExact(rawValue, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var value))
        {
            throw new InvalidOperationException(message);
        }

        return value;
    }

    private static string? NormalizeOptional(string? value, int maxLength, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        if (trimmed.Length > maxLength)
        {
            throw new ArgumentException($"Value cannot exceed {maxLength} characters.", paramName);
        }

        return trimmed;
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
