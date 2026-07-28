using System.Text;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Infrastructure.Pdf;

namespace BaleAnchorUtility.Server.Tests.Infrastructure.Pdf;

public sealed class PlaceholderStatementPdfGeneratorTests
{
    [Fact]
    public async Task GeneratePeriodStatementAsync_ReturnsPdfBytes()
    {
        var generator = new PlaceholderStatementPdfGenerator();

        var document = await generator.GeneratePeriodStatementAsync(
            new StatementPdfModel
            {
                UserId = "u1",
                PeriodStartDate = "2026-07-01",
                PeriodEndDateExclusive = "2026-08-01",
                PeriodTotal = "40.00",
                PaymentAmount = "25.00",
                PaymentDate = "2026-08-02",
                PaymentMethod = "Direct Debit",
                PeriodDifference = "15.00",
                PeriodBalanceStatus = "Amount outstanding",
                TotalCalculatedCharges = "40.00",
                TotalRecordedPayments = "25.00",
                CurrentBalance = "15.00",
                CurrentBalanceStatus = "Amount outstanding",
                ContainsEstimatedSegments = false,
                EngineVersion = "calc-engine-v1",
                InputHash = "hash",
                EquationSummary = "eq",
                GeneratedAtUtcIso = "2026-08-10T10:00:00Z",
            },
            CancellationToken.None);

        Assert.Equal("application/pdf", document.ContentType);
        Assert.Equal("statement-template-v2", document.TemplateVersion);
        Assert.Equal("questpdf-statement-v1", document.RendererVersion);
        Assert.StartsWith("%PDF-", Encoding.ASCII.GetString(document.Content));
    }
}