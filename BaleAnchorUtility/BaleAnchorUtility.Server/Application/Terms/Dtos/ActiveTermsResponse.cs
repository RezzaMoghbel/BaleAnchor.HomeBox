namespace BaleAnchorUtility.Server.Application.Terms.Dtos;

public sealed class ActiveTermsResponse
{
    public required string VersionId { get; init; }
    public required string VersionLabel { get; init; }
    public required string Title { get; init; }
    public required string ContentMarkdown { get; init; }
    public required string EffectiveFromUtc { get; init; }
    public required string PublishedAtUtc { get; init; }
}
