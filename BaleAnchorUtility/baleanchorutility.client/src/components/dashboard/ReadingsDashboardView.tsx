import { useEffect, useState, type ReactNode } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { PortalApiError, portalClient } from "../../api/portalClient";
import type {
  BoilerAssumptionOptionItemResponse,
  FieldErrors,
  LatestReadingsResponse,
  PaymentHistoryItemResponse,
  StatementPeriodItemResponse,
  StatementSummaryResponse,
  TariffOptionItemResponse,
} from "../../shared/contracts";

interface ReadingsDashboardViewProps {
  shellHeader: ReactNode;
  routeTabs: ReactNode;
  loading: boolean;
  readingDate: string;
  coldWaterReading: string;
  hotWaterReading: string;
  electricityReading: string;
  readingsFieldErrors: FieldErrors;
  billingMessage: string;
  latestReadings: LatestReadingsResponse | null;
  getFieldErrors: (errors: FieldErrors, fieldName: string) => string[];
  onReadingDateChange: (value: string) => void;
  onColdWaterReadingChange: (value: string) => void;
  onHotWaterReadingChange: (value: string) => void;
  onElectricityReadingChange: (value: string) => void;
  onSubmitReadings: (selection?: {
    tariffEffectiveFromDate?: string;
    boilerEffectiveFromDate?: string;
  }) => Promise<boolean>;
  onUpdateLatestReadings: () => Promise<boolean>;
  onLoadLatestReadings: () => Promise<void>;
  onRunLatestCalculation: () => Promise<void>;
}

export function ReadingsDashboardView({
  shellHeader,
  routeTabs,
  loading,
  readingDate,
  coldWaterReading,
  hotWaterReading,
  electricityReading,
  readingsFieldErrors,
  billingMessage,
  latestReadings,
  getFieldErrors,
  onReadingDateChange,
  onColdWaterReadingChange,
  onHotWaterReadingChange,
  onElectricityReadingChange,
  onSubmitReadings,
  onUpdateLatestReadings,
  onLoadLatestReadings,
  onRunLatestCalculation,
}: ReadingsDashboardViewProps) {
  const [cardsLoading, setCardsLoading] = useState(false);
  const [dashboardMessage, setDashboardMessage] = useState(
    "Loading reading periods.",
  );
  const [periods, setPeriods] = useState<StatementPeriodItemResponse[]>([]);
  const [summariesBySnapshotId, setSummariesBySnapshotId] = useState<
    Record<string, StatementSummaryResponse>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsSnapshotId, setDetailsSnapshotId] = useState<string | null>(
    null,
  );
  const [tariffOptions, setTariffOptions] = useState<
    TariffOptionItemResponse[]
  >([]);
  const [boilerOptions, setBoilerOptions] = useState<
    BoilerAssumptionOptionItemResponse[]
  >([]);
  const [tariffOptionsLoading, setTariffOptionsLoading] = useState(false);
  const [boilerOptionsLoading, setBoilerOptionsLoading] = useState(false);
  const [selectedTariffEffectiveFromDate, setSelectedTariffEffectiveFromDate] =
    useState("");
  const [selectedBoilerEffectiveFromDate, setSelectedBoilerEffectiveFromDate] =
    useState("");
  const [isLinkPaymentModalOpen, setIsLinkPaymentModalOpen] = useState(false);
  const [isUnlinkPaymentModalOpen, setIsUnlinkPaymentModalOpen] =
    useState(false);
  const [targetPeriodForPayment, setTargetPeriodForPayment] =
    useState<StatementPeriodItemResponse | null>(null);
  const [unlinkedPayments, setUnlinkedPayments] = useState<
    PaymentHistoryItemResponse[]
  >([]);
  const [selectedUnlinkedPaymentId, setSelectedUnlinkedPaymentId] =
    useState("");
  const [targetLinkedPaymentId, setTargetLinkedPaymentId] = useState("");
  const [linkPaymentFieldErrors, setLinkPaymentFieldErrors] =
    useState<FieldErrors>({});
  const [unlinkPaymentFieldErrors, setUnlinkPaymentFieldErrors] =
    useState<FieldErrors>({});
  const [linkPaymentConfirmed, setLinkPaymentConfirmed] = useState(false);
  const [unlinkPaymentConfirmed, setUnlinkPaymentConfirmed] = useState(false);
  const [isAverageModalOpen, setIsAverageModalOpen] = useState(false);
  const [isGuestimateModalOpen, setIsGuestimateModalOpen] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsErrorMessage, setInsightsErrorMessage] = useState("");
  const [averageSummaryRows, setAverageSummaryRows] = useState<
    Array<{ label: string; unit: string; usage: number; cost: number }>
  >([]);
  const [guestimateRows, setGuestimateRows] = useState<
    Array<{
      label: string;
      unit: string;
      lowUsage: number;
      expectedUsage: number;
      highUsage: number;
      lowCost: number;
      expectedCost: number;
      highCost: number;
    }>
  >([]);
  const [guestimateRangeLabel, setGuestimateRangeLabel] = useState("");
  const [pendingReadingDate, setPendingReadingDate] = useState("");
  const [addReadingConfirmed, setAddReadingConfirmed] = useState(false);
  const [addReadingConfirmationError, setAddReadingConfirmationError] =
    useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const pageSize = 12;

  const todayIsoDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const loadReadingPeriods = async () => {
    setCardsLoading(true);
    try {
      const body = await portalClient.getStatementPeriods();
      setPeriods(body.items);
      setCurrentPage(1);
      setDashboardMessage(
        body.count > 0
          ? `Loaded ${body.count} calculated reading period(s).`
          : "No calculated reading periods yet. Add readings and run a calculation from Tariffs to populate this dashboard.",
      );
    } catch (error) {
      setPeriods([]);
      if (error instanceof PortalApiError) {
        setDashboardMessage(`Unable to load reading periods. ${error.message}`);
      } else {
        setDashboardMessage("Unable to load reading periods.");
      }
    } finally {
      setCardsLoading(false);
    }
  };

  const pagedPeriods = periods.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const loadVisibleSummaries = async (items: StatementPeriodItemResponse[]) => {
    const missingIds = items
      .map((item) => item.snapshotId)
      .filter((snapshotId) => !summariesBySnapshotId[snapshotId]);

    if (missingIds.length === 0) {
      return;
    }

    setCardsLoading(true);
    try {
      const summaries = await Promise.all(
        missingIds.map((snapshotId) =>
          portalClient.getStatementSummary(snapshotId),
        ),
      );

      setSummariesBySnapshotId((current) => {
        const next = { ...current };
        for (const summary of summaries) {
          const matchingSnapshotId = items.find(
            (item) =>
              item.periodStartDate === summary.periodStartDate &&
              item.periodEndDateExclusive === summary.periodEndDateExclusive,
          )?.snapshotId;

          if (matchingSnapshotId) {
            next[matchingSnapshotId] = summary;
          }
        }

        return next;
      });
    } catch (error) {
      if (error instanceof PortalApiError) {
        setDashboardMessage(
          `Unable to load one or more reading summaries. ${error.message}`,
        );
      } else {
        setDashboardMessage("Unable to load one or more reading summaries.");
      }
    } finally {
      setCardsLoading(false);
    }
  };

  useEffect(() => {
    void onLoadLatestReadings();
    void loadReadingPeriods();
  }, []);

  useEffect(() => {
    if (pagedPeriods.length === 0) {
      return;
    }

    void loadVisibleSummaries(pagedPeriods);
  }, [currentPage, periods]);

  const totalPages = Math.max(1, Math.ceil(periods.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const showingFrom = periods.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo =
    periods.length === 0 ? 0 : Math.min(safePage * pageSize, periods.length);

  const formatUsage = (value?: string) =>
    new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value ?? "0"));

  const formatCurrency = (value?: string) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(Number(value ?? "0"));

  const formatAbsoluteCurrency = (value?: string) => {
    const numeric = Number(value ?? "0");
    return formatCurrency(String(Math.abs(numeric)));
  };

  const formatCurrencyUpTo5 = (value?: string) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    }).format(Number(value ?? "0"));

  const formatDecimalUpTo5 = (value: number) =>
    new Intl.NumberFormat("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    }).format(value);

  const formatPercent = (value?: string) => `${formatUsage(value)}%`;

  const formatComponentUsage = (component: string, usage?: string) => {
    const normalized = component.toLowerCase();

    if (normalized.includes("water")) {
      return `${formatUsage(usage)} m3`;
    }

    if (normalized.includes("electric")) {
      return `${formatUsage(usage)} kWh`;
    }

    return formatUsage(usage);
  };

  const formatUsageSubtotalTooltip = (usage: string, usageSubtotal: string) => {
    const usageValue = Number(usage);
    const usageSubtotalValue = Number(usageSubtotal);

    if (!Number.isFinite(usageValue) || usageValue <= 0) {
      return "Usage and unit rate details are not available for this row.";
    }

    const unitRateValue = usageSubtotalValue / usageValue;
    const unitRateText = formatDecimalUpTo5(unitRateValue);
    const usageText = formatUsage(usage);

    return `(${usageText} x ${unitRateText})`;
  };

  const formatStandingSubtotalTooltip = (
    standingSubtotal: string,
    periodDays: number,
  ) => {
    const standingSubtotalValue = Number(standingSubtotal);

    if (!Number.isFinite(standingSubtotalValue) || periodDays <= 0) {
      return "Standing day-rate details are not available for this row.";
    }

    const standingRatePerDay = standingSubtotalValue / periodDays;
    const standingRateText = formatDecimalUpTo5(standingRatePerDay);

    return `(${periodDays} x ${standingRateText})`;
  };

  const getComponentDisplayName = (component: string) => {
    return component
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace("Electricity", "Elec");
  };

  const equationVariableDescriptions: Record<string, string> = {
    CW: "Cold-water usage in m3",
    HW: "Hot-water usage in m3",
    AE: "Apartment electricity usage in kWh",
    BE: "Boiler electricity usage in kWh",
    D: "Number of days in the calculation period",
    WR: "Water unit rate per m3",
    WS: "Water standing charge per day",
    WV: "Water VAT rate as a decimal",
    ER: "Electricity unit rate per kWh",
    ES: "Electricity standing charge per day",
    EV: "Electricity VAT rate as a decimal",
    WT: "Temperature increase in °C",
    HC: "Specific heat capacity of water in kJ/kg°C",
    WD: "Approximate water density in kg/m3",
    NK: "Number of kilojoules in one kWh",
    ΔT: "Temperature increase in °C",
    "4.186": "Specific heat capacity of water in kJ/kg°C",
    "1,000": "Approximate water density in kg/m3",
    "3,600": "Number of kilojoules in one kWh",
  };

  const renderEquationWithTooltips = (equation: string) => {
    const tokens = equation.split(
      /(CW|HW|AE|BE|WR|WS|WV|ER|ES|EV|D|WT|HC|WD|NK|ΔT|4\.186|1,000|3,600)/g,
    );

    return tokens.map((token, index) => {
      const description = equationVariableDescriptions[token];
      if (!description) {
        return <span key={`eq-token-${index}-${token}`}>{token}</span>;
      }

      return (
        <span
          key={`eq-token-${index}-${token}`}
          className="text-decoration-underline"
          style={{ textDecorationStyle: "dotted", cursor: "help" }}
          data-ba-tooltip="equation-variable"
          data-bs-toggle="tooltip"
          data-bs-placement="top"
          title={description}
        >
          {token}
        </span>
      );
    });
  };

  const getCanonicalEquation = (component: string, equation: string) => {
    const normalized = equation.replace(/\s+/g, " ").trim().toLowerCase();

    if (normalized !== "total = (usage x unitrate + standing) + vat") {
      return equation;
    }

    switch (component) {
      case "ColdWater":
        return "Cold-water total = ((CW x WR) + (D x WS)) x (1 + WV)";
      case "HotWater":
        return "Hot-water volume total = (HW x WR) x (1 + WV)";
      case "ApartmentElectricity":
        return "Apartment electricity total = ((AE x ER) + (D x ES)) x (1 + EV)";
      case "BoilerElectricity":
        return "Boiler electricity total = (BE x ER) x (1 + EV)";
      default:
        return equation;
    }
  };

  const getBoilerUsageEquation = (component: string) => {
    if (component !== "BoilerElectricity") {
      return null;
    }

    return "BE = HW x WT x HC x WD ÷ NK";
  };

  const toNumber = (value?: string) => Number(value ?? "0");

  const getDeltaClass = (delta: number) => {
    if (delta > 0) {
      return "text-danger";
    }

    if (delta < 0) {
      return "text-success";
    }

    return "text-secondary";
  };

  const formatDeltaText = (
    currentValue: string,
    previousValue: string,
    kind: "currency" | "percent",
  ) => {
    const delta = toNumber(currentValue) - toNumber(previousValue);
    const absDelta = Math.abs(delta);

    if (absDelta < 0.0000005) {
      return "No change vs previous tariff";
    }

    const sign = delta > 0 ? "+" : "-";
    const deltaValue =
      kind === "currency"
        ? formatCurrencyUpTo5(String(absDelta))
        : formatPercent(String(absDelta));

    return `${sign}${deltaValue} vs previous tariff`;
  };

  const formatRange = (startDate: string, endDateExclusive: string) => {
    const start = new Date(`${startDate}T00:00:00`);
    const endExclusive = new Date(`${endDateExclusive}T00:00:00`);
    const end = new Date(endExclusive);
    end.setDate(end.getDate() - 1);

    const formatter = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return `${formatter.format(start)} to ${formatter.format(end)}`;
  };

  const formatDisplayDate = (value?: string) => {
    if (!value) {
      return "-";
    }

    const formatter = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return formatter.format(new Date(`${value}T00:00:00`));
  };

  const formatPeriodHeading = (endDateExclusive: string) => {
    const endExclusive = new Date(`${endDateExclusive}T00:00:00`);
    const end = new Date(endExclusive);
    end.setDate(end.getDate() - 1);

    return new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
    }).format(end);
  };

  const getComponent = (
    summary: StatementSummaryResponse,
    componentName: string,
  ) => summary.componentLines.find((item) => item.component === componentName);

  const getBalanceLabel = (difference: number) => {
    if (difference > 0) {
      return "Amount due";
    }

    if (difference < 0) {
      return "Credit";
    }

    return "Settled";
  };

  const getBalanceClassName = (difference: number) => {
    if (difference > 0) {
      return "text-danger";
    }

    if (difference < 0) {
      return "text-success";
    }

    return "text-secondary";
  };

  const getPeriodDays = (summary: StatementSummaryResponse) =>
    summary.tariffSegments.reduce(
      (totalDays, segment) => totalDays + segment.days,
      0,
    );

  const getPeriodMetrics = (summary: StatementSummaryResponse) => {
    const cold = getComponent(summary, "ColdWater");
    const hot = getComponent(summary, "HotWater");
    const apartment = getComponent(summary, "ApartmentElectricity");
    const boiler = getComponent(summary, "BoilerElectricity");

    const coldUsage = Number(cold?.usage ?? "0");
    const hotUsage = Number(hot?.usage ?? "0");
    const apartmentUsage = Number(apartment?.usage ?? "0");
    const boilerUsage = Number(boiler?.usage ?? "0");

    const coldCost = Number(cold?.total ?? "0");
    const hotCost = Number(hot?.total ?? "0");
    const apartmentCost = Number(apartment?.total ?? "0");
    const boilerCost = Number(boiler?.total ?? "0");

    return {
      coldUsage,
      hotUsage,
      waterUsage: coldUsage + hotUsage,
      apartmentUsage,
      boilerUsage,
      electricityUsage: apartmentUsage + boilerUsage,
      coldCost,
      hotCost,
      waterCost: coldCost + hotCost,
      apartmentCost,
      boilerCost,
      electricityCost: apartmentCost + boilerCost,
    };
  };

  const mapToAverageRows = (metrics: ReturnType<typeof getPeriodMetrics>) => [
    {
      label: "Water Usage",
      unit: "m3",
      usage: metrics.waterUsage,
      cost: metrics.waterCost,
    },
    {
      label: "Cold",
      unit: "m3",
      usage: metrics.coldUsage,
      cost: metrics.coldCost,
    },
    {
      label: "Hot",
      unit: "m3",
      usage: metrics.hotUsage,
      cost: metrics.hotCost,
    },
    {
      label: "Electricity Usage",
      unit: "kWh",
      usage: metrics.electricityUsage,
      cost: metrics.electricityCost,
    },
    {
      label: "Apartment",
      unit: "kWh",
      usage: metrics.apartmentUsage,
      cost: metrics.apartmentCost,
    },
    {
      label: "Boiler",
      unit: "kWh",
      usage: metrics.boilerUsage,
      cost: metrics.boilerCost,
    },
  ];

  const mapToGuestimateRows = (
    low: ReturnType<typeof getPeriodMetrics>,
    expected: ReturnType<typeof getPeriodMetrics>,
    high: ReturnType<typeof getPeriodMetrics>,
  ) => [
    {
      label: "Water Usage",
      unit: "m3",
      lowUsage: low.waterUsage,
      expectedUsage: expected.waterUsage,
      highUsage: high.waterUsage,
      lowCost: low.waterCost,
      expectedCost: expected.waterCost,
      highCost: high.waterCost,
    },
    {
      label: "Cold",
      unit: "m3",
      lowUsage: low.coldUsage,
      expectedUsage: expected.coldUsage,
      highUsage: high.coldUsage,
      lowCost: low.coldCost,
      expectedCost: expected.coldCost,
      highCost: high.coldCost,
    },
    {
      label: "Hot",
      unit: "m3",
      lowUsage: low.hotUsage,
      expectedUsage: expected.hotUsage,
      highUsage: high.hotUsage,
      lowCost: low.hotCost,
      expectedCost: expected.hotCost,
      highCost: high.hotCost,
    },
    {
      label: "Electricity Usage",
      unit: "kWh",
      lowUsage: low.electricityUsage,
      expectedUsage: expected.electricityUsage,
      highUsage: high.electricityUsage,
      lowCost: low.electricityCost,
      expectedCost: expected.electricityCost,
      highCost: high.electricityCost,
    },
    {
      label: "Apartment",
      unit: "kWh",
      lowUsage: low.apartmentUsage,
      expectedUsage: expected.apartmentUsage,
      highUsage: high.apartmentUsage,
      lowCost: low.apartmentCost,
      expectedCost: expected.apartmentCost,
      highCost: high.apartmentCost,
    },
    {
      label: "Boiler",
      unit: "kWh",
      lowUsage: low.boilerUsage,
      expectedUsage: expected.boilerUsage,
      highUsage: high.boilerUsage,
      lowCost: low.boilerCost,
      expectedCost: expected.boilerCost,
      highCost: high.boilerCost,
    },
  ];

  const scaleMetrics = (
    metrics: ReturnType<typeof getPeriodMetrics>,
    factor: number,
  ) => ({
    coldUsage: metrics.coldUsage * factor,
    hotUsage: metrics.hotUsage * factor,
    waterUsage: metrics.waterUsage * factor,
    apartmentUsage: metrics.apartmentUsage * factor,
    boilerUsage: metrics.boilerUsage * factor,
    electricityUsage: metrics.electricityUsage * factor,
    coldCost: metrics.coldCost * factor,
    hotCost: metrics.hotCost * factor,
    waterCost: metrics.waterCost * factor,
    apartmentCost: metrics.apartmentCost * factor,
    boilerCost: metrics.boilerCost * factor,
    electricityCost: metrics.electricityCost * factor,
  });

  const averageMonthDays = 30.4375;

  const mergeWeightedDaily = (
    latest: ReturnType<typeof getPeriodMetrics>,
    previous: ReturnType<typeof getPeriodMetrics>,
    latestDays: number,
    previousDays: number,
  ) => {
    const latestWeight = 0.6;
    const previousWeight = 0.4;

    const safeLatestDays = Math.max(1, latestDays);
    const safePreviousDays = Math.max(1, previousDays);

    return {
      coldUsage:
        (latest.coldUsage / safeLatestDays) * latestWeight +
        (previous.coldUsage / safePreviousDays) * previousWeight,
      hotUsage:
        (latest.hotUsage / safeLatestDays) * latestWeight +
        (previous.hotUsage / safePreviousDays) * previousWeight,
      waterUsage:
        (latest.waterUsage / safeLatestDays) * latestWeight +
        (previous.waterUsage / safePreviousDays) * previousWeight,
      apartmentUsage:
        (latest.apartmentUsage / safeLatestDays) * latestWeight +
        (previous.apartmentUsage / safePreviousDays) * previousWeight,
      boilerUsage:
        (latest.boilerUsage / safeLatestDays) * latestWeight +
        (previous.boilerUsage / safePreviousDays) * previousWeight,
      electricityUsage:
        (latest.electricityUsage / safeLatestDays) * latestWeight +
        (previous.electricityUsage / safePreviousDays) * previousWeight,
      coldCost:
        (latest.coldCost / safeLatestDays) * latestWeight +
        (previous.coldCost / safePreviousDays) * previousWeight,
      hotCost:
        (latest.hotCost / safeLatestDays) * latestWeight +
        (previous.hotCost / safePreviousDays) * previousWeight,
      waterCost:
        (latest.waterCost / safeLatestDays) * latestWeight +
        (previous.waterCost / safePreviousDays) * previousWeight,
      apartmentCost:
        (latest.apartmentCost / safeLatestDays) * latestWeight +
        (previous.apartmentCost / safePreviousDays) * previousWeight,
      boilerCost:
        (latest.boilerCost / safeLatestDays) * latestWeight +
        (previous.boilerCost / safePreviousDays) * previousWeight,
      electricityCost:
        (latest.electricityCost / safeLatestDays) * latestWeight +
        (previous.electricityCost / safePreviousDays) * previousWeight,
    };
  };

  const getRecentTwoPeriods = () => periods.slice(0, 2);

  const ensureSummariesForPeriods = async (
    items: StatementPeriodItemResponse[],
  ) => {
    const missingItems = items.filter(
      (item) => !summariesBySnapshotId[item.snapshotId],
    );

    const fetchedBySnapshotId: Record<string, StatementSummaryResponse> = {};

    if (missingItems.length > 0) {
      const fetchedSummaries = await Promise.all(
        missingItems.map((item) =>
          portalClient.getStatementSummary(item.snapshotId),
        ),
      );

      missingItems.forEach((item, index) => {
        fetchedBySnapshotId[item.snapshotId] = fetchedSummaries[index];
      });

      setSummariesBySnapshotId((current) => ({
        ...current,
        ...fetchedBySnapshotId,
      }));
    }

    const availableBySnapshotId: Record<string, StatementSummaryResponse> = {};

    items.forEach((item) => {
      const summary =
        summariesBySnapshotId[item.snapshotId] ??
        fetchedBySnapshotId[item.snapshotId];

      if (summary) {
        availableBySnapshotId[item.snapshotId] = summary;
      }
    });

    return availableBySnapshotId;
  };

  const openAverageModal = async () => {
    setIsAverageModalOpen(true);
    setInsightsErrorMessage("");
    setAverageSummaryRows([]);

    if (periods.length < 2) {
      setInsightsErrorMessage(
        "At least two calculated periods are required to show an overall average.",
      );
      return;
    }

    const recentPeriods = getRecentTwoPeriods();
    setInsightsLoading(true);
    try {
      const summaries = await ensureSummariesForPeriods(recentPeriods);
      const latestSummary = summaries[recentPeriods[0].snapshotId];
      const previousSummary = summaries[recentPeriods[1].snapshotId];

      if (!latestSummary || !previousSummary) {
        setInsightsErrorMessage(
          "Unable to load enough summary data for the average view.",
        );
        return;
      }

      const latestMetrics = getPeriodMetrics(latestSummary);
      const previousMetrics = getPeriodMetrics(previousSummary);
      const latestDays = getPeriodDays(latestSummary);
      const previousDays = getPeriodDays(previousSummary);
      const totalDays = latestDays + previousDays;

      if (totalDays <= 0) {
        setInsightsErrorMessage(
          "Unable to calculate monthly average because period duration is not valid.",
        );
        return;
      }

      const combinedMetrics = {
        coldUsage: latestMetrics.coldUsage + previousMetrics.coldUsage,
        hotUsage: latestMetrics.hotUsage + previousMetrics.hotUsage,
        waterUsage: latestMetrics.waterUsage + previousMetrics.waterUsage,
        apartmentUsage:
          latestMetrics.apartmentUsage + previousMetrics.apartmentUsage,
        boilerUsage: latestMetrics.boilerUsage + previousMetrics.boilerUsage,
        electricityUsage:
          latestMetrics.electricityUsage + previousMetrics.electricityUsage,
        coldCost: latestMetrics.coldCost + previousMetrics.coldCost,
        hotCost: latestMetrics.hotCost + previousMetrics.hotCost,
        waterCost: latestMetrics.waterCost + previousMetrics.waterCost,
        apartmentCost:
          latestMetrics.apartmentCost + previousMetrics.apartmentCost,
        boilerCost: latestMetrics.boilerCost + previousMetrics.boilerCost,
        electricityCost:
          latestMetrics.electricityCost + previousMetrics.electricityCost,
      };

      const averageMetrics = scaleMetrics(
        combinedMetrics,
        averageMonthDays / totalDays,
      );

      setAverageSummaryRows(mapToAverageRows(averageMetrics));
    } catch (error) {
      if (error instanceof PortalApiError) {
        setInsightsErrorMessage(
          `Unable to load average summary. ${error.message}`,
        );
      } else {
        setInsightsErrorMessage("Unable to load average summary.");
      }
    } finally {
      setInsightsLoading(false);
    }
  };

  const openGuestimateModal = async () => {
    setIsGuestimateModalOpen(true);
    setInsightsErrorMessage("");
    setGuestimateRows([]);
    setGuestimateRangeLabel("");

    const recentPeriods = getRecentTwoPeriods();
    const today = todayIsoDate();
    const latestPeriod = recentPeriods[0];

    if (!latestPeriod || latestPeriod.periodEndDateExclusive !== today) {
      setInsightsErrorMessage(
        "Next month guestimate is available only when the latest reading period ends yesterday (period end exclusive equals today).",
      );
      return;
    }

    if (recentPeriods.length < 2) {
      setInsightsErrorMessage(
        "At least two calculated periods are required to calculate next month guestimate.",
      );
      return;
    }

    setInsightsLoading(true);
    try {
      const summaries = await ensureSummariesForPeriods(recentPeriods);
      const latestSummary = summaries[recentPeriods[0].snapshotId];
      const previousSummary = summaries[recentPeriods[1].snapshotId];

      if (!latestSummary || !previousSummary) {
        setInsightsErrorMessage(
          "Unable to load enough summary data for the guestimate view.",
        );
        return;
      }

      const latestMetrics = getPeriodMetrics(latestSummary);
      const previousMetrics = getPeriodMetrics(previousSummary);
      const latestDays = getPeriodDays(latestSummary);
      const previousDays = getPeriodDays(previousSummary);

      const nextPeriodStart = new Date(
        `${latestPeriod.periodEndDateExclusive}T00:00:00`,
      );
      const nextPeriodEndExclusive = new Date(nextPeriodStart);
      nextPeriodEndExclusive.setMonth(nextPeriodEndExclusive.getMonth() + 1);

      const nextPeriodDays = Math.max(
        1,
        Math.round(
          (nextPeriodEndExclusive.getTime() - nextPeriodStart.getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      );

      const weightedDaily = mergeWeightedDaily(
        latestMetrics,
        previousMetrics,
        latestDays,
        previousDays,
      );
      const expected = scaleMetrics(weightedDaily, nextPeriodDays);
      const low = scaleMetrics(expected, 0.95);
      const high = scaleMetrics(expected, 1.05);

      setGuestimateRows(mapToGuestimateRows(low, expected, high));
      setGuestimateRangeLabel(
        `${formatRange(
          latestPeriod.periodEndDateExclusive,
          `${nextPeriodEndExclusive.getFullYear()}-${String(nextPeriodEndExclusive.getMonth() + 1).padStart(2, "0")}-${String(nextPeriodEndExclusive.getDate()).padStart(2, "0")}`,
        )}`,
      );
    } catch (error) {
      if (error instanceof PortalApiError) {
        setInsightsErrorMessage(
          `Unable to load next month guestimate. ${error.message}`,
        );
      } else {
        setInsightsErrorMessage("Unable to load next month guestimate.");
      }
    } finally {
      setInsightsLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    onReadingDateChange("");
    setPendingReadingDate("");
    onColdWaterReadingChange(latestReadings?.coldWaterReading ?? "");
    onHotWaterReadingChange(latestReadings?.hotWaterReading ?? "");
    onElectricityReadingChange(latestReadings?.electricityReading ?? "");
    setTariffOptions([]);
    setBoilerOptions([]);
    setSelectedTariffEffectiveFromDate("");
    setSelectedBoilerEffectiveFromDate("");
    setAddReadingConfirmed(false);
    setAddReadingConfirmationError("");
    setIsModalOpen(true);
  };

  const openEditModal = async () => {
    try {
      const latest = await portalClient.getLatestReadings();
      if (!latest) {
        setDashboardMessage("No latest reading is available to edit.");
        return;
      }

      setModalMode("edit");
      onReadingDateChange(latest.readingDate);
      setPendingReadingDate(latest.readingDate);
      onColdWaterReadingChange(latest.coldWaterReading);
      onHotWaterReadingChange(latest.hotWaterReading);
      onElectricityReadingChange(latest.electricityReading);
      setIsModalOpen(true);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setDashboardMessage(`Unable to open latest reading. ${error.message}`);
      } else {
        setDashboardMessage("Unable to open latest reading.");
      }
    }
  };

  const openDetailsModal = (snapshotId: string) => {
    setDetailsSnapshotId(snapshotId);
    setIsDetailsModalOpen(true);
  };

  const openLinkPaymentModal = (period: StatementPeriodItemResponse) => {
    setTargetPeriodForPayment(period);
    setUnlinkedPayments([]);
    setSelectedUnlinkedPaymentId("");
    setLinkPaymentFieldErrors({});
    setLinkPaymentConfirmed(false);
    setIsLinkPaymentModalOpen(true);

    void portalClient
      .getUnlinkedPayments()
      .then((response) => {
        setUnlinkedPayments(response.items);
        setSelectedUnlinkedPaymentId(response.items[0]?.paymentId ?? "");
      })
      .catch((error) => {
        if (error instanceof PortalApiError) {
          setDashboardMessage(
            `Unable to load unlinked payments. ${error.message}`,
          );
        } else {
          setDashboardMessage("Unable to load unlinked payments.");
        }
      });
  };

  const openUnlinkPaymentModal = (
    period: StatementPeriodItemResponse,
    paymentId: string,
  ) => {
    setTargetPeriodForPayment(period);
    setTargetLinkedPaymentId(paymentId);
    setUnlinkPaymentFieldErrors({});
    setUnlinkPaymentConfirmed(false);
    setIsUnlinkPaymentModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setDetailsSnapshotId(null);
  };

  const refreshCardData = async (snapshotId: string) => {
    const summary = await portalClient.getStatementSummary(snapshotId);
    setSummariesBySnapshotId((current) => ({
      ...current,
      [snapshotId]: summary,
    }));
    await loadReadingPeriods();
  };

  const handleModalSubmit = async () => {
    if (
      modalMode === "add" &&
      (isDateSelectionInProgress ||
        !selectedReadingDateIso ||
        !isAddReadingConfirmationValid)
    ) {
      setAddReadingConfirmationError(
        "Confirm the reading period before saving.",
      );
      return;
    }

    setAddReadingConfirmationError("");

    const success =
      modalMode === "add"
        ? await onSubmitReadings({
            tariffEffectiveFromDate: selectedTariffEffectiveFromDate,
            boilerEffectiveFromDate: selectedBoilerEffectiveFromDate,
          })
        : await onUpdateLatestReadings();

    if (!success) {
      return;
    }

    await onRunLatestCalculation();
    await onLoadLatestReadings();
    await loadReadingPeriods();
    setIsModalOpen(false);
  };

  const handleLinkPaymentSubmit = async () => {
    if (!targetPeriodForPayment) {
      return;
    }

    setLinkPaymentFieldErrors({});

    if (!linkPaymentConfirmed) {
      setLinkPaymentFieldErrors({
        confirm: ["Confirm payment linking before continuing."],
      });
      return;
    }

    if (selectedUnlinkedPaymentId.length === 0) {
      setLinkPaymentFieldErrors({
        paymentId: ["Select an unlinked payment to continue."],
      });
      return;
    }

    try {
      const body = await portalClient.linkPayment(selectedUnlinkedPaymentId, {
        snapshotId: targetPeriodForPayment.snapshotId,
      });

      await refreshCardData(targetPeriodForPayment.snapshotId);
      setDashboardMessage(
        `${body.message} Linked to ${targetPeriodForPayment.periodStartDate} to ${targetPeriodForPayment.periodEndDateExclusive}.`,
      );
      setIsLinkPaymentModalOpen(false);
      setTargetPeriodForPayment(null);
      setUnlinkedPayments([]);
      setSelectedUnlinkedPaymentId("");
    } catch (error) {
      if (error instanceof PortalApiError) {
        setLinkPaymentFieldErrors(error.errors);
        setDashboardMessage(`Unable to link payment. ${error.message}`);
      } else {
        setDashboardMessage("Unable to link payment.");
      }
    }
  };

  const handleUnlinkPaymentSubmit = async () => {
    if (targetLinkedPaymentId.length === 0) {
      setUnlinkPaymentFieldErrors({
        paymentId: ["No linked payment was found for this period."],
      });
      return;
    }

    if (!unlinkPaymentConfirmed) {
      setUnlinkPaymentFieldErrors({
        confirm: ["Confirm payment unlink before continuing."],
      });
      return;
    }

    try {
      const body = await portalClient.unlinkPayment(targetLinkedPaymentId);
      if (!targetPeriodForPayment) {
        return;
      }

      await refreshCardData(targetPeriodForPayment.snapshotId);
      setDashboardMessage(
        `${body.message} Unlinked from ${targetPeriodForPayment.periodStartDate} to ${targetPeriodForPayment.periodEndDateExclusive}.`,
      );
      setIsUnlinkPaymentModalOpen(false);
      setTargetPeriodForPayment(null);
      setTargetLinkedPaymentId("");
    } catch (error) {
      if (error instanceof PortalApiError) {
        setUnlinkPaymentFieldErrors(error.errors);
        setDashboardMessage(`Unable to unlink payment. ${error.message}`);
      } else {
        setDashboardMessage("Unable to unlink payment.");
      }
    }
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const handleExportPdf = async () => {
    if (periods.length === 0) {
      setDashboardMessage("No reading periods are available to export.");
      return;
    }

    setIsExportingPdf(true);
    setDashboardMessage("Preparing PDF export...");

    const summaryMap: Record<string, StatementSummaryResponse> = {
      ...summariesBySnapshotId,
    };

    const missingSnapshotIds = periods
      .map((period) => period.snapshotId)
      .filter((snapshotId) => !summaryMap[snapshotId]);

    try {
      if (missingSnapshotIds.length > 0) {
        const fetched = await Promise.all(
          missingSnapshotIds.map(async (snapshotId) => ({
            snapshotId,
            summary: await portalClient.getStatementSummary(snapshotId),
          })),
        );

        const fetchedBySnapshotId: Record<string, StatementSummaryResponse> =
          {};
        for (const item of fetched) {
          fetchedBySnapshotId[item.snapshotId] = item.summary;
          summaryMap[item.snapshotId] = item.summary;
        }

        setSummariesBySnapshotId((current) => ({
          ...current,
          ...fetchedBySnapshotId,
        }));
      }

      const exportContainer = document.createElement("div");
      exportContainer.setAttribute("data-ba-export", "readings-pdf");
      exportContainer.style.position = "fixed";
      exportContainer.style.left = "-99999px";
      exportContainer.style.top = "0";
      exportContainer.style.zIndex = "-1";
      exportContainer.style.background = "#ffffff";

      const cardPages: StatementPeriodItemResponse[][] = [];
      for (let index = 0; index < periods.length; index += 4) {
        cardPages.push(periods.slice(index, index + 4));
      }

      const generatedOn = new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date());

      const summaryPageHtml = `
        <section class="ba-export-page">
          <div class="ba-page-title">Readings Dashboard Export</div>
          <div class="ba-page-subtitle">Generated on ${escapeHtml(generatedOn)}</div>
          <div class="ba-summary-wrap">
            <div class="ba-summary-item">
              <div class="ba-summary-label">Total period charges</div>
              <div class="ba-summary-value">${escapeHtml(formatCurrency(String(overallPeriodTotal)))}</div>
            </div>
            <div class="ba-summary-item">
              <div class="ba-summary-label">Total payments linked</div>
              <div class="ba-summary-value">${escapeHtml(formatCurrency(String(overallPaymentsRecorded)))}</div>
            </div>
            <div class="ba-summary-item">
              <div class="ba-summary-label">${escapeHtml(getBalanceLabel(overallDifference))}</div>
              <div class="ba-summary-value">${escapeHtml(formatAbsoluteCurrency(String(overallDifference)))}</div>
            </div>
            <div class="ba-summary-item">
              <div class="ba-summary-label">Reading periods exported</div>
              <div class="ba-summary-value">${periods.length}</div>
            </div>
          </div>
        </section>
      `;

      const cardPagesHtml = cardPages
        .map((pageItems, pageIndex) => {
          const cardsHtml = pageItems
            .map((period) => {
              const summary = summaryMap[period.snapshotId];
              const cold = summary ? getComponent(summary, "ColdWater") : null;
              const hot = summary ? getComponent(summary, "HotWater") : null;
              const apartment = summary
                ? getComponent(summary, "ApartmentElectricity")
                : null;
              const boiler = summary
                ? getComponent(summary, "BoilerElectricity")
                : null;
              const waterUsage =
                Number(cold?.usage ?? "0") + Number(hot?.usage ?? "0");
              const electricityUsage =
                Number(apartment?.usage ?? "0") + Number(boiler?.usage ?? "0");
              const waterTotal =
                Number(cold?.total ?? "0") + Number(hot?.total ?? "0");
              const electricityTotal =
                Number(apartment?.total ?? "0") + Number(boiler?.total ?? "0");
              const periodDifferenceNumber = Number(
                period.periodDifference ?? "0",
              );

              return `
                <article class="ba-export-card">
                  <div class="ba-card-header">
                    <div>
                      <div class="ba-card-title">${escapeHtml(formatPeriodHeading(period.periodEndDateExclusive))}</div>
                      <div class="ba-card-range">${escapeHtml(formatRange(period.periodStartDate, period.periodEndDateExclusive))}</div>
                    </div>
                    ${period.containsEstimatedSegments ? '<div class="ba-badge">Estimated</div>' : ""}
                  </div>
                  ${
                    summary
                      ? `
                    <div class="ba-card-row ba-card-main-row"><span>Water Usage: ${escapeHtml(formatUsage(String(waterUsage)))} m3</span><span>${escapeHtml(formatCurrency(String(waterTotal)))}</span></div>
                    <div class="ba-card-row ba-card-sub-row"><span>Cold: ${escapeHtml(formatUsage(cold?.usage))} m3</span><span>${escapeHtml(formatCurrency(cold?.total))}</span></div>
                    <div class="ba-card-row ba-card-sub-row"><span>Hot: ${escapeHtml(formatUsage(hot?.usage))} m3</span><span>${escapeHtml(formatCurrency(hot?.total))}</span></div>
                    <div class="ba-card-row ba-card-main-row"><span>Electricity Usage: ${escapeHtml(formatUsage(String(electricityUsage)))} kWh</span><span>${escapeHtml(formatCurrency(String(electricityTotal)))}</span></div>
                    <div class="ba-card-row ba-card-sub-row"><span>Apartment: ${escapeHtml(formatUsage(apartment?.usage))} kWh</span><span>${escapeHtml(formatCurrency(apartment?.total))}</span></div>
                    <div class="ba-card-row ba-card-sub-row"><span>Boiler: ${escapeHtml(formatUsage(boiler?.usage))} kWh</span><span>${escapeHtml(formatCurrency(boiler?.total))}</span></div>
                    <div class="ba-card-divider"></div>
                    <div class="ba-card-row ba-card-main-row"><span>Period Total</span><span>${escapeHtml(formatCurrency(summary.periodTotal))}</span></div>
                    <div class="ba-card-row ba-card-sub-row"><span>Payment recorded</span><span>${escapeHtml(formatCurrency(period.paymentAmount))}</span></div>
                    <div class="ba-card-row ba-card-main-row"><span>${escapeHtml(getBalanceLabel(periodDifferenceNumber))}</span><span>${escapeHtml(formatAbsoluteCurrency(period.periodDifference))}</span></div>
                  `
                      : '<div class="ba-card-empty">Summary was unavailable at export time.</div>'
                  }
                </article>
              `;
            })
            .join("");

          return `
            <section class="ba-export-page">
              <div class="ba-page-title">Reading Cards</div>
              <div class="ba-page-subtitle">Page ${pageIndex + 1} of ${cardPages.length}</div>
              <div class="ba-card-grid">${cardsHtml}</div>
            </section>
          `;
        })
        .join("");

      exportContainer.innerHTML = `
        <style>
          .ba-export-page {
            width: 794px;
            height: 1123px;
            box-sizing: border-box;
            padding: 32px;
            background: #ffffff;
            color: #111827;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .ba-page-title {
            font-size: 28px;
            font-weight: 700;
            line-height: 1.1;
          }
          .ba-page-subtitle {
            color: #6b7280;
            font-size: 14px;
          }
          .ba-summary-wrap {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 8px;
          }
          .ba-summary-item {
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 16px;
            background: #f8fafc;
          }
          .ba-summary-label {
            color: #4b5563;
            font-size: 13px;
            margin-bottom: 6px;
          }
          .ba-summary-value {
            font-size: 26px;
            font-weight: 700;
          }
          .ba-card-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-auto-rows: 1fr;
            gap: 16px;
            flex: 1;
          }
          .ba-export-card {
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 14px;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            gap: 8px;
            overflow: hidden;
          }
          .ba-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
          }
          .ba-card-title {
            font-size: 18px;
            font-weight: 700;
            line-height: 1.2;
          }
          .ba-card-range {
            color: #6b7280;
            font-size: 12px;
            margin-top: 2px;
          }
          .ba-badge {
            background: #f59e0b;
            color: #111827;
            border-radius: 999px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
          }
          .ba-card-row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            line-height: 1.3;
          }
          .ba-card-main-row {
            font-size: 13px;
            font-weight: 600;
          }
          .ba-card-sub-row {
            color: #6b7280;
            font-size: 12px;
          }
          .ba-card-divider {
            border-top: 1px solid #e5e7eb;
            margin-top: 4px;
            padding-top: 2px;
          }
          .ba-card-empty {
            color: #6b7280;
            font-size: 12px;
          }
        </style>
        ${summaryPageHtml}
        ${cardPagesHtml}
      `;

      document.body.appendChild(exportContainer);

      try {
        const pageNodes = Array.from(
          exportContainer.querySelectorAll(".ba-export-page"),
        );

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "a4",
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let pageIndex = 0; pageIndex < pageNodes.length; pageIndex += 1) {
          const pageNode = pageNodes[pageIndex] as HTMLElement;
          const canvas = await html2canvas(pageNode, {
            backgroundColor: "#ffffff",
            scale: 2,
          });

          const imageData = canvas.toDataURL("image/png");
          if (pageIndex > 0) {
            pdf.addPage();
          }

          pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);
        }

        pdf.save(`readings-dashboard-${todayIsoDate()}.pdf`);
        setDashboardMessage(
          `Exported ${periods.length} reading period card(s) to PDF.`,
        );
      } finally {
        exportContainer.remove();
      }
    } catch (error) {
      if (error instanceof PortalApiError) {
        setDashboardMessage(`Unable to export PDF. ${error.message}`);
      } else {
        setDashboardMessage("Unable to export PDF.");
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  const loadTariffOptions = async (onDate: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(onDate)) {
      return;
    }

    setTariffOptionsLoading(true);
    try {
      const body = await portalClient.getTariffOptions(onDate);
      setTariffOptions(body.items);

      const hasCurrentSelection = body.items.some(
        (item) => item.effectiveFromDate === selectedTariffEffectiveFromDate,
      );

      if (!hasCurrentSelection) {
        setSelectedTariffEffectiveFromDate(body.recommendedEffectiveFromDate);
      }
    } catch (error) {
      setTariffOptions([]);
      setSelectedTariffEffectiveFromDate("");

      if (error instanceof PortalApiError) {
        setDashboardMessage(`Unable to load tariff options. ${error.message}`);
      } else {
        setDashboardMessage("Unable to load tariff options.");
      }
    } finally {
      setTariffOptionsLoading(false);
    }
  };

  const loadBoilerOptions = async (onDate: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(onDate)) {
      return;
    }

    setBoilerOptionsLoading(true);
    try {
      const body = await portalClient.getBoilerAssumptionOptions(onDate);
      setBoilerOptions(body.items);

      const hasCurrentSelection = body.items.some(
        (item) => item.effectiveFromDate === selectedBoilerEffectiveFromDate,
      );

      if (!hasCurrentSelection) {
        setSelectedBoilerEffectiveFromDate(body.recommendedEffectiveFromDate);
      }
    } catch (error) {
      setBoilerOptions([]);
      setSelectedBoilerEffectiveFromDate("");

      if (error instanceof PortalApiError) {
        setDashboardMessage(
          `Unable to load boiler assumption options. ${error.message}`,
        );
      } else {
        setDashboardMessage("Unable to load boiler assumption options.");
      }
    } finally {
      setBoilerOptionsLoading(false);
    }
  };

  useEffect(() => {
    if (
      !isModalOpen ||
      modalMode !== "add" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(readingDate)
    ) {
      return;
    }

    void Promise.all([
      loadTariffOptions(readingDate),
      loadBoilerOptions(readingDate),
    ]);
  }, [isModalOpen, modalMode, readingDate]);

  const latestSnapshotId = periods[0]?.snapshotId;
  const detailsPeriod = detailsSnapshotId
    ? periods.find((item) => item.snapshotId === detailsSnapshotId)
    : null;
  const detailsSummary = detailsSnapshotId
    ? summariesBySnapshotId[detailsSnapshotId]
    : null;
  const selectedTariffOption = tariffOptions.find(
    (option) => option.effectiveFromDate === selectedTariffEffectiveFromDate,
  );
  const selectedBoilerOption = boilerOptions.find(
    (option) => option.effectiveFromDate === selectedBoilerEffectiveFromDate,
  );
  const selectedTariffIndex = tariffOptions.findIndex(
    (option) => option.effectiveFromDate === selectedTariffEffectiveFromDate,
  );
  const previousTariffOption =
    selectedTariffIndex >= 0 ? tariffOptions[selectedTariffIndex + 1] : null;
  const detailsPeriodDays =
    detailsSummary?.tariffSegments.reduce(
      (totalDays, segment) => totalDays + segment.days,
      0,
    ) ?? 0;
  const overallPeriodTotal = periods.reduce(
    (total, period) => total + Number(period.periodTotal ?? "0"),
    0,
  );
  const overallPaymentsRecorded = periods.reduce(
    (total, period) => total + Number(period.paymentAmount ?? "0"),
    0,
  );
  const overallDifference = overallPeriodTotal - overallPaymentsRecorded;
  const canOpenGuestimateButton =
    periods.length >= 2 &&
    periods[0]?.periodEndDateExclusive === todayIsoDate();
  const getAverageRow = (label: string) =>
    averageSummaryRows.find((row) => row.label === label);
  const getGuestimateRow = (label: string) =>
    guestimateRows.find((row) => row.label === label);

  const averageWaterRow = getAverageRow("Water Usage");
  const averageColdRow = getAverageRow("Cold");
  const averageHotRow = getAverageRow("Hot");
  const averageElectricityRow = getAverageRow("Electricity Usage");
  const averageApartmentRow = getAverageRow("Apartment");
  const averageBoilerRow = getAverageRow("Boiler");
  const averageTotalCost =
    (averageWaterRow?.cost ?? 0) + (averageElectricityRow?.cost ?? 0);

  const guestimateWaterRow = getGuestimateRow("Water Usage");
  const guestimateColdRow = getGuestimateRow("Cold");
  const guestimateHotRow = getGuestimateRow("Hot");
  const guestimateElectricityRow = getGuestimateRow("Electricity Usage");
  const guestimateApartmentRow = getGuestimateRow("Apartment");
  const guestimateBoilerRow = getGuestimateRow("Boiler");

  const lowTotalCost =
    (guestimateWaterRow?.lowCost ?? 0) +
    (guestimateElectricityRow?.lowCost ?? 0);
  const expectedTotalCost =
    (guestimateWaterRow?.expectedCost ?? 0) +
    (guestimateElectricityRow?.expectedCost ?? 0);
  const highTotalCost =
    (guestimateWaterRow?.highCost ?? 0) +
    (guestimateElectricityRow?.highCost ?? 0);

  const isDateSelectionInProgress =
    modalMode === "add" && pendingReadingDate !== readingDate;
  const readingDateForSelection = readingDate;
  const selectedReadingDateIso = /^\d{4}-\d{2}-\d{2}$/.test(
    readingDateForSelection,
  )
    ? readingDateForSelection
    : null;
  const previousReadingDateIso = latestReadings?.readingDate ?? null;
  const canBuildPeriodConfirmation =
    modalMode === "add" &&
    selectedReadingDateIso !== null &&
    previousReadingDateIso !== null;

  const periodConfirmationDays = canBuildPeriodConfirmation
    ? Math.round(
        (new Date(`${selectedReadingDateIso}T00:00:00`).getTime() -
          new Date(`${previousReadingDateIso}T00:00:00`).getTime()) /
          (24 * 60 * 60 * 1000),
      )
    : null;

  const periodConfirmationMonthsApprox =
    periodConfirmationDays !== null ? periodConfirmationDays / 30.4375 : null;
  const periodConfirmationMonthsRounded =
    periodConfirmationMonthsApprox !== null
      ? Math.max(1, Math.round(periodConfirmationMonthsApprox))
      : null;
  const periodConfirmationMonthsLabel =
    periodConfirmationMonthsRounded === null
      ? null
      : periodConfirmationMonthsRounded === 1
        ? "about 1 month"
        : `about ${periodConfirmationMonthsRounded} months`;
  const periodConfirmationIsLong =
    periodConfirmationMonthsApprox !== null &&
    periodConfirmationMonthsApprox >= 6;
  const periodConfirmationRange =
    canBuildPeriodConfirmation &&
    periodConfirmationDays !== null &&
    periodConfirmationDays > 0
      ? formatRange(previousReadingDateIso, selectedReadingDateIso)
      : null;
  const isFirstReadingFlow =
    modalMode === "add" &&
    selectedReadingDateIso !== null &&
    previousReadingDateIso === null;
  const isAddReadingConfirmationValid = isFirstReadingFlow
    ? addReadingConfirmed
    : periodConfirmationRange !== null && addReadingConfirmed;

  useEffect(() => {
    if (!isDetailsModalOpen) {
      return;
    }

    const bootstrapWindow = window as Window & {
      bootstrap?: {
        Tooltip: new (element: Element) => { dispose?: () => void };
      };
    };

    const TooltipConstructor = bootstrapWindow.bootstrap?.Tooltip;
    if (!TooltipConstructor) {
      return;
    }

    const tooltipElements = Array.from(
      document.querySelectorAll("[data-ba-tooltip]"),
    );
    const tooltipInstances = tooltipElements.map(
      (element) => new TooltipConstructor(element),
    );

    return () => {
      for (const instance of tooltipInstances) {
        instance.dispose?.();
      }
    };
  }, [isDetailsModalOpen, detailsSummary]);

  return (
    <div className="wrapper">
      {shellHeader}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Meter readings</h1>
              <p className="hero-copy mb-0">
                Review your calculated reading periods as a card dashboard, then
                add a new reading or edit the latest unpaid reading from a
                modal.
              </p>
            </div>
          </section>

          {routeTabs}
          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div>
                  <h5 className="mb-1">Reading periods</h5>
                  <p className="text-secondary mb-0">
                    Showing the latest calculated periods as cards, 12 at a
                    time.
                  </p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => void loadReadingPeriods()}
                    disabled={loading || cardsLoading || isExportingPdf}
                  >
                    Refresh dashboard
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => void handleExportPdf()}
                    disabled={loading || cardsLoading || isExportingPdf}
                  >
                    {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={openAddModal}
                    disabled={loading || cardsLoading || isExportingPdf}
                  >
                    Add new reading
                  </button>
                </div>
              </div>

              <div className="card border mb-3 bg-light-subtle">
                <div className="card-body py-3">
                  <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                    <div>
                      <div className="fw-semibold">Overall summary</div>
                      <div className="text-secondary small">
                        Across all loaded reading periods, showing total
                        charges, linked payments, and whether your account is in
                        credit or has an amount due.
                      </div>
                    </div>
                    <span
                      className={`badge ${overallDifference < 0 ? "bg-success" : overallDifference > 0 ? "bg-danger" : "bg-secondary"}`}
                    >
                      {getBalanceLabel(overallDifference)}
                    </span>
                  </div>
                  <div className="row g-2 small">
                    <div className="col-12 col-md-4">
                      <div className="text-secondary">Total period charges</div>
                      <div className="fw-semibold">
                        {formatCurrency(String(overallPeriodTotal))}
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="text-secondary">
                        Total payments linked
                      </div>
                      <div className="fw-semibold">
                        {formatCurrency(String(overallPaymentsRecorded))}
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="text-secondary">
                        {getBalanceLabel(overallDifference)}
                      </div>
                      <div
                        className={`fw-semibold ${getBalanceClassName(overallDifference)}`}
                      >
                        {formatAbsoluteCurrency(String(overallDifference))}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => void openAverageModal()}
                      disabled={loading || cardsLoading}
                    >
                      View overall average
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-info btn-sm"
                      onClick={() => void openGuestimateModal()}
                      disabled={
                        loading || cardsLoading || !canOpenGuestimateButton
                      }
                    >
                      View next month guestimate
                    </button>
                  </div>
                  {!canOpenGuestimateButton && (
                    <div className="text-secondary small mt-2">
                      Guestimate becomes available when your latest period end
                      exclusive date matches today.
                    </div>
                  )}
                  <div className="visually-hidden" aria-live="polite">
                    {dashboardMessage} {billingMessage}
                  </div>
                </div>
              </div>

              {periods.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  No reading cards are available yet.
                </div>
              ) : (
                <>
                  <div className="row g-4">
                    {pagedPeriods.map((period) => {
                      const summary = summariesBySnapshotId[period.snapshotId];
                      const cold = summary
                        ? getComponent(summary, "ColdWater")
                        : null;
                      const hot = summary
                        ? getComponent(summary, "HotWater")
                        : null;
                      const apartment = summary
                        ? getComponent(summary, "ApartmentElectricity")
                        : null;
                      const boiler = summary
                        ? getComponent(summary, "BoilerElectricity")
                        : null;
                      const waterUsage =
                        Number(cold?.usage ?? "0") + Number(hot?.usage ?? "0");
                      const electricityUsage =
                        Number(apartment?.usage ?? "0") +
                        Number(boiler?.usage ?? "0");
                      const waterTotal =
                        Number(cold?.total ?? "0") + Number(hot?.total ?? "0");
                      const electricityTotal =
                        Number(apartment?.total ?? "0") +
                        Number(boiler?.total ?? "0");
                      const isLatestCard =
                        period.snapshotId === latestSnapshotId;
                      const canEditLatest = isLatestCard && !period.hasPayment;
                      const periodDifferenceNumber = Number(
                        period.periodDifference ?? "0",
                      );
                      const periodDifferenceLabel = getBalanceLabel(
                        periodDifferenceNumber,
                      );
                      const periodDifferenceClassName = getBalanceClassName(
                        periodDifferenceNumber,
                      );

                      return (
                        <div
                          key={period.snapshotId}
                          className="col-12 col-md-6 col-xl-4"
                        >
                          <div className="card border-0 shadow-sm h-100">
                            <div className="card-body d-flex flex-column">
                              <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                                <div>
                                  <h5 className="mb-1">
                                    {formatPeriodHeading(
                                      period.periodEndDateExclusive,
                                    )}
                                  </h5>
                                  <div className="text-secondary small">
                                    {formatRange(
                                      period.periodStartDate,
                                      period.periodEndDateExclusive,
                                    )}
                                  </div>
                                </div>
                                <div className="d-flex flex-column align-items-end gap-2">
                                  {period.containsEstimatedSegments && (
                                    <span className="badge bg-warning text-dark">
                                      Estimated
                                    </span>
                                  )}
                                  {canEditLatest && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => void openEditModal()}
                                      disabled={loading || cardsLoading}
                                    >
                                      Edit latest
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() =>
                                      openDetailsModal(period.snapshotId)
                                    }
                                    disabled={
                                      !summary || loading || cardsLoading
                                    }
                                  >
                                    View details
                                  </button>
                                </div>
                              </div>

                              {!summary ? (
                                <div className="text-secondary small">
                                  Loading period summary...
                                </div>
                              ) : (
                                <>
                                  <div className="mb-3">
                                    <div className="d-flex justify-content-between fw-semibold">
                                      <span>
                                        Water Usage:{" "}
                                        {formatUsage(String(waterUsage))} m3
                                      </span>
                                      <span>
                                        {formatCurrency(String(waterTotal))}
                                      </span>
                                    </div>
                                    <div className="d-flex justify-content-between small text-secondary mt-1">
                                      <span>
                                        Cold: {formatUsage(cold?.usage)} m3
                                      </span>
                                      <span>{formatCurrency(cold?.total)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between small text-secondary mt-1">
                                      <span>
                                        Hot: {formatUsage(hot?.usage)} m3
                                      </span>
                                      <span>{formatCurrency(hot?.total)}</span>
                                    </div>
                                  </div>

                                  <div className="mb-3">
                                    <div className="d-flex justify-content-between fw-semibold">
                                      <span>
                                        Electricity Usage:{" "}
                                        {formatUsage(String(electricityUsage))}{" "}
                                        kWh
                                      </span>
                                      <span>
                                        {formatCurrency(
                                          String(electricityTotal),
                                        )}
                                      </span>
                                    </div>
                                    <div className="d-flex justify-content-between small text-secondary mt-1">
                                      <span>
                                        Apartment:{" "}
                                        {formatUsage(apartment?.usage)} kWh
                                      </span>
                                      <span>
                                        {formatCurrency(apartment?.total)}
                                      </span>
                                    </div>
                                    <div className="d-flex justify-content-between small text-secondary mt-1">
                                      <span>
                                        Boiler: {formatUsage(boiler?.usage)} kWh
                                      </span>
                                      <span>
                                        {formatCurrency(boiler?.total)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mt-auto pt-3 border-top">
                                    <div className="d-flex justify-content-between fw-semibold">
                                      <span>Period Total:</span>
                                      <span>
                                        {formatCurrency(summary.periodTotal)}
                                      </span>
                                    </div>
                                    <div className="d-flex justify-content-between small text-secondary mt-1">
                                      <span>Total linked payments:</span>
                                      <span>
                                        {formatCurrency(period.paymentAmount)}
                                      </span>
                                    </div>
                                    <div className="small text-secondary mt-1">
                                      {period.linkedPaymentCount} linked payment
                                      {period.linkedPaymentCount === 1
                                        ? ""
                                        : "s"}
                                    </div>
                                    {period.linkedPayments.length > 0 && (
                                      <div className="mt-2 d-flex flex-column gap-2">
                                        {period.linkedPayments.map((linked) => (
                                          <div
                                            key={linked.paymentId}
                                            className="border rounded px-2 py-2 small"
                                          >
                                            <div className="d-flex justify-content-between flex-wrap gap-2">
                                              <span>
                                                {formatCurrency(linked.amount)}{" "}
                                                on{" "}
                                                {formatDisplayDate(
                                                  linked.paymentDate,
                                                )}
                                              </span>
                                              <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() =>
                                                  openUnlinkPaymentModal(
                                                    period,
                                                    linked.paymentId,
                                                  )
                                                }
                                                disabled={
                                                  loading || cardsLoading
                                                }
                                              >
                                                Unlink
                                              </button>
                                            </div>
                                            <div className="text-secondary mt-1">
                                              {linked.method}
                                              {linked.reference
                                                ? ` | Ref: ${linked.reference}`
                                                : ""}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="d-flex justify-content-between fw-semibold mt-1">
                                      <span>{periodDifferenceLabel}:</span>
                                      <span
                                        className={periodDifferenceClassName}
                                      >
                                        {formatAbsoluteCurrency(
                                          period.periodDifference,
                                        )}
                                      </span>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2 mt-3">
                                      <button
                                        type="button"
                                        className="btn btn-outline-success btn-sm"
                                        onClick={() =>
                                          openLinkPaymentModal(period)
                                        }
                                        disabled={loading || cardsLoading}
                                      >
                                        Link payment
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-4">
                    <div className="small text-secondary">
                      Showing {showingFrom} to {showingTo} of {periods.length}{" "}
                      entries
                    </div>
                    <nav aria-label="Readings card pagination">
                      <ul className="pagination pagination-sm mb-0">
                        <li
                          className={`page-item${safePage > 1 ? "" : " disabled"}`}
                        >
                          <button
                            type="button"
                            className="page-link"
                            onClick={() =>
                              setCurrentPage((page) => Math.max(1, page - 1))
                            }
                            disabled={safePage <= 1}
                          >
                            Prev
                          </button>
                        </li>
                        {Array.from(
                          { length: totalPages },
                          (_, index) => index + 1,
                        ).map((pageNumber) => (
                          <li
                            key={pageNumber}
                            className={`page-item${pageNumber === safePage ? " active" : ""}`}
                          >
                            <button
                              type="button"
                              className="page-link"
                              onClick={() => setCurrentPage(pageNumber)}
                            >
                              {pageNumber}
                            </button>
                          </li>
                        ))}
                        <li
                          className={`page-item${safePage < totalPages ? "" : " disabled"}`}
                        >
                          <button
                            type="button"
                            className="page-link"
                            onClick={() =>
                              setCurrentPage((page) =>
                                Math.min(totalPages, page + 1),
                              )
                            }
                            disabled={safePage >= totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </>
              )}
            </div>
          </div>

          {isModalOpen && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                role="dialog"
              >
                <div
                  className="modal-dialog modal-dialog-centered"
                  role="document"
                >
                  <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        {modalMode === "add"
                          ? "Add new reading"
                          : "Edit latest reading"}
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={() => setIsModalOpen(false)}
                        disabled={loading}
                      ></button>
                    </div>
                    <div className="modal-body">
                      {modalMode === "edit" && (
                        <div className="alert alert-info border" role="status">
                          Only the latest unpaid reading can be edited so
                          historical billed periods remain stable.
                        </div>
                      )}

                      <div className="row g-3">
                        {modalMode === "add" && (
                          <>
                            <div className="col-12">
                              <label
                                htmlFor="tariffEffectiveFromDateModal"
                                className="form-label"
                              >
                                Tariff effective from
                              </label>
                              <select
                                id="tariffEffectiveFromDateModal"
                                className={`form-select ${getFieldErrors(readingsFieldErrors, "tariffEffectiveFromDate").length > 0 ? "is-invalid" : ""}`}
                                value={selectedTariffEffectiveFromDate}
                                onChange={(event) =>
                                  setSelectedTariffEffectiveFromDate(
                                    event.target.value,
                                  )
                                }
                                disabled={tariffOptionsLoading || loading}
                              >
                                <option value="" disabled>
                                  {tariffOptionsLoading
                                    ? "Loading tariff options..."
                                    : "Select tariff by effective date"}
                                </option>
                                {tariffOptions.map((option) => (
                                  <option
                                    key={option.effectiveFromDate}
                                    value={option.effectiveFromDate}
                                  >
                                    {option.effectiveFromDate}
                                    {option.isLatestApplicable
                                      ? " (latest available)"
                                      : ""}
                                  </option>
                                ))}
                              </select>
                              {getFieldErrors(
                                readingsFieldErrors,
                                "tariffEffectiveFromDate",
                              ).length > 0 && (
                                <div className="invalid-feedback d-block">
                                  {getFieldErrors(
                                    readingsFieldErrors,
                                    "tariffEffectiveFromDate",
                                  ).join(" ")}
                                </div>
                              )}
                              <div className="form-text">
                                Tariff dates are filtered to those effective on
                                or before your reading date, and the latest
                                available date is selected by default.
                              </div>
                            </div>

                            {selectedTariffOption && (
                              <div className="col-12">
                                <div className="card border bg-light-subtle mb-0">
                                  <div className="card-body py-3">
                                    <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                                      <h6 className="mb-0">
                                        Selected tariff preview
                                      </h6>
                                      {selectedTariffOption.isLatestApplicable && (
                                        <span className="badge bg-success">
                                          Latest available
                                        </span>
                                      )}
                                    </div>
                                    <div className="small text-secondary mb-2">
                                      Effective from{" "}
                                      {selectedTariffOption.effectiveFromDate}
                                    </div>
                                    {previousTariffOption ? (
                                      <div className="small text-secondary mb-2">
                                        Comparing against previous tariff from{" "}
                                        {previousTariffOption.effectiveFromDate}
                                      </div>
                                    ) : (
                                      <div className="small text-secondary mb-2">
                                        No older tariff exists for comparison.
                                      </div>
                                    )}
                                    <div className="row g-3 small">
                                      <div className="col-12 col-md-6">
                                        <div className="fw-semibold mb-1">
                                          Water
                                        </div>
                                        <div>
                                          Unit rate:{" "}
                                          {formatCurrencyUpTo5(
                                            selectedTariffOption.waterTariffPerUnit,
                                          )}
                                        </div>
                                        {previousTariffOption && (
                                          <div
                                            className={`small ${getDeltaClass(
                                              toNumber(
                                                selectedTariffOption.waterTariffPerUnit,
                                              ) -
                                                toNumber(
                                                  previousTariffOption.waterTariffPerUnit,
                                                ),
                                            )}`}
                                          >
                                            {formatDeltaText(
                                              selectedTariffOption.waterTariffPerUnit,
                                              previousTariffOption.waterTariffPerUnit,
                                              "currency",
                                            )}
                                          </div>
                                        )}
                                        <div>
                                          Standing/day:{" "}
                                          {formatCurrencyUpTo5(
                                            selectedTariffOption.waterStandingChargePerDay,
                                          )}
                                        </div>
                                        {previousTariffOption && (
                                          <div
                                            className={`small ${getDeltaClass(
                                              toNumber(
                                                selectedTariffOption.waterStandingChargePerDay,
                                              ) -
                                                toNumber(
                                                  previousTariffOption.waterStandingChargePerDay,
                                                ),
                                            )}`}
                                          >
                                            {formatDeltaText(
                                              selectedTariffOption.waterStandingChargePerDay,
                                              previousTariffOption.waterStandingChargePerDay,
                                              "currency",
                                            )}
                                          </div>
                                        )}
                                        <div>
                                          VAT:{" "}
                                          {formatPercent(
                                            selectedTariffOption.waterVatPercent,
                                          )}
                                        </div>
                                        {previousTariffOption && (
                                          <div
                                            className={`small ${getDeltaClass(
                                              toNumber(
                                                selectedTariffOption.waterVatPercent,
                                              ) -
                                                toNumber(
                                                  previousTariffOption.waterVatPercent,
                                                ),
                                            )}`}
                                          >
                                            {formatDeltaText(
                                              selectedTariffOption.waterVatPercent,
                                              previousTariffOption.waterVatPercent,
                                              "percent",
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="col-12 col-md-6">
                                        <div className="fw-semibold mb-1">
                                          Electricity
                                        </div>
                                        <div>
                                          Unit rate:{" "}
                                          {formatCurrencyUpTo5(
                                            selectedTariffOption.electricityTariffPerUnit,
                                          )}
                                        </div>
                                        {previousTariffOption && (
                                          <div
                                            className={`small ${getDeltaClass(
                                              toNumber(
                                                selectedTariffOption.electricityTariffPerUnit,
                                              ) -
                                                toNumber(
                                                  previousTariffOption.electricityTariffPerUnit,
                                                ),
                                            )}`}
                                          >
                                            {formatDeltaText(
                                              selectedTariffOption.electricityTariffPerUnit,
                                              previousTariffOption.electricityTariffPerUnit,
                                              "currency",
                                            )}
                                          </div>
                                        )}
                                        <div>
                                          Standing/day:{" "}
                                          {formatCurrencyUpTo5(
                                            selectedTariffOption.electricityStandingChargePerDay,
                                          )}
                                        </div>
                                        {previousTariffOption && (
                                          <div
                                            className={`small ${getDeltaClass(
                                              toNumber(
                                                selectedTariffOption.electricityStandingChargePerDay,
                                              ) -
                                                toNumber(
                                                  previousTariffOption.electricityStandingChargePerDay,
                                                ),
                                            )}`}
                                          >
                                            {formatDeltaText(
                                              selectedTariffOption.electricityStandingChargePerDay,
                                              previousTariffOption.electricityStandingChargePerDay,
                                              "currency",
                                            )}
                                          </div>
                                        )}
                                        <div>
                                          VAT:{" "}
                                          {formatPercent(
                                            selectedTariffOption.electricityVatPercent,
                                          )}
                                        </div>
                                        {previousTariffOption && (
                                          <div
                                            className={`small ${getDeltaClass(
                                              toNumber(
                                                selectedTariffOption.electricityVatPercent,
                                              ) -
                                                toNumber(
                                                  previousTariffOption.electricityVatPercent,
                                                ),
                                            )}`}
                                          >
                                            {formatDeltaText(
                                              selectedTariffOption.electricityVatPercent,
                                              previousTariffOption.electricityVatPercent,
                                              "percent",
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="col-12">
                              <label
                                htmlFor="boilerEffectiveFromDateModal"
                                className="form-label"
                              >
                                Boiler assumptions effective from
                              </label>
                              <select
                                id="boilerEffectiveFromDateModal"
                                className={`form-select ${getFieldErrors(readingsFieldErrors, "boilerEffectiveFromDate").length > 0 ? "is-invalid" : ""}`}
                                value={selectedBoilerEffectiveFromDate}
                                onChange={(event) =>
                                  setSelectedBoilerEffectiveFromDate(
                                    event.target.value,
                                  )
                                }
                                disabled={boilerOptionsLoading || loading}
                              >
                                <option value="" disabled>
                                  {boilerOptionsLoading
                                    ? "Loading boiler options..."
                                    : "Select boiler assumptions by effective date"}
                                </option>
                                {boilerOptions.map((option) => (
                                  <option
                                    key={option.effectiveFromDate}
                                    value={option.effectiveFromDate}
                                  >
                                    {option.effectiveFromDate}
                                    {option.isLatestApplicable
                                      ? " (latest available)"
                                      : ""}
                                  </option>
                                ))}
                              </select>
                              {getFieldErrors(
                                readingsFieldErrors,
                                "boilerEffectiveFromDate",
                              ).length > 0 && (
                                <div className="invalid-feedback d-block">
                                  {getFieldErrors(
                                    readingsFieldErrors,
                                    "boilerEffectiveFromDate",
                                  ).join(" ")}
                                </div>
                              )}
                              <div className="form-text">
                                Boiler assumptions are filtered to dates on or
                                before the reading date and the latest
                                applicable version is selected by default.
                              </div>
                            </div>

                            {selectedBoilerOption && (
                              <div className="col-12">
                                <div className="card border bg-light-subtle mb-0">
                                  <div className="card-body py-3">
                                    <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                                      <h6 className="mb-0">
                                        Selected boiler assumptions preview
                                      </h6>
                                      {selectedBoilerOption.isLatestApplicable && (
                                        <span className="badge bg-success">
                                          Latest available
                                        </span>
                                      )}
                                    </div>
                                    <div className="small text-secondary">
                                      Temp:{" "}
                                      {
                                        selectedBoilerOption.hotWaterTemperatureCelsius
                                      }
                                      {" | Heat cap: "}
                                      {
                                        selectedBoilerOption.hotWaterHeatCapacity
                                      }
                                      {" | Density: "}
                                      {selectedBoilerOption.hotWaterDensity}
                                      {" | kJ→kWh: "}
                                      {
                                        selectedBoilerOption.kiloJouleToKiloWattHourFactor
                                      }
                                    </div>
                                    <div className="small text-secondary">
                                      kWh/m3:{" "}
                                      {
                                        selectedBoilerOption.boilerKwhPerCubicMeter
                                      }
                                      {" | Efficiency %: "}
                                      {
                                        selectedBoilerOption.boilerEfficiencyPercent
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        <div className="col-12">
                          <label
                            htmlFor="readingDateModal"
                            className="form-label"
                          >
                            Reading date
                          </label>
                          <input
                            id="readingDateModal"
                            type="date"
                            className={`form-control ${getFieldErrors(readingsFieldErrors, "readingDate").length > 0 ? "is-invalid" : ""}`}
                            value={
                              modalMode === "add"
                                ? pendingReadingDate
                                : readingDate
                            }
                            onChange={(event) => {
                              if (modalMode === "add") {
                                setPendingReadingDate(event.target.value);
                                setAddReadingConfirmed(false);
                                setAddReadingConfirmationError("");
                                return;
                              }

                              onReadingDateChange(event.target.value);
                            }}
                            onBlur={() => {
                              if (modalMode === "add") {
                                onReadingDateChange(pendingReadingDate);
                              }
                            }}
                          />
                          {getFieldErrors(readingsFieldErrors, "readingDate")
                            .length > 0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(
                                readingsFieldErrors,
                                "readingDate",
                              ).join(" ")}
                            </div>
                          )}
                          {modalMode === "add" && (
                            <div className="form-text">
                              Tariff and boiler options refresh after you finish
                              selecting a date and close or leave this field.
                            </div>
                          )}
                        </div>
                        <div className="col-12 col-md-4">
                          <label
                            htmlFor="coldWaterReadingModal"
                            className="form-label"
                          >
                            Cold water
                          </label>
                          <input
                            id="coldWaterReadingModal"
                            type="text"
                            className={`form-control ${getFieldErrors(readingsFieldErrors, "coldWaterReading").length > 0 ? "is-invalid" : ""}`}
                            value={coldWaterReading}
                            onChange={(event) =>
                              onColdWaterReadingChange(event.target.value)
                            }
                          />
                          {getFieldErrors(
                            readingsFieldErrors,
                            "coldWaterReading",
                          ).length > 0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(
                                readingsFieldErrors,
                                "coldWaterReading",
                              ).join(" ")}
                            </div>
                          )}
                        </div>
                        <div className="col-12 col-md-4">
                          <label
                            htmlFor="hotWaterReadingModal"
                            className="form-label"
                          >
                            Hot water
                          </label>
                          <input
                            id="hotWaterReadingModal"
                            type="text"
                            className={`form-control ${getFieldErrors(readingsFieldErrors, "hotWaterReading").length > 0 ? "is-invalid" : ""}`}
                            value={hotWaterReading}
                            onChange={(event) =>
                              onHotWaterReadingChange(event.target.value)
                            }
                          />
                          {getFieldErrors(
                            readingsFieldErrors,
                            "hotWaterReading",
                          ).length > 0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(
                                readingsFieldErrors,
                                "hotWaterReading",
                              ).join(" ")}
                            </div>
                          )}
                        </div>
                        <div className="col-12 col-md-4">
                          <label
                            htmlFor="electricityReadingModal"
                            className="form-label"
                          >
                            Electricity
                          </label>
                          <input
                            id="electricityReadingModal"
                            type="text"
                            className={`form-control ${getFieldErrors(readingsFieldErrors, "electricityReading").length > 0 ? "is-invalid" : ""}`}
                            value={electricityReading}
                            onChange={(event) =>
                              onElectricityReadingChange(event.target.value)
                            }
                          />
                          {getFieldErrors(
                            readingsFieldErrors,
                            "electricityReading",
                          ).length > 0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(
                                readingsFieldErrors,
                                "electricityReading",
                              ).join(" ")}
                            </div>
                          )}
                        </div>

                        {modalMode === "add" &&
                          !isDateSelectionInProgress &&
                          selectedReadingDateIso && (
                            <div className="col-12">
                              {isFirstReadingFlow ? (
                                <div
                                  className="alert alert-info border mb-0"
                                  role="status"
                                >
                                  <div className="fw-semibold mb-1">
                                    Confirm reading date
                                  </div>
                                  <div>
                                    This will be saved as your first reading on{" "}
                                    {selectedReadingDateIso}. Please confirm
                                    this date is correct.
                                  </div>
                                  <div className="form-check mt-2 mb-0">
                                    <input
                                      id="confirmAddReadingPeriod"
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={addReadingConfirmed}
                                      onChange={(event) => {
                                        setAddReadingConfirmed(
                                          event.target.checked,
                                        );
                                        setAddReadingConfirmationError("");
                                      }}
                                    />
                                    <label
                                      className="form-check-label"
                                      htmlFor="confirmAddReadingPeriod"
                                    >
                                      I confirm this reading date is correct.
                                    </label>
                                  </div>
                                </div>
                              ) : periodConfirmationRange &&
                                periodConfirmationDays !== null &&
                                periodConfirmationMonthsLabel !== null ? (
                                <div
                                  className={`alert border mb-0 ${periodConfirmationIsLong ? "alert-warning" : "alert-info"}`}
                                  role="status"
                                >
                                  <div className="fw-semibold mb-1">
                                    Confirm reading period
                                  </div>
                                  <div>
                                    This reading period will be from{" "}
                                    {periodConfirmationRange} (
                                    {periodConfirmationDays} days,{" "}
                                    {periodConfirmationMonthsLabel}). Is this
                                    correct?
                                  </div>
                                  {periodConfirmationIsLong && (
                                    <div className="small mt-1">
                                      This is a long period. Please double-check
                                      the month/year before saving.
                                    </div>
                                  )}
                                  <div className="form-check mt-2 mb-0">
                                    <input
                                      id="confirmAddReadingPeriod"
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={addReadingConfirmed}
                                      onChange={(event) => {
                                        setAddReadingConfirmed(
                                          event.target.checked,
                                        );
                                        setAddReadingConfirmationError("");
                                      }}
                                    />
                                    <label
                                      className="form-check-label"
                                      htmlFor="confirmAddReadingPeriod"
                                    >
                                      I confirm this reading period is correct.
                                    </label>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="alert alert-danger border mb-0"
                                  role="alert"
                                >
                                  Reading date must be after your previous
                                  reading date ({previousReadingDateIso}).
                                </div>
                              )}
                              {addReadingConfirmationError.length > 0 && (
                                <div className="text-danger small mt-2">
                                  {addReadingConfirmationError}
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setIsModalOpen(false)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => void handleModalSubmit()}
                        disabled={
                          loading ||
                          (modalMode === "add" &&
                            (tariffOptionsLoading ||
                              selectedTariffEffectiveFromDate.length === 0))
                        }
                      >
                        {modalMode === "add"
                          ? "Save reading"
                          : "Update latest reading"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}

          {isLinkPaymentModalOpen && targetPeriodForPayment && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                role="dialog"
              >
                <div
                  className="modal-dialog modal-dialog-centered"
                  role="document"
                >
                  <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header">
                      <h5 className="modal-title">Link payment to period</h5>
                      <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={() => {
                          setIsLinkPaymentModalOpen(false);
                          setUnlinkedPayments([]);
                          setSelectedUnlinkedPaymentId("");
                        }}
                        disabled={loading || cardsLoading}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <div className="alert alert-info border" role="status">
                        Period:{" "}
                        {formatRange(
                          targetPeriodForPayment.periodStartDate,
                          targetPeriodForPayment.periodEndDateExclusive,
                        )}
                      </div>

                      <div className="row g-3">
                        <div className="col-12">
                          <label
                            htmlFor="selectedUnlinkedPaymentId"
                            className="form-label"
                          >
                            Select payment from unlinked pool
                          </label>
                          <select
                            id="selectedUnlinkedPaymentId"
                            className={`form-select ${linkPaymentFieldErrors.paymentId ? "is-invalid" : ""}`}
                            value={selectedUnlinkedPaymentId}
                            onChange={(event) =>
                              setSelectedUnlinkedPaymentId(event.target.value)
                            }
                            disabled={unlinkedPayments.length === 0}
                          >
                            {unlinkedPayments.length === 0 ? (
                              <option value="">
                                No unlinked payments available
                              </option>
                            ) : (
                              unlinkedPayments.map((payment) => (
                                <option
                                  key={payment.paymentId}
                                  value={payment.paymentId}
                                >
                                  {`${formatCurrency(payment.amount)} | ${formatDisplayDate(payment.paymentDate)} | ${payment.method}`}
                                </option>
                              ))
                            )}
                          </select>
                          {unlinkedPayments.length === 0 && (
                            <div className="form-text">
                              Create payments in the Payments tab first, then
                              link them to reading cards here.
                            </div>
                          )}
                        </div>
                        <div className="col-12">
                          <div className="form-check">
                            <input
                              id="linkPaymentConfirm"
                              className="form-check-input"
                              type="checkbox"
                              checked={linkPaymentConfirmed}
                              onChange={(event) =>
                                setLinkPaymentConfirmed(event.target.checked)
                              }
                            />
                            <label
                              className="form-check-label"
                              htmlFor="linkPaymentConfirm"
                            >
                              I confirm this payment should be linked to this
                              period.
                            </label>
                          </div>
                        </div>
                      </div>

                      {Object.values(linkPaymentFieldErrors).flat().length >
                        0 && (
                        <div
                          className="alert alert-danger border mt-3 mb-0"
                          role="alert"
                        >
                          {Object.values(linkPaymentFieldErrors)
                            .flat()
                            .join(" ")}
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setIsLinkPaymentModalOpen(false);
                          setUnlinkedPayments([]);
                          setSelectedUnlinkedPaymentId("");
                        }}
                        disabled={loading || cardsLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => void handleLinkPaymentSubmit()}
                        disabled={
                          loading ||
                          cardsLoading ||
                          unlinkedPayments.length === 0 ||
                          selectedUnlinkedPaymentId.length === 0
                        }
                      >
                        Confirm and link payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}

          {isUnlinkPaymentModalOpen && targetPeriodForPayment && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                role="dialog"
              >
                <div
                  className="modal-dialog modal-dialog-centered"
                  role="document"
                >
                  <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header">
                      <h5 className="modal-title">Unlink payment</h5>
                      <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={() => {
                          setIsUnlinkPaymentModalOpen(false);
                          setTargetLinkedPaymentId("");
                        }}
                        disabled={loading || cardsLoading}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <div className="alert alert-warning border" role="status">
                        You are unlinking the payment from{" "}
                        {formatRange(
                          targetPeriodForPayment.periodStartDate,
                          targetPeriodForPayment.periodEndDateExclusive,
                        )}
                        .
                      </div>
                      <div className="small text-secondary mb-3">
                        Payment ID: {targetLinkedPaymentId}
                      </div>
                      <div className="form-check">
                        <input
                          id="unlinkPaymentConfirm"
                          className="form-check-input"
                          type="checkbox"
                          checked={unlinkPaymentConfirmed}
                          onChange={(event) =>
                            setUnlinkPaymentConfirmed(event.target.checked)
                          }
                        />
                        <label
                          className="form-check-label"
                          htmlFor="unlinkPaymentConfirm"
                        >
                          I confirm this payment should be unlinked from this
                          period.
                        </label>
                      </div>

                      {Object.values(unlinkPaymentFieldErrors).flat().length >
                        0 && (
                        <div
                          className="alert alert-danger border mt-3 mb-0"
                          role="alert"
                        >
                          {Object.values(unlinkPaymentFieldErrors)
                            .flat()
                            .join(" ")}
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setIsUnlinkPaymentModalOpen(false);
                          setTargetLinkedPaymentId("");
                        }}
                        disabled={loading || cardsLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => void handleUnlinkPaymentSubmit()}
                        disabled={loading || cardsLoading}
                      >
                        Confirm unlink
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}

          {isDetailsModalOpen && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                role="dialog"
              >
                <div
                  className="modal-dialog modal-xl modal-dialog-scrollable"
                  role="document"
                >
                  <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header">
                      <h5 className="modal-title">Reading period details</h5>
                      <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={closeDetailsModal}
                      ></button>
                    </div>
                    <div className="modal-body">
                      {!detailsPeriod || !detailsSummary ? (
                        <div className="text-secondary">Loading details...</div>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          <div className="card border shadow-sm mb-0">
                            <div className="card-body">
                              <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                                <div>
                                  <h6 className="mb-1">
                                    {formatPeriodHeading(
                                      detailsPeriod.periodEndDateExclusive,
                                    )}
                                  </h6>
                                  <div className="text-secondary small">
                                    {formatRange(
                                      detailsPeriod.periodStartDate,
                                      detailsPeriod.periodEndDateExclusive,
                                    )}
                                  </div>
                                </div>
                                <div className="text-end">
                                  <div className="fw-semibold">
                                    Period total:{" "}
                                    {formatCurrency(detailsSummary.periodTotal)}
                                  </div>
                                  <div className="small text-secondary">
                                    Difference:{" "}
                                    {formatCurrency(
                                      detailsSummary.periodDifference,
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="card border shadow-sm mb-0">
                            <div className="card-body">
                              <h6 className="mb-2">Calculation metadata</h6>
                              <div className="row g-3 small">
                                <div className="col-12 col-md-6">
                                  <div>
                                    <span className="text-secondary">
                                      Engine version:
                                    </span>{" "}
                                    <span className="fw-semibold">
                                      {detailsSummary.engineVersion}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-12 col-md-6">
                                  <div>
                                    <span className="text-secondary">
                                      Integrity checks:
                                    </span>{" "}
                                    <span
                                      className={`fw-semibold ${detailsSummary.integrityChecksPassed ? "text-success" : "text-danger"}`}
                                    >
                                      {detailsSummary.integrityChecksPassed
                                        ? "Passed"
                                        : "Failed"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="card border shadow-sm mb-0">
                            <div className="card-body">
                              <h6 className="mb-2">Boiler assumptions</h6>
                              <div className="row g-3 small">
                                <div className="col-12 col-md-6">
                                  <span className="text-secondary">
                                    Temp (deg C):
                                  </span>{" "}
                                  <span className="fw-semibold">
                                    {
                                      detailsSummary.boilerAssumptions
                                        .hotWaterTemperatureCelsius
                                    }
                                  </span>
                                </div>
                                <div className="col-12 col-md-6">
                                  <span className="text-secondary">
                                    Heat capacity:
                                  </span>{" "}
                                  <span className="fw-semibold">
                                    {
                                      detailsSummary.boilerAssumptions
                                        .hotWaterHeatCapacity
                                    }
                                  </span>
                                </div>
                                <div className="col-12 col-md-6">
                                  <span className="text-secondary">
                                    Water density:
                                  </span>{" "}
                                  <span className="fw-semibold">
                                    {
                                      detailsSummary.boilerAssumptions
                                        .hotWaterDensity
                                    }
                                  </span>
                                </div>
                                <div className="col-12 col-md-6">
                                  <span className="text-secondary">
                                    kJ to kWh factor:
                                  </span>{" "}
                                  <span className="fw-semibold">
                                    {
                                      detailsSummary.boilerAssumptions
                                        .kiloJouleToKiloWattHourFactor
                                    }
                                  </span>
                                </div>
                                <div className="col-12 col-md-6">
                                  <span className="text-secondary">
                                    kWh per m3:
                                  </span>{" "}
                                  <span className="fw-semibold">
                                    {
                                      detailsSummary.boilerAssumptions
                                        .boilerKwhPerCubicMeter
                                    }
                                  </span>
                                </div>
                                <div className="col-12 col-md-6">
                                  <span className="text-secondary">
                                    Efficiency (%):
                                  </span>{" "}
                                  <span className="fw-semibold">
                                    {
                                      detailsSummary.boilerAssumptions
                                        .boilerEfficiencyPercent
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="card border shadow-sm mb-0">
                            <div className="card-body">
                              <h6 className="mb-2">Tariff segments</h6>
                              <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                  <thead>
                                    <tr>
                                      <th scope="col">Segment</th>
                                      <th scope="col">Days</th>
                                      <th scope="col">Water Unit Rate</th>
                                      <th scope="col">Water Standing</th>
                                      <th scope="col">Water VAT</th>
                                      <th scope="col">Electric Unit Rate</th>
                                      <th scope="col">Electric Standing</th>
                                      <th scope="col">Electric VAT</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detailsSummary.tariffSegments.map(
                                      (segment, index) => (
                                        <tr
                                          key={`${segment.startDate}-${segment.endDateExclusive}-${index}`}
                                        >
                                          <td>
                                            <div>
                                              {formatRange(
                                                segment.startDate,
                                                segment.endDateExclusive,
                                              )}
                                            </div>
                                            {segment.isEstimatedAllocation && (
                                              <span className="badge bg-warning text-dark mt-1">
                                                Estimated allocation
                                              </span>
                                            )}
                                          </td>
                                          <td>{segment.days}</td>
                                          <td>
                                            {formatCurrencyUpTo5(
                                              segment.waterTariffPerUnit,
                                            )}{" "}
                                            /m3
                                          </td>
                                          <td>
                                            {formatCurrencyUpTo5(
                                              segment.waterStandingChargePerDay,
                                            )}{" "}
                                            /day
                                          </td>
                                          <td>
                                            {formatPercent(
                                              segment.waterVatPercent,
                                            )}
                                          </td>
                                          <td>
                                            {formatCurrencyUpTo5(
                                              segment.electricityTariffPerUnit,
                                            )}{" "}
                                            /kWh
                                          </td>
                                          <td>
                                            {formatCurrencyUpTo5(
                                              segment.electricityStandingChargePerDay,
                                            )}{" "}
                                            /day
                                          </td>
                                          <td>
                                            {formatPercent(
                                              segment.electricityVatPercent,
                                            )}
                                          </td>
                                        </tr>
                                      ),
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          <div className="card border shadow-sm mb-0">
                            <div className="card-body">
                              <h6 className="mb-2">Component equations</h6>
                              <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                  <thead>
                                    <tr>
                                      <th scope="col">Component</th>
                                      <th scope="col">Usage</th>
                                      <th scope="col">Usage total</th>
                                      <th scope="col">Standing total</th>
                                      <th scope="col">Total</th>
                                      <th scope="col">VAT</th>
                                      <th scope="col">Sub Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {detailsSummary.componentLines.map(
                                      (line) => (
                                        <tr key={line.component}>
                                          <td>{line.component}</td>
                                          <td>
                                            {formatComponentUsage(
                                              line.component,
                                              line.usage,
                                            )}
                                          </td>
                                          <td>
                                            <span
                                              className="text-decoration-underline"
                                              style={{
                                                textDecorationStyle: "dotted",
                                                cursor: "help",
                                              }}
                                              data-ba-tooltip="usage-subtotal"
                                              data-bs-toggle="tooltip"
                                              data-bs-placement="top"
                                              title={formatUsageSubtotalTooltip(
                                                line.usage,
                                                line.usageSubtotal,
                                              )}
                                            >
                                              {formatCurrency(
                                                line.usageSubtotal,
                                              )}
                                            </span>
                                          </td>
                                          <td>
                                            <span
                                              className="text-decoration-underline"
                                              style={{
                                                textDecorationStyle: "dotted",
                                                cursor: "help",
                                              }}
                                              data-ba-tooltip="standing-subtotal"
                                              data-bs-toggle="tooltip"
                                              data-bs-placement="top"
                                              title={formatStandingSubtotalTooltip(
                                                line.standingSubtotal,
                                                detailsPeriodDays,
                                              )}
                                            >
                                              {formatCurrency(
                                                line.standingSubtotal,
                                              )}
                                            </span>
                                          </td>
                                          <td>
                                            {formatCurrency(
                                              String(
                                                toNumber(line.usageSubtotal) +
                                                  toNumber(
                                                    line.standingSubtotal,
                                                  ),
                                              ),
                                            )}
                                          </td>
                                          <td>
                                            {formatCurrency(line.vatAmount)}
                                          </td>
                                          <td>{formatCurrency(line.total)}</td>
                                        </tr>
                                      ),
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          <div className="card border shadow-sm mb-0">
                            <div className="card-body">
                              <h6 className="mb-2">Equations</h6>
                              <div className="d-flex flex-column gap-3">
                                {detailsSummary.componentLines.map((line) => (
                                  <div
                                    key={`equation-${line.component}`}
                                    className="small border rounded p-2"
                                  >
                                    <div className="fw-semibold mb-1">
                                      {getComponentDisplayName(line.component)}
                                    </div>
                                    <div className="small font-monospace text-secondary">
                                      {renderEquationWithTooltips(
                                        getCanonicalEquation(
                                          line.component,
                                          line.equation,
                                        ),
                                      )}
                                    </div>
                                    {getBoilerUsageEquation(line.component) && (
                                      <div className="small font-monospace text-secondary mt-1">
                                        {renderEquationWithTooltips(
                                          getBoilerUsageEquation(
                                            line.component,
                                          ) ?? "",
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={closeDetailsModal}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}

          {isAverageModalOpen && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                role="dialog"
              >
                <div
                  className="modal-dialog modal-lg modal-dialog-scrollable"
                  role="document"
                >
                  <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header">
                      <h5 className="modal-title">Average monthly usage</h5>
                      <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={() => setIsAverageModalOpen(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p className="text-secondary small mb-3">
                        A typical month based on your latest two calculated
                        reading periods.
                      </p>

                      {insightsLoading && (
                        <div className="text-secondary">
                          Loading average summary...
                        </div>
                      )}

                      {!insightsLoading && insightsErrorMessage.length > 0 && (
                        <div
                          className="alert alert-warning border mb-0"
                          role="status"
                        >
                          {insightsErrorMessage}
                        </div>
                      )}

                      {!insightsLoading &&
                        insightsErrorMessage.length === 0 &&
                        averageSummaryRows.length > 0 && (
                          <div className="d-flex flex-column gap-3">
                            <div className="card border shadow-sm mb-0">
                              <div className="card-body py-3">
                                <div className="d-flex justify-content-between fw-semibold">
                                  <span>
                                    Water Usage:{" "}
                                    {formatUsage(
                                      String(averageWaterRow?.usage ?? 0),
                                    )}{" "}
                                    m3
                                  </span>
                                  <span>
                                    {formatCurrency(
                                      String(averageWaterRow?.cost ?? 0),
                                    )}
                                  </span>
                                </div>
                                <div className="d-flex justify-content-between small text-secondary mt-1">
                                  <span>
                                    Cold:{" "}
                                    {formatUsage(
                                      String(averageColdRow?.usage ?? 0),
                                    )}{" "}
                                    m3
                                  </span>
                                  <span>
                                    {formatCurrency(
                                      String(averageColdRow?.cost ?? 0),
                                    )}
                                  </span>
                                </div>
                                <div className="d-flex justify-content-between small text-secondary mt-1">
                                  <span>
                                    Hot:{" "}
                                    {formatUsage(
                                      String(averageHotRow?.usage ?? 0),
                                    )}{" "}
                                    m3
                                  </span>
                                  <span>
                                    {formatCurrency(
                                      String(averageHotRow?.cost ?? 0),
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="card border shadow-sm mb-0">
                              <div className="card-body py-3">
                                <div className="d-flex justify-content-between fw-semibold">
                                  <span>
                                    Electricity Usage:{" "}
                                    {formatUsage(
                                      String(averageElectricityRow?.usage ?? 0),
                                    )}{" "}
                                    kWh
                                  </span>
                                  <span>
                                    {formatCurrency(
                                      String(averageElectricityRow?.cost ?? 0),
                                    )}
                                  </span>
                                </div>
                                <div className="d-flex justify-content-between small text-secondary mt-1">
                                  <span>
                                    Apartment:{" "}
                                    {formatUsage(
                                      String(averageApartmentRow?.usage ?? 0),
                                    )}{" "}
                                    kWh
                                  </span>
                                  <span>
                                    {formatCurrency(
                                      String(averageApartmentRow?.cost ?? 0),
                                    )}
                                  </span>
                                </div>
                                <div className="d-flex justify-content-between small text-secondary mt-1">
                                  <span>
                                    Boiler:{" "}
                                    {formatUsage(
                                      String(averageBoilerRow?.usage ?? 0),
                                    )}{" "}
                                    kWh
                                  </span>
                                  <span>
                                    {formatCurrency(
                                      String(averageBoilerRow?.cost ?? 0),
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="card border shadow-sm mb-0">
                              <div className="card-body py-3">
                                <div className="d-flex justify-content-between fw-semibold">
                                  <span>Total (Water + Electricity):</span>
                                  <span>
                                    {formatCurrency(String(averageTotalCost))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setIsAverageModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}

          {isGuestimateModalOpen && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                role="dialog"
              >
                <div
                  className="modal-dialog modal-xl modal-dialog-scrollable"
                  role="document"
                >
                  <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header">
                      <h5 className="modal-title">Next month guestimate</h5>
                      <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={() => setIsGuestimateModalOpen(false)}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p className="text-secondary small mb-2">
                        Forecast uses a weighted daily average from the latest
                        two periods (60% latest, 40% previous), then applies a
                        -5% to +5% range.
                      </p>
                      {guestimateRangeLabel.length > 0 && (
                        <p className="text-secondary small mb-3">
                          Forecast period: {guestimateRangeLabel}
                        </p>
                      )}

                      {insightsLoading && (
                        <div className="text-secondary">
                          Loading next month guestimate...
                        </div>
                      )}

                      {!insightsLoading && insightsErrorMessage.length > 0 && (
                        <div
                          className="alert alert-warning border mb-0"
                          role="status"
                        >
                          {insightsErrorMessage}
                        </div>
                      )}

                      {!insightsLoading &&
                        insightsErrorMessage.length === 0 &&
                        guestimateRows.length > 0 && (
                          <div className="row g-3">
                            <div className="col-12 col-xl-4">
                              <div className="card shadow-sm h-100 mb-0 guestimate-card guestimate-card--low">
                                <div className="card-body py-3">
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="fw-semibold guestimate-title guestimate-title--low">
                                      Low (-5%)
                                    </div>
                                    <span className="badge guestimate-badge guestimate-badge--low">
                                      Lower use
                                    </span>
                                  </div>

                                  <div className="d-flex justify-content-between fw-semibold">
                                    <span>
                                      Water Usage:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateWaterRow?.lowUsage ?? 0,
                                        ),
                                      )}{" "}
                                      m3
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateWaterRow?.lowCost ?? 0,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between small guestimate-subtle mt-1">
                                    <span>
                                      Cold:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateColdRow?.lowUsage ?? 0,
                                        ),
                                      )}{" "}
                                      m3
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(guestimateColdRow?.lowCost ?? 0),
                                      )}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between small guestimate-subtle mt-1">
                                    <span>
                                      Hot:{" "}
                                      {formatUsage(
                                        String(guestimateHotRow?.lowUsage ?? 0),
                                      )}{" "}
                                      m3
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(guestimateHotRow?.lowCost ?? 0),
                                      )}
                                    </span>
                                  </div>

                                  <div className="d-flex justify-content-between fw-semibold mt-3">
                                    <span>
                                      Electricity Usage:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateElectricityRow?.lowUsage ??
                                            0,
                                        ),
                                      )}{" "}
                                      kWh
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateElectricityRow?.lowCost ??
                                            0,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between small guestimate-subtle mt-1">
                                    <span>
                                      Apartment:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateApartmentRow?.lowUsage ?? 0,
                                        ),
                                      )}{" "}
                                      kWh
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateApartmentRow?.lowCost ?? 0,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between small guestimate-subtle mt-1">
                                    <span>
                                      Boiler:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateBoilerRow?.lowUsage ?? 0,
                                        ),
                                      )}{" "}
                                      kWh
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateBoilerRow?.lowCost ?? 0,
                                        ),
                                      )}
                                    </span>
                                  </div>

                                  <div className="d-flex justify-content-between fw-semibold mt-3 pt-2 border-top guestimate-total guestimate-total--low">
                                    <span>Total (Water + Electricity):</span>
                                    <span>
                                      {formatCurrency(String(lowTotalCost))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="col-12 col-xl-4">
                              <div className="card shadow-sm h-100 mb-0 guestimate-card guestimate-card--expected">
                                <div className="card-body py-3">
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="fw-semibold guestimate-title guestimate-title--expected">
                                      Expected
                                    </div>
                                    <span className="badge guestimate-badge guestimate-badge--expected">
                                      Most likely
                                    </span>
                                  </div>

                                  <div className="d-flex justify-content-between fw-semibold">
                                    <span>
                                      Water Usage:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateWaterRow?.expectedUsage ??
                                            0,
                                        ),
                                      )}{" "}
                                      m3
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateWaterRow?.expectedCost ?? 0,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between small guestimate-subtle mt-1">
                                    <span>
                                      Cold:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateColdRow?.expectedUsage ?? 0,
                                        ),
                                      )}{" "}
                                      m3
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateColdRow?.expectedCost ?? 0,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between small guestimate-subtle mt-1">
                                    <span>
                                      Hot:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateHotRow?.expectedUsage ?? 0,
                                        ),
                                      )}{" "}
                                      m3
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateHotRow?.expectedCost ?? 0,
                                        ),
                                      )}
                                    </span>
                                  </div>

                                  <div className="d-flex justify-content-between fw-semibold mt-3">
                                    <span>
                                      Electricity Usage:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateElectricityRow?.expectedUsage ??
                                            0,
                                        ),
                                      )}{" "}
                                      kWh
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateElectricityRow?.expectedCost ??
                                            0,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between small guestimate-subtle mt-1">
                                    <span>
                                      Apartment:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateApartmentRow?.expectedUsage ??
                                            0,
                                        ),
                                      )}{" "}
                                      kWh
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateApartmentRow?.expectedCost ??
                                            0,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between small guestimate-subtle mt-1">
                                    <span>
                                      Boiler:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateBoilerRow?.expectedUsage ??
                                            0,
                                        ),
                                      )}{" "}
                                      kWh
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateBoilerRow?.expectedCost ??
                                            0,
                                        ),
                                      )}
                                    </span>
                                  </div>

                                  <div className="d-flex justify-content-between fw-semibold mt-3 pt-2 border-top guestimate-total guestimate-total--expected">
                                    <span>Total (Water + Electricity):</span>
                                    <span>
                                      {formatCurrency(
                                        String(expectedTotalCost),
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="col-12 col-xl-4">
                              <div className="card shadow-sm h-100 mb-0 guestimate-card guestimate-card--high">
                                <div className="card-body py-3">
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="fw-semibold guestimate-title guestimate-title--high">
                                      High (+5%)
                                    </div>
                                    <span className="badge guestimate-badge guestimate-badge--high">
                                      Higher use
                                    </span>
                                  </div>

                                  <div className="d-flex justify-content-between fw-semibold">
                                    <span>
                                      Water Usage:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateWaterRow?.highUsage ?? 0,
                                        ),
                                      )}{" "}
                                      m3
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateWaterRow?.highCost ?? 0,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between small guestimate-subtle mt-1">
                                    <span>
                                      Cold:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateColdRow?.highUsage ?? 0,
                                        ),
                                      )}{" "}
                                      m3
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateColdRow?.highCost ?? 0,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between small guestimate-subtle mt-1">
                                    <span>
                                      Hot:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateHotRow?.highUsage ?? 0,
                                        ),
                                      )}{" "}
                                      m3
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(guestimateHotRow?.highCost ?? 0),
                                      )}
                                    </span>
                                  </div>

                                  <div className="d-flex justify-content-between fw-semibold mt-3">
                                    <span>
                                      Electricity Usage:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateElectricityRow?.highUsage ??
                                            0,
                                        ),
                                      )}{" "}
                                      kWh
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateElectricityRow?.highCost ??
                                            0,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between small guestimate-subtle mt-1">
                                    <span>
                                      Apartment:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateApartmentRow?.highUsage ??
                                            0,
                                        ),
                                      )}{" "}
                                      kWh
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateApartmentRow?.highCost ?? 0,
                                        ),
                                      )}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between small guestimate-subtle mt-1">
                                    <span>
                                      Boiler:{" "}
                                      {formatUsage(
                                        String(
                                          guestimateBoilerRow?.highUsage ?? 0,
                                        ),
                                      )}{" "}
                                      kWh
                                    </span>
                                    <span>
                                      {formatCurrency(
                                        String(
                                          guestimateBoilerRow?.highCost ?? 0,
                                        ),
                                      )}
                                    </span>
                                  </div>

                                  <div className="d-flex justify-content-between fw-semibold mt-3 pt-2 border-top guestimate-total guestimate-total--high">
                                    <span>Total (Water + Electricity):</span>
                                    <span>
                                      {formatCurrency(String(highTotalCost))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setIsGuestimateModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
