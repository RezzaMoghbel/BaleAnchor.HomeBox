namespace BaleAnchorUtility.Server.Application.Onboarding.Dtos;

public sealed class CompleteUtilitySetupResponse
{
    public required string UserId { get; init; }
    public required string Status { get; init; }
    public required string Message { get; init; }
}
