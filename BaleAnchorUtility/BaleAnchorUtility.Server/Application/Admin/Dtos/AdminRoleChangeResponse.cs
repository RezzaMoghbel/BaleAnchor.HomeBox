namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class AdminRoleChangeResponse
{
    public required string UserId { get; init; }
    public required string PreviousRole { get; init; }
    public required string NewRole { get; init; }
    public required string Message { get; init; }
}
