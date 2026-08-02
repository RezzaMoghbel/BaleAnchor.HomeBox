import { useEffect, type Dispatch, type SetStateAction, useState } from "react";
import { jsPDF } from "jspdf";
import { PortalApiError, portalClient } from "../api/portalClient";
import type {
  StatementExportHistoryItemResponse,
  StatementPeriodItemResponse,
  StatementSummaryResponse,
} from "../shared/contracts";

interface UseStatementsWorkflowArgs {
  isStatementsDashboard: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export function useStatementsWorkflow({
  isStatementsDashboard,
  setLoading,
}: UseStatementsWorkflowArgs) {
  const [statementMessage, setStatementMessage] = useState(
    "No statement action run yet.",
  );
  const [selectedStatementSummary, setSelectedStatementSummary] =
    useState<StatementSummaryResponse | null>(null);
  const [statementPeriods, setStatementPeriods] = useState<
    StatementPeriodItemResponse[]
  >([]);
  const [selectedSnapshotIds, setSelectedSnapshotIds] = useState<string[]>([]);
  const [statementExportHistory, setStatementExportHistory] = useState<
    StatementExportHistoryItemResponse[]
  >([]);

  const selectedSnapshotId = selectedSnapshotIds[0] ?? "";

  const toggleSelectedSnapshotId = (snapshotId: string) => {
    setSelectedSnapshotIds((current) =>
      current.includes(snapshotId)
        ? current.filter(
            (currentSnapshotId) => currentSnapshotId !== snapshotId,
          )
        : [...current, snapshotId],
    );
  };

  const loadStatementPeriods = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getStatementPeriods();
      setStatementPeriods(body.items);
      if (selectedSnapshotIds.length === 0 && body.items.length > 0) {
        setSelectedSnapshotIds([body.items[0].snapshotId]);
      }
      setStatementMessage(`Loaded ${body.count} statement period option(s).`);
    } catch (error) {
      setStatementPeriods([]);
      if (error instanceof PortalApiError) {
        setStatementMessage(
          `Unable to load statement periods. ${error.message}`,
        );
      } else {
        setStatementMessage("Unable to load statement periods.");
      }
    } finally {
      setLoading(false);
    }
  };

  const reloadStatements = async () => {
    setLoading(true);
    try {
      const [periods, exports] = await Promise.all([
        portalClient.getStatementPeriods(),
        portalClient.getStatementExportHistory(),
      ]);

      setStatementPeriods(periods.items);
      setStatementExportHistory(exports.items);
      if (selectedSnapshotIds.length === 0 && periods.items.length > 0) {
        setSelectedSnapshotIds([periods.items[0].snapshotId]);
      }
      setStatementMessage(
        `Reloaded ${periods.count} statement period(s) and ${exports.count} export record(s).`,
      );
    } catch (error) {
      if (error instanceof PortalApiError) {
        setStatementMessage(`Unable to reload statements. ${error.message}`);
      } else {
        setStatementMessage("Unable to reload statements.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedStatementSummary = async (
    snapshotId?: string,
  ): Promise<boolean> => {
    const snapshot = snapshotId ?? selectedSnapshotId;

    if (!snapshot) {
      setStatementMessage(
        "Select a period snapshot before loading selected summary.",
      );
      return false;
    }

    setLoading(true);
    try {
      const body = await portalClient.getStatementSummary(snapshot);
      setSelectedStatementSummary(body);
      setStatementMessage(
        `Loaded selected summary for ${body.periodStartDate} to ${body.periodEndDateExclusive}.`,
      );
      if (snapshotId && !selectedSnapshotIds.includes(snapshot)) {
        setSelectedSnapshotIds((current) => [...current, snapshot]);
      }
      return true;
    } catch (error) {
      setSelectedStatementSummary(null);
      if (error instanceof PortalApiError) {
        setStatementMessage(
          `Unable to load selected summary. ${error.message}`,
        );
      } else {
        setStatementMessage("Unable to load selected summary.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadStatementExportHistory = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getStatementExportHistory();
      setStatementExportHistory(body.items);
      if (!silent) {
        setStatementMessage(`Loaded ${body.count} statement export record(s).`);
      }
    } catch (error) {
      setStatementExportHistory([]);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setStatementMessage(
            `Unable to load statement exports. ${error.message}`,
          );
        } else {
          setStatementMessage("Unable to load statement exports.");
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const exportSelectedStatementPdf = async () => {
    if (selectedSnapshotIds.length === 0) {
      setStatementMessage("Select one or more periods before exporting.");
      return;
    }

    setLoading(true);
    try {
      const summaries = await Promise.all(
        selectedSnapshotIds.map((snapshotId) =>
          portalClient.getStatementSummary(snapshotId),
        ),
      );

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const cardGap = 6;

      if (summaries.length > 1) {
        drawSummaryCoverCard(pdf, summaries, margin, contentWidth, pageHeight);
        pdf.addPage("a4", "portrait");
      }

      let cursorY = margin;
      summaries.forEach((summary, index) => {
        const cardHeight = estimateStatementCardHeight(
          pdf,
          summary,
          contentWidth,
        );

        if (cursorY + cardHeight > pageHeight - margin) {
          pdf.addPage("a4", "portrait");
          cursorY = margin;
        }

        drawStatementCard(
          pdf,
          summary,
          index + 1,
          margin,
          cursorY,
          contentWidth,
        );
        cursorY += cardHeight + cardGap;
      });

      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      pdf.save(`statements-selected-${stamp}.pdf`);

      setStatementMessage(
        `Exported ${summaries.length} selected statement(s) to A4 PDF.`,
      );
    } catch (error) {
      if (error instanceof PortalApiError) {
        setStatementMessage(`Statement PDF export failed. ${error.message}`);
      } else {
        setStatementMessage("Statement PDF export failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStatementsDashboard) {
      return;
    }

    if (statementPeriods.length === 0) {
      void loadStatementPeriods();
    }

    if (statementExportHistory.length === 0) {
      void loadStatementExportHistory(true);
    }
  }, [
    isStatementsDashboard,
    statementExportHistory.length,
    statementPeriods.length,
  ]);

  return {
    statementMessage,
    selectedSnapshotId,
    selectedStatementSummary,
    statementPeriods,
    statementExportHistory,
    reloadStatements,
    loadStatementPeriods,
    loadSelectedStatementSummary,
    exportSelectedStatementPdf,
    loadStatementExportHistory,
    selectedSnapshotIds,
    toggleSelectedSnapshotId,
  };
}

function drawSummaryCoverCard(
  pdf: jsPDF,
  summaries: StatementSummaryResponse[],
  margin: number,
  contentWidth: number,
  pageHeight: number,
) {
  const totalCharges = summaries.reduce(
    (sum, item) => sum + Number.parseFloat(item.periodTotal),
    0,
  );
  const totalPayments = summaries.reduce(
    (sum, item) => sum + Number.parseFloat(item.paymentAmount ?? "0"),
    0,
  );
  const totalDifference = summaries.reduce(
    (sum, item) => sum + Number.parseFloat(item.periodDifference),
    0,
  );

  const cardHeight = 68;
  const cardY = margin;
  const textX = margin + 6;

  pdf.setDrawColor(208);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, cardY, contentWidth, cardHeight, 2, 2, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(33, 37, 41);
  pdf.setFontSize(13.5);
  pdf.text("Selected Statement Totals", textX, cardY + 12);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(73, 80, 87);
  pdf.setFontSize(9.6);
  pdf.text(`Selected periods: ${summaries.length}`, textX, cardY + 21);
  pdf.text(`Total charges: GBP ${totalCharges.toFixed(2)}`, textX, cardY + 29);
  pdf.text(
    `Total payments: GBP ${totalPayments.toFixed(2)}`,
    textX,
    cardY + 37,
  );
  pdf.text(
    `Net difference: GBP ${totalDifference.toFixed(2)}`,
    textX,
    cardY + 45,
  );

  const periodLabels = summaries.map(
    (item) => `${item.periodStartDate} to ${item.periodEndDateExclusive}`,
  );
  const lines = pdf.splitTextToSize(
    `Periods: ${periodLabels.join(" | ")}`,
    contentWidth - 12,
  );
  pdf.text(lines, textX, cardY + 53);

  drawAggregateTotalsCard(
    pdf,
    summaries,
    margin,
    cardY + cardHeight + 5,
    contentWidth,
    pageHeight,
  );
}

function drawAggregateTotalsCard(
  pdf: jsPDF,
  summaries: StatementSummaryResponse[],
  x: number,
  y: number,
  width: number,
  pageHeight: number,
) {
  const componentTotals = aggregateComponentRows(summaries);
  const segmentTotals = aggregateSegmentTotalsRows(summaries);

  const cardBottomPadding = 8;
  const titleBlock = 12;
  const tableGap = 6;
  const innerWidth = width - 6;
  const componentsHeight = measureTableHeight(
    pdf,
    innerWidth,
    [
      "Component",
      "Usage",
      "Usage subtotal",
      "Standing subtotal",
      "VAT",
      "Total",
    ],
    componentTotals,
    [0.26, 0.11, 0.2, 0.23, 0.09, 0.11],
  );
  const segmentsHeight = measureTableHeight(
    pdf,
    innerWidth,
    ["Segment", "Days", "Estimated", "Usage allocation"],
    segmentTotals,
    [0.29, 0.08, 0.12, 0.51],
  );

  const cardHeight =
    titleBlock +
    componentsHeight +
    tableGap +
    segmentsHeight +
    cardBottomPadding;
  if (y + cardHeight > pageHeight - 10) {
    return;
  }

  pdf.setDrawColor(208);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(x, y, width, cardHeight, 2, 2, "FD");

  const innerX = x + 3;
  let cursorY = y + 8;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(33, 37, 41);
  pdf.text("Selected totals breakdown", innerX, cursorY);

  cursorY += 4;
  cursorY = drawTable(
    pdf,
    innerX,
    cursorY,
    innerWidth,
    [
      "Component",
      "Usage",
      "Usage subtotal",
      "Standing subtotal",
      "VAT",
      "Total",
    ],
    componentTotals,
    [0.26, 0.11, 0.2, 0.23, 0.09, 0.11],
  );

  cursorY += tableGap;

  drawTable(
    pdf,
    innerX,
    cursorY,
    innerWidth,
    ["Segment", "Days", "Estimated", "Usage allocation"],
    segmentTotals,
    [0.29, 0.08, 0.12, 0.51],
  );
}

function estimateStatementCardHeight(
  pdf: jsPDF,
  summary: StatementSummaryResponse,
  contentWidth: number,
) {
  const componentRows = summary.componentLines.map((line) => [
    line.component,
    line.usage,
    toGbp(line.usageSubtotal),
    toGbp(line.standingSubtotal),
    toGbp(line.vatAmount),
    toGbp(line.total),
  ]);

  const segmentRows = summary.tariffSegments.map((segment) => [
    `${segment.startDate} to ${segment.endDateExclusive}`,
    segment.days.toString(),
    segment.isEstimatedAllocation ? "Yes" : "No",
    `Cold ${segment.coldWaterUsage}, hot ${segment.hotWaterUsage}, apartment ${segment.apartmentElectricityUsage}, boiler ${segment.boilerElectricityUsage}`,
  ]);

  const innerWidth = contentWidth - 6;
  const boxHeight = 30;
  const tableGap = 5;
  const componentsHeight = measureTableHeight(
    pdf,
    innerWidth,
    [
      "Component",
      "Usage",
      "Usage subtotal",
      "Standing subtotal",
      "VAT",
      "Total",
    ],
    componentRows,
    [0.26, 0.11, 0.2, 0.23, 0.09, 0.11],
  );
  const segmentsHeight = measureTableHeight(
    pdf,
    innerWidth,
    ["Segment", "Days", "Estimated", "Usage allocation"],
    segmentRows,
    [0.29, 0.08, 0.12, 0.51],
  );

  return (
    8 +
    5 +
    boxHeight +
    tableGap +
    componentsHeight +
    tableGap +
    segmentsHeight +
    8
  );
}

function drawStatementCard(
  pdf: jsPDF,
  summary: StatementSummaryResponse,
  index: number,
  margin: number,
  startY: number,
  contentWidth: number,
) {
  const cardHeight = estimateStatementCardHeight(pdf, summary, contentWidth);
  const cardX = margin;
  const cardY = startY;
  const innerX = cardX + 3;
  const innerWidth = contentWidth - 6;
  let cursorY = cardY + 8;

  pdf.setDrawColor(208);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(cardX, cardY, contentWidth, cardHeight, 2, 2, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(33, 37, 41);
  pdf.text(
    `Statement ${index}: ${summary.periodStartDate} to ${summary.periodEndDateExclusive}`,
    innerX,
    cursorY,
  );

  cursorY += 5;
  const boxGap = 4;
  const boxWidth = (innerWidth - boxGap) / 2;
  const boxHeight = 30;

  drawMetaBox(pdf, innerX, cursorY, boxWidth, boxHeight, "PERIOD", [
    `${summary.periodStartDate} to ${summary.periodEndDateExclusive}`,
    `Total ${toGbp(summary.periodTotal)}`,
    `Payment ${toGbp(summary.paymentAmount ?? "0")}`,
    `Difference ${toGbp(summary.periodDifference)}`,
    `Status ${summary.periodBalanceStatus}`,
  ]);

  drawMetaBox(
    pdf,
    innerX + boxWidth + boxGap,
    cursorY,
    boxWidth,
    boxHeight,
    "DETAILS",
    [
      `Estimated allocations ${summary.containsEstimatedSegments ? "Yes" : "No"}`,
      `Quality checks ${summary.integrityChecksPassed ? "Passed" : "Needs attention"}`,
      `Segments ${summary.tariffSegments.length}`,
      `Components ${summary.componentLines.length}`,
    ],
  );

  cursorY += boxHeight + 5;

  const componentRows = summary.componentLines.map((line) => [
    line.component,
    line.usage,
    toGbp(line.usageSubtotal),
    toGbp(line.standingSubtotal),
    toGbp(line.vatAmount),
    toGbp(line.total),
  ]);

  cursorY = drawTable(
    pdf,
    innerX,
    cursorY,
    innerWidth,
    [
      "Component",
      "Usage",
      "Usage subtotal",
      "Standing subtotal",
      "VAT",
      "Total",
    ],
    componentRows,
    [0.26, 0.11, 0.2, 0.23, 0.09, 0.11],
  );

  cursorY += 5;

  const segmentRows = summary.tariffSegments.map((segment) => [
    `${segment.startDate} to ${segment.endDateExclusive}`,
    segment.days.toString(),
    segment.isEstimatedAllocation ? "Yes" : "No",
    `Cold ${segment.coldWaterUsage}, hot ${segment.hotWaterUsage}, apartment ${segment.apartmentElectricityUsage}, boiler ${segment.boilerElectricityUsage}`,
  ]);

  drawTable(
    pdf,
    innerX,
    cursorY,
    innerWidth,
    ["Segment", "Days", "Estimated", "Usage allocation"],
    segmentRows,
    [0.29, 0.08, 0.12, 0.51],
  );
}

function toGbp(value: string) {
  const amount = Number.parseFloat(value || "0");
  if (Number.isNaN(amount)) {
    return "GBP 0.00";
  }

  return `GBP ${amount.toFixed(2)}`;
}

function drawMetaBox(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  heading: string,
  lines: string[],
) {
  pdf.setDrawColor(214);
  pdf.setFillColor(252, 253, 255);
  pdf.roundedRect(x, y, width, height, 1.5, 1.5, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.8);
  pdf.setTextColor(108, 117, 125);
  pdf.text(heading, x + 2, y + 4.5);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.1);
  pdf.setTextColor(73, 80, 87);

  let cursorY = y + 7.7;
  lines.forEach((line) => {
    const wrapped = pdf.splitTextToSize(line, width - 4);
    pdf.text(wrapped, x + 2, cursorY);
    cursorY += wrapped.length * 3.2;
  });
}

function drawTable(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  headers: string[],
  rows: string[][],
  colRatios: number[],
) {
  const colWidths = colRatios.map((ratio) => ratio * width);
  const headerHeight = 7.2;
  const lineHeight = 3.3;

  pdf.setDrawColor(206);
  pdf.setFillColor(52, 58, 64);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8.1);

  let cursorX = x;
  headers.forEach((header, index) => {
    const cellWidth = colWidths[index] ?? 0;
    pdf.rect(cursorX, y, cellWidth, headerHeight, "FD");
    const wrapped = pdf.splitTextToSize(header, Math.max(cellWidth - 2, 2));
    pdf.text(wrapped, cursorX + 1, y + 4.7);
    cursorX += cellWidth;
  });

  let cursorY = y + headerHeight;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(73, 80, 87);

  rows.forEach((row, rowIndex) => {
    const wrappedRow = row.map((cell, index) =>
      pdf.splitTextToSize(cell ?? "", Math.max((colWidths[index] ?? 0) - 2, 2)),
    );
    const maxLines = wrappedRow.reduce(
      (currentMax, lines) => Math.max(currentMax, lines.length),
      1,
    );
    const rowHeight = Math.max(6.4, maxLines * lineHeight + 1.6);

    let cellX = x;
    wrappedRow.forEach((lines, index) => {
      const cellWidth = colWidths[index] ?? 0;
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(250, 251, 252);
        pdf.rect(cellX, cursorY, cellWidth, rowHeight, "FD");
      } else {
        pdf.rect(cellX, cursorY, cellWidth, rowHeight);
      }
      pdf.setTextColor(73, 80, 87);
      if (index === 0) {
        pdf.setFont("helvetica", "bold");
      } else {
        pdf.setFont("helvetica", "normal");
      }
      pdf.text(lines, cellX + 1, cursorY + 4.2);
      cellX += cellWidth;
    });

    cursorY += rowHeight;
  });

  return cursorY;
}

function aggregateComponentRows(summaries: StatementSummaryResponse[]) {
  const byComponent = new Map<
    string,
    {
      usage: number;
      usageSubtotal: number;
      standingSubtotal: number;
      vatAmount: number;
      total: number;
    }
  >();

  summaries.forEach((summary) => {
    summary.componentLines.forEach((line) => {
      const current = byComponent.get(line.component) ?? {
        usage: 0,
        usageSubtotal: 0,
        standingSubtotal: 0,
        vatAmount: 0,
        total: 0,
      };

      current.usage += toDecimal(line.usage);
      current.usageSubtotal += toDecimal(line.usageSubtotal);
      current.standingSubtotal += toDecimal(line.standingSubtotal);
      current.vatAmount += toDecimal(line.vatAmount);
      current.total += toDecimal(line.total);
      byComponent.set(line.component, current);
    });
  });

  return Array.from(byComponent.entries()).map(([component, totals]) => [
    component,
    toUsage(totals.usage),
    toGbpNumeric(totals.usageSubtotal),
    toGbpNumeric(totals.standingSubtotal),
    toGbpNumeric(totals.vatAmount),
    toGbpNumeric(totals.total),
  ]);
}

function aggregateSegmentTotalsRows(summaries: StatementSummaryResponse[]) {
  let totalDays = 0;
  let estimatedSegments = 0;
  let cold = 0;
  let hot = 0;
  let apartment = 0;
  let boiler = 0;

  summaries.forEach((summary) => {
    summary.tariffSegments.forEach((segment) => {
      totalDays += segment.days;
      if (segment.isEstimatedAllocation) {
        estimatedSegments += 1;
      }

      cold += toDecimal(segment.coldWaterUsage);
      hot += toDecimal(segment.hotWaterUsage);
      apartment += toDecimal(segment.apartmentElectricityUsage);
      boiler += toDecimal(segment.boilerElectricityUsage);
    });
  });

  return [
    [
      "Selected totals",
      totalDays.toString(),
      estimatedSegments > 0 ? `Yes (${estimatedSegments})` : "No",
      `Cold ${toUsage(cold)}, hot ${toUsage(hot)}, apartment ${toUsage(apartment)}, boiler ${toUsage(boiler)}`,
    ],
  ];
}

function toDecimal(value: string) {
  const parsed = Number.parseFloat(value || "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function toUsage(value: number) {
  return value
    .toFixed(3)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

function toGbpNumeric(value: number) {
  return `GBP ${value.toFixed(2)}`;
}

function measureTableHeight(
  pdf: jsPDF,
  width: number,
  headers: string[],
  rows: string[][],
  colRatios: number[],
) {
  const colWidths = colRatios.map((ratio) => ratio * width);
  const headerHeight = 7.2;
  const lineHeight = 3.3;

  let totalHeight = headerHeight;
  headers.forEach((header, index) => {
    const lines = pdf.splitTextToSize(
      header,
      Math.max((colWidths[index] ?? 0) - 2, 2),
    ).length;
    totalHeight = Math.max(
      totalHeight,
      Math.max(7.2, lines * lineHeight + 1.6),
    );
  });

  rows.forEach((row) => {
    const maxLines = row.reduce((currentMax, cell, index) => {
      const lines = pdf.splitTextToSize(
        cell ?? "",
        Math.max((colWidths[index] ?? 0) - 2, 2),
      ).length;
      return Math.max(currentMax, lines);
    }, 1);

    totalHeight += Math.max(6.4, maxLines * lineHeight + 1.6);
  });

  return totalHeight;
}
