namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class AdminDecisionResponse
{
    public required string UserId { get; init; }
    public required string NewStatus { get; init; }
    public required string Message { get; init; }
}
