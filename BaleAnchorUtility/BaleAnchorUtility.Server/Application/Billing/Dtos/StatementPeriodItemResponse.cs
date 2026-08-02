namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class StatementPeriodItemResponse
{
    public string SnapshotId { get; init; } = string.Empty;
    public string PeriodStartDate { get; init; } = string.Empty;
    public string PeriodEndDateExclusive { get; init; } = string.Empty;
    public string PeriodTotal { get; init; } = string.Empty;
    public bool HasPayment { get; init; }
    public string? PaymentId { get; init; }
    public string? PaymentAmount { get; init; }
    public string? PaymentDate { get; init; }
    public int LinkedPaymentCount { get; init; }
    public IReadOnlyList<LinkedPaymentItemResponse> LinkedPayments { get; init; } = [];
    public string PeriodDifference { get; init; } = string.Empty;
    public string PeriodBalanceStatus { get; init; } = string.Empty;
    public bool ContainsEstimatedSegments { get; init; }
}
