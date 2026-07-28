namespace BaleAnchorUtility.Server.Domain.Billing;

public sealed class StatementExportRecord
{
    public required string Id { get; init; }
    public required string UserId { get; set; }
    public required string SnapshotId { get; set; }
    public required string PeriodStartDate { get; set; }
    public required string PeriodEndDateExclusive { get; set; }
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public required string ContentSha256 { get; set; }
    public required string TemplateVersion { get; set; }
    public required string RendererVersion { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public int Version { get; set; }
}
