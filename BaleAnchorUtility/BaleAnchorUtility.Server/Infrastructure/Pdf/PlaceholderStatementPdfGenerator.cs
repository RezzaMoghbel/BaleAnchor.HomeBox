using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using BaleAnchorUtility.Server.Application.Abstractions;

namespace BaleAnchorUtility.Server.Infrastructure.Pdf;

public sealed class PlaceholderStatementPdfGenerator : IStatementPdfGenerator
{
    private const string TemplateVersion = "statement-template-v3";
    private const string RendererVersion = "questpdf-statement-v1";

    static PlaceholderStatementPdfGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public Task<GeneratedPdfDocument> GeneratePeriodStatementAsync(StatementPdfModel model, CancellationToken cancellationToken)
    {
        var bytes = BuildStatementPdf(model);
        return Task.FromResult(new GeneratedPdfDocument
        {
            Content = bytes,
            ContentType = "application/pdf",
            TemplateVersion = TemplateVersion,
            RendererVersion = RendererVersion,
        });
    }

    private static byte[] BuildStatementPdf(StatementPdfModel model)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(style => style.FontSize(10));

                page.Header().Column(header =>
                {
                    header.Spacing(4);
                    header.Item().Text("BaleAnchor Utility").FontSize(20).SemiBold();
                    header.Item().Text("Independent resident utility statement").FontSize(11);
                    header.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                page.Content().Column(content =>
                {
                    content.Spacing(14);

                    content.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(14).Column(section =>
                    {
                        section.Spacing(8);
                        section.Item().Text("Statement summary").FontSize(13).SemiBold();
                        section.Item().Row(row =>
                        {
                            row.RelativeItem().Element(container => AddSummaryField(container, "Statement reference", model.StatementReference));
                            row.RelativeItem().Element(container => AddSummaryField(container, "User", model.UserId));
                            row.RelativeItem().Element(container => AddSummaryField(container, "Period", $"{model.PeriodStartDate} to {model.PeriodEndDateExclusive}"));
                            row.RelativeItem().Element(container => AddSummaryField(container, "Generated UTC", model.GeneratedAtUtcIso));
                        });
                    });

                    content.Item().Row(row =>
                    {
                        row.Spacing(10);
                        row.RelativeItem().Element(container => AddMetricCard(container, "Period total", Currency(model.PeriodTotal), model.PeriodBalanceStatus));
                        row.RelativeItem().Element(container => AddMetricCard(container, "Payment", PaymentText(model.PaymentAmount), model.PaymentDate is null ? "No payment recorded" : $"{model.PaymentDate} · {model.PaymentMethod ?? "Resident"}"));
                        row.RelativeItem().Element(container => AddMetricCard(container, "Period difference", Currency(model.PeriodDifference), model.PeriodBalanceStatus));
                        row.RelativeItem().Element(container => AddMetricCard(container, "Current balance", Currency(model.CurrentBalance), model.CurrentBalanceStatus));
                    });

                    content.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(14).Column(section =>
                    {
                        section.Spacing(8);
                        section.Item().Text("Transparency and audit trail").FontSize(13).SemiBold();

                        section.Item().Row(row =>
                        {
                            row.RelativeItem().Column(column =>
                            {
                                column.Spacing(4);
                                column.Item().Text($"Total calculated charges: {Currency(model.TotalCalculatedCharges)}");
                                column.Item().Text($"Total recorded payments: {Currency(model.TotalRecordedPayments)}");
                                column.Item().Text($"Estimated segments: {(model.ContainsEstimatedSegments ? "Included" : "None")}");
                                if (model.ContainsEstimatedSegments && !string.IsNullOrWhiteSpace(model.EstimatedAllocationLabel))
                                {
                                    column.Item().Text(model.EstimatedAllocationLabel);
                                }

                                column.Item().Text($"Boiler kWh/m3: {model.BoilerAssumptions.BoilerKwhPerCubicMeter}");
                                column.Item().Text($"Boiler efficiency %: {model.BoilerAssumptions.BoilerEfficiencyPercent}");
                                column.Item().Text($"Engine version: {model.EngineVersion}");
                                column.Item().Text($"Rounding policy: {model.RoundingPolicyVersion}");
                                column.Item().Text($"Input hash: {model.InputHash}");
                                column.Item().Text($"Integrity checks: {(model.IntegrityChecksPassed ? "Passed" : "Failed")}");
                                column.Item().Text($"Integrity digest: {model.IntegrityDigest}");
                            });
                        });

                        section.Item().PaddingTop(6).Text("Equation summary").FontSize(11).SemiBold();
                        section.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Background(Colors.Grey.Lighten5).Padding(10).Text(model.EquationSummary);
                    });

                    content.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(14).Column(section =>
                    {
                        section.Spacing(8);
                        section.Item().Text("Component lines").FontSize(13).SemiBold();

                        foreach (var line in model.ComponentLines)
                        {
                            section.Item().Text($"{line.Component}: usage {line.Usage}, subtotal {Currency(line.UsageSubtotal)}, standing {Currency(line.StandingSubtotal)}, VAT {Currency(line.VatAmount)}, total {Currency(line.Total)}");
                            section.Item().Text($"Equation: {line.Equation}").FontSize(8).FontColor(Colors.Grey.Darken1);
                        }
                    });

                    content.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(14).Column(section =>
                    {
                        section.Spacing(8);
                        section.Item().Text("Tariff segments").FontSize(13).SemiBold();

                        foreach (var segment in model.TariffSegments)
                        {
                            section.Item().Text($"[{segment.StartDate}, {segment.EndDateExclusive}) days={segment.Days} estimated={(segment.IsEstimatedAllocation ? "yes" : "no")}");
                            section.Item().Text($"Water unit {segment.WaterTariffPerUnit}, water standing/day {segment.WaterStandingChargePerDay}, water VAT {segment.WaterVatPercent}%");
                            section.Item().Text($"Electricity unit {segment.ElectricityTariffPerUnit}, electricity standing/day {segment.ElectricityStandingChargePerDay}, electricity VAT {segment.ElectricityVatPercent}%");
                            section.Item().Text($"Allocated usage cold={segment.ColdWaterUsage}, hot={segment.HotWaterUsage}, apartment={segment.ApartmentElectricityUsage}, boiler={segment.BoilerElectricityUsage}");
                        }
                    });

                    content.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(14).Column(section =>
                    {
                        section.Spacing(6);
                        section.Item().Text("Statement note").FontSize(11).SemiBold();
                        section.Item().Text("Independent Utility Calculation Statement. Generated from stored calculation and payment records within this portal. This is not an official supplier invoice.");
                    });
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Generated by BaleAnchor Utility on ");
                    text.Span(model.GeneratedAtUtcIso).SemiBold();
                });
            });
        });

        using var stream = new MemoryStream();
        document.GeneratePdf(stream);
        return stream.ToArray();
    }

    private static void AddSummaryField(IContainer container, string label, string value)
    {
        container.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(column =>
        {
            column.Spacing(4);
            column.Item().Text(label).FontSize(8).SemiBold();
            column.Item().Text(value).FontSize(10);
        });
    }

    private static void AddMetricCard(IContainer container, string label, string value, string caption)
    {
        container.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(12).Column(column =>
        {
            column.Spacing(4);
            column.Item().Text(label).FontSize(8).SemiBold();
            column.Item().Text(value).FontSize(16).SemiBold();
            column.Item().Text(caption).FontSize(8);
        });
    }

    private static string Currency(string value) => $"£{value}";

    private static string PaymentText(string? value) => string.IsNullOrWhiteSpace(value) ? "Not recorded" : $"£{value}";
}
