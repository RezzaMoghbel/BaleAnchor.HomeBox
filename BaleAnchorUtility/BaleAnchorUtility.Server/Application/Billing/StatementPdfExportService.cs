using BaleAnchorUtility.Server.Application.Abstractions;
using System.Security.Cryptography;
using System.Globalization;
using BaleAnchorUtility.Server.Application.Billing.Dtos;
using BaleAnchorUtility.Server.Domain.Billing;

namespace BaleAnchorUtility.Server.Application.Billing;

public sealed class StatementPdfExportService
{
    private readonly StatementSummaryService statementSummaryService;
    private readonly IStatementPdfGenerator statementPdfGenerator;
    private readonly IStatementExportRepository statementExportRepository;
    private readonly ICalculationSnapshotRepository calculationSnapshotRepository;
    private readonly ISystemClock clock;

    public StatementPdfExportService(
        StatementSummaryService statementSummaryService,
        IStatementPdfGenerator statementPdfGenerator,
        IStatementExportRepository statementExportRepository,
        ICalculationSnapshotRepository calculationSnapshotRepository,
        ISystemClock clock)
    {
        this.statementSummaryService = statementSummaryService;
        this.statementPdfGenerator = statementPdfGenerator;
        this.statementExportRepository = statementExportRepository;
        this.calculationSnapshotRepository = calculationSnapshotRepository;
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
        var now = clock.UtcNow;
        var snapshot = await calculationSnapshotRepository.GetByUserAndPeriodAsync(
            summary.UserId,
            summary.PeriodStartDate,
            summary.PeriodEndDateExclusive,
            cancellationToken)
            ?? throw new InvalidOperationException("Unable to resolve snapshot for statement export.");

        var exportRecord = new StatementExportRecord
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = summary.UserId,
            SnapshotId = snapshot.Id,
            PeriodStartDate = summary.PeriodStartDate,
            PeriodEndDateExclusive = summary.PeriodEndDateExclusive,
            FileName = fileName,
            ContentType = document.ContentType,
            ContentSha256 = ComputeSha256(document.Content),
            TemplateVersion = document.TemplateVersion,
            RendererVersion = document.RendererVersion,
            CreatedAtUtc = now,
            Version = 1,
        };

        await statementExportRepository.AddAsync(exportRecord, cancellationToken);

        return new GeneratedStatementPdfResponse
        {
            ExportId = exportRecord.Id,
            FileName = fileName,
            ContentType = document.ContentType,
            Content = document.Content,
            TemplateVersion = document.TemplateVersion,
            RendererVersion = document.RendererVersion,
            ContentSha256 = exportRecord.ContentSha256,
        };
    }

    public async Task<StatementExportHistoryResponse> GetExportHistoryAsync(string userId, CancellationToken cancellationToken)
    {
        _ = await statementSummaryService.GetStatementPeriodsAsync(userId, cancellationToken);
        var records = await statementExportRepository.GetByUserIdAsync(userId, cancellationToken);

        var items = records
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new StatementExportHistoryItemResponse
            {
                ExportId = x.Id,
                SnapshotId = x.SnapshotId,
                PeriodStartDate = x.PeriodStartDate,
                PeriodEndDateExclusive = x.PeriodEndDateExclusive,
                FileName = x.FileName,
                ContentType = x.ContentType,
                ContentSha256 = x.ContentSha256,
                TemplateVersion = x.TemplateVersion,
                RendererVersion = x.RendererVersion,
                CreatedAtUtc = x.CreatedAtUtc.UtcDateTime.ToString("yyyy-MM-ddTHH:mm:ssZ", CultureInfo.InvariantCulture),
            })
            .ToList();

        return new StatementExportHistoryResponse
        {
            UserId = userId,
            Count = items.Count,
            Items = items,
        };
    }

    private static string ComputeSha256(byte[] content)
    {
        var hash = SHA256.HashData(content);
        return Convert.ToHexString(hash);
    }
}

public sealed class GeneratedStatementPdfResponse
{
    public required string ExportId { get; init; }
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required byte[] Content { get; init; }
    public required string TemplateVersion { get; init; }
    public required string RendererVersion { get; init; }
    public required string ContentSha256 { get; init; }
}
