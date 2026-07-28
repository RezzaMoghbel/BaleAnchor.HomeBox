namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class DeletePaymentResponse
{
    public string PaymentId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}
