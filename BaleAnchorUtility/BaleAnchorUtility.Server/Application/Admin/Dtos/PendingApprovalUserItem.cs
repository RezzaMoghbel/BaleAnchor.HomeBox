namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class PendingApprovalUserItem
{
    public required string UserId { get; init; }
    public required string EmailMasked { get; init; }
    public required string SubmittedState { get; init; }
    public required string UpdatedAtUtc { get; init; }
}
