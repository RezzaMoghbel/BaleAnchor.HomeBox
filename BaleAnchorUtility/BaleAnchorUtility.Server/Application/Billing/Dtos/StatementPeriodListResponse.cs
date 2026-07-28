namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class StatementPeriodListResponse
{
    public string UserId { get; init; } = string.Empty;
    public int Count { get; init; }
    public IReadOnlyList<StatementPeriodItemResponse> Items { get; init; } = [];
}
