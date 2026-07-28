namespace BaleAnchorUtility.Server.Domain.Terms;

public sealed class TermsVersion
{
    public required string Id { get; init; }
    public required string VersionLabel { get; set; }
    public required string Title { get; set; }
    public required string ContentMarkdown { get; set; }
    public DateTimeOffset EffectiveFromUtc { get; set; }
    public DateTimeOffset PublishedAtUtc { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
