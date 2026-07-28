namespace BaleAnchorUtility.Server.Application.Onboarding.Dtos;

public sealed class OnboardingProgressResponse
{
    public required string UserId { get; init; }
    public required string AccountStatus { get; init; }
    public bool TermsAccepted { get; init; }
    public bool ProfileComplete { get; init; }
    public bool UtilitySetupComplete { get; init; }
    public required string NextStep { get; init; }
}
