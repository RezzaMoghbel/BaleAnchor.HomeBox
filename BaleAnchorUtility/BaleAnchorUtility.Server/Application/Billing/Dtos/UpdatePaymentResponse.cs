namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class UpdatePaymentResponse
{
    public string PaymentId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string PeriodStartDate { get; init; } = string.Empty;
    public string PeriodEndDateExclusive { get; init; } = string.Empty;
    public string Amount { get; init; } = string.Empty;
    public string PaymentDate { get; init; } = string.Empty;
    public string Method { get; init; } = string.Empty;
    public string? Reference { get; init; }
    public string? Notes { get; init; }
    public string Source { get; init; } = string.Empty;
    public string VerificationStatus { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}
