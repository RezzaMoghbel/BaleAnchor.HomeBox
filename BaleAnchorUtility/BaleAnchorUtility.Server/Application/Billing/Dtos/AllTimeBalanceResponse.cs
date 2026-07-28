namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class AllTimeBalanceResponse
{
    public string UserId { get; init; } = string.Empty;
    public string TotalCalculatedCharges { get; init; } = string.Empty;
    public string TotalRecordedPayments { get; init; } = string.Empty;
    public string Balance { get; init; } = string.Empty;
    public string BalanceStatus { get; init; } = string.Empty;
}
