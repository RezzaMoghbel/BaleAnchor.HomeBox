namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface IStatementPdfGenerator
{
    Task<GeneratedPdfDocument> GeneratePeriodStatementAsync(StatementPdfModel model, CancellationToken cancellationToken);
}

public sealed class StatementPdfModel
{
    public required string UserId { get; init; }
    public required string PeriodStartDate { get; init; }
    public required string PeriodEndDateExclusive { get; init; }
    public required string PeriodTotal { get; init; }
    public string? PaymentAmount { get; init; }
    public required string PeriodDifference { get; init; }
    public required string PeriodBalanceStatus { get; init; }
    public required string CurrentBalance { get; init; }
    public required string CurrentBalanceStatus { get; init; }
    public required string GeneratedAtUtcIso { get; init; }
}

public sealed class GeneratedPdfDocument
{
    public required byte[] Content { get; init; }
    public required string ContentType { get; init; }
    public required string TemplateVersion { get; init; }
    public required string RendererVersion { get; init; }
}
