namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class LatestStatementSummaryResponse
{
    public string UserId { get; init; } = string.Empty;
    public string PeriodStartDate { get; init; } = string.Empty;
    public string PeriodEndDateExclusive { get; init; } = string.Empty;
    public string PeriodTotal { get; init; } = string.Empty;
    public bool HasPayment { get; init; }
    public string? PaymentId { get; init; }
    public string? PaymentAmount { get; init; }
    public string? PaymentDate { get; init; }
    public string? PaymentMethod { get; init; }
    public string PeriodDifference { get; init; } = string.Empty;
    public string PeriodBalanceStatus { get; init; } = string.Empty;
    public string TotalCalculatedCharges { get; init; } = string.Empty;
    public string TotalRecordedPayments { get; init; } = string.Empty;
    public string CurrentBalance { get; init; } = string.Empty;
    public string CurrentBalanceStatus { get; init; } = string.Empty;
    public bool ContainsEstimatedSegments { get; init; }
    public string EngineVersion { get; init; } = string.Empty;
    public string InputHash { get; init; } = string.Empty;
    public string EquationSummary { get; init; } = string.Empty;
}
