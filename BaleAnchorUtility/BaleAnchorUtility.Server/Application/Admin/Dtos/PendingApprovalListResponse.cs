namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class PendingApprovalListResponse
{
    public required IReadOnlyList<PendingApprovalUserItem> Items { get; init; }
    public int Count { get; init; }
}
