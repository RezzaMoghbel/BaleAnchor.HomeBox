using System.Text;
using BaleAnchorUtility.Server.Application.Abstractions;

namespace BaleAnchorUtility.Server.Infrastructure.Pdf;

public sealed class PlaceholderStatementPdfGenerator : IStatementPdfGenerator
{
    private const string TemplateVersion = "statement-template-v1";
    private const string RendererVersion = "placeholder-pdf-v1";

    public Task<GeneratedPdfDocument> GeneratePeriodStatementAsync(StatementPdfModel model, CancellationToken cancellationToken)
    {
        var lines = new[]
        {
            "BaleAnchor Utility Statement",
            $"User: {model.UserId}",
            $"Period: {model.PeriodStartDate} to {model.PeriodEndDateExclusive}",
            $"Period total: GBP {model.PeriodTotal}",
            $"Payment: GBP {model.PaymentAmount ?? "0.00"}",
            $"Period difference: GBP {model.PeriodDifference} ({model.PeriodBalanceStatus})",
            $"Current balance: GBP {model.CurrentBalance} ({model.CurrentBalanceStatus})",
            $"Generated UTC: {model.GeneratedAtUtcIso}",
        };

        var bytes = BuildSinglePagePdf(lines);
        return Task.FromResult(new GeneratedPdfDocument
        {
            Content = bytes,
            ContentType = "application/pdf",
            TemplateVersion = TemplateVersion,
            RendererVersion = RendererVersion,
        });
    }

    private static byte[] BuildSinglePagePdf(IReadOnlyList<string> lines)
    {
        const string header = "%PDF-1.4\n";

        var escapedLines = lines
            .Select(EscapePdfText)
            .ToList();

        var contentBuilder = new StringBuilder();
        contentBuilder.AppendLine("BT");
        contentBuilder.AppendLine("/F1 12 Tf");
        contentBuilder.AppendLine("40 800 Td");

        for (var i = 0; i < escapedLines.Count; i++)
        {
            if (i == 0)
            {
                contentBuilder.Append('(').Append(escapedLines[i]).AppendLine(") Tj");
            }
            else
            {
                contentBuilder.AppendLine("0 -18 Td");
                contentBuilder.Append('(').Append(escapedLines[i]).AppendLine(") Tj");
            }
        }

        contentBuilder.AppendLine("ET");
        var streamText = contentBuilder.ToString();
        var streamBytes = Encoding.ASCII.GetBytes(streamText);

        var objects = new List<string>
        {
            "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
            "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
            $"4 0 obj\n<< /Length {streamBytes.Length} >>\nstream\n{streamText}endstream\nendobj\n",
            "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        };

        var allBuilder = new StringBuilder();
        allBuilder.Append(header);

        var offsets = new List<int> { 0 };
        for (var i = 0; i < objects.Count; i++)
        {
            offsets.Add(Encoding.ASCII.GetByteCount(allBuilder.ToString()));
            allBuilder.Append(objects[i]);
        }

        var xrefStart = Encoding.ASCII.GetByteCount(allBuilder.ToString());
        allBuilder.Append("xref\n");
        allBuilder.Append($"0 {objects.Count + 1}\n");
        allBuilder.Append("0000000000 65535 f \n");
        for (var i = 1; i <= objects.Count; i++)
        {
            allBuilder.Append(offsets[i].ToString("D10"));
            allBuilder.Append(" 00000 n \n");
        }

        allBuilder.Append("trailer\n");
        allBuilder.Append($"<< /Size {objects.Count + 1} /Root 1 0 R >>\n");
        allBuilder.Append("startxref\n");
        allBuilder.Append(xrefStart);
        allBuilder.Append("\n%%EOF\n");

        return Encoding.ASCII.GetBytes(allBuilder.ToString());
    }

    private static string EscapePdfText(string value)
    {
        return value
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("(", "\\(", StringComparison.Ordinal)
            .Replace(")", "\\)", StringComparison.Ordinal);
    }
}
