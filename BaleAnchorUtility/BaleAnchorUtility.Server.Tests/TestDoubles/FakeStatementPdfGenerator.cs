using System.Text;
using BaleAnchorUtility.Server.Application.Abstractions;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class FakeStatementPdfGenerator : IStatementPdfGenerator
{
    public Task<GeneratedPdfDocument> GeneratePeriodStatementAsync(StatementPdfModel model, CancellationToken cancellationToken)
    {
        var payload = Encoding.UTF8.GetBytes($"FAKE_PDF:{model.PeriodStartDate}:{model.PeriodEndDateExclusive}:{model.PeriodTotal}");
        return Task.FromResult(new GeneratedPdfDocument
        {
            Content = payload,
            ContentType = "application/pdf",
        });
    }
}
