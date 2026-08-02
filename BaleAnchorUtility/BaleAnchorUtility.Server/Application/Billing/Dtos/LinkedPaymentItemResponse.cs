namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class LinkedPaymentItemResponse
{
    public string PaymentId { get; init; } = string.Empty;
    public string Amount { get; init; } = string.Empty;
    public string PaymentDate { get; init; } = string.Empty;
    public string Method { get; init; } = string.Empty;
    public string? Reference { get; init; }
    public string? Notes { get; init; }
    public string VerificationStatus { get; init; } = string.Empty;
}
