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
    public string? PaymentDate { get; init; }
    public string? PaymentMethod { get; init; }
    public required string PeriodDifference { get; init; }
    public required string PeriodBalanceStatus { get; init; }
    public required string TotalCalculatedCharges { get; init; }
    public required string TotalRecordedPayments { get; init; }
    public required string CurrentBalance { get; init; }
    public required string CurrentBalanceStatus { get; init; }
    public required bool ContainsEstimatedSegments { get; init; }
    public required string EngineVersion { get; init; }
    public required string InputHash { get; init; }
    public required string EquationSummary { get; init; }
    public required string GeneratedAtUtcIso { get; init; }
}

public sealed class GeneratedPdfDocument
{
    public required byte[] Content { get; init; }
    public required string ContentType { get; init; }
    public required string TemplateVersion { get; init; }
    public required string RendererVersion { get; init; }
}
