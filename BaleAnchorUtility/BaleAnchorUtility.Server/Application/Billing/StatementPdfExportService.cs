using BaleAnchorUtility.Server.Application.Abstractions;

namespace BaleAnchorUtility.Server.Application.Billing;

public sealed class StatementPdfExportService
{
    private readonly StatementSummaryService statementSummaryService;
    private readonly IStatementPdfGenerator statementPdfGenerator;
    private readonly ISystemClock clock;

    public StatementPdfExportService(
        StatementSummaryService statementSummaryService,
        IStatementPdfGenerator statementPdfGenerator,
        ISystemClock clock)
    {
        this.statementSummaryService = statementSummaryService;
        this.statementPdfGenerator = statementPdfGenerator;
        this.clock = clock;
    }

    public async Task<GeneratedStatementPdfResponse> ExportSelectedPeriodPdfAsync(
        string userId,
        string? snapshotId,
        string? periodStartDate,
        string? periodEndDateExclusive,
        CancellationToken cancellationToken)
    {
        var summary = await statementSummaryService.GetSelectedSummaryAsync(
            userId,
            snapshotId,
            periodStartDate,
            periodEndDateExclusive,
            cancellationToken);

        var model = new StatementPdfModel
        {
            UserId = summary.UserId,
            PeriodStartDate = summary.PeriodStartDate,
            PeriodEndDateExclusive = summary.PeriodEndDateExclusive,
            PeriodTotal = summary.PeriodTotal,
            PaymentAmount = summary.PaymentAmount,
            PeriodDifference = summary.PeriodDifference,
            PeriodBalanceStatus = summary.PeriodBalanceStatus,
            CurrentBalance = summary.CurrentBalance,
            CurrentBalanceStatus = summary.CurrentBalanceStatus,
            GeneratedAtUtcIso = clock.UtcNow.UtcDateTime.ToString("yyyy-MM-ddTHH:mm:ssZ"),
        };

        var document = await statementPdfGenerator.GeneratePeriodStatementAsync(model, cancellationToken);

        var fileName = $"statement-{summary.PeriodStartDate}-to-{summary.PeriodEndDateExclusive}.pdf";
        return new GeneratedStatementPdfResponse
        {
            FileName = fileName,
            ContentType = document.ContentType,
            Content = document.Content,
        };
    }
}

public sealed class GeneratedStatementPdfResponse
{
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required byte[] Content { get; init; }
}
