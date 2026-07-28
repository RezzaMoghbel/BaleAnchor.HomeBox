namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class StatementExportHistoryItemResponse
{
    public string ExportId { get; init; } = string.Empty;
    public string SnapshotId { get; init; } = string.Empty;
    public string PeriodStartDate { get; init; } = string.Empty;
    public string PeriodEndDateExclusive { get; init; } = string.Empty;
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public string ContentSha256 { get; init; } = string.Empty;
    public string TemplateVersion { get; init; } = string.Empty;
    public string RendererVersion { get; init; } = string.Empty;
    public string CreatedAtUtc { get; init; } = string.Empty;
}
