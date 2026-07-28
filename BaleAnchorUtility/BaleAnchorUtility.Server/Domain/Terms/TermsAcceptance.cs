namespace BaleAnchorUtility.Server.Domain.Terms;

public sealed class TermsAcceptance
{
    public required string Id { get; init; }
    public required string UserId { get; set; }
    public required string TermsVersionId { get; set; }
    public DateTimeOffset AcceptedAtUtc { get; set; }
    public required string AcceptedFromIp { get; set; }
    public required string AcceptedUserAgent { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
