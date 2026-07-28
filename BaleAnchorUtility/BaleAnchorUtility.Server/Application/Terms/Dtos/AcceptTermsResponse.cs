namespace BaleAnchorUtility.Server.Application.Terms.Dtos;

public sealed class AcceptTermsResponse
{
    public required string TermsVersionId { get; init; }
    public required string AcceptedAtUtc { get; init; }
    public required string Message { get; init; }
}
