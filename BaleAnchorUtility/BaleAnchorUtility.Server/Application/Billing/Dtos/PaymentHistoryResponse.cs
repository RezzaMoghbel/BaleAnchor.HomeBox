namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class PaymentHistoryResponse
{
    public string UserId { get; init; } = string.Empty;
    public int Count { get; init; }
    public IReadOnlyList<PaymentHistoryItemResponse> Items { get; init; } = [];
}
