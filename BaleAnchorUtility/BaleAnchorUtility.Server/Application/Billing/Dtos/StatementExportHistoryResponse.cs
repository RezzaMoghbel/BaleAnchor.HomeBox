namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class StatementExportHistoryResponse
{
    public string UserId { get; init; } = string.Empty;
    public int Count { get; init; }
    public IReadOnlyList<StatementExportHistoryItemResponse> Items { get; init; } = [];
}
