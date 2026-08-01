import { useEffect, useState, type ReactNode } from "react";
import { PortalApiError, portalClient } from "../../api/portalClient";
import type {
  BoilerAssumptionOptionItemResponse,
  FieldErrors,
  LatestReadingsResponse,
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
  const pageSize = 12;

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

  const openAddModal = () => {
    const today = new Date();
    const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    setModalMode("add");
    onReadingDateChange(localToday);
    onColdWaterReadingChange(latestReadings?.coldWaterReading ?? "");
    onHotWaterReadingChange(latestReadings?.hotWaterReading ?? "");
    onElectricityReadingChange(latestReadings?.electricityReading ?? "");
    setTariffOptions([]);
    setBoilerOptions([]);
    setSelectedTariffEffectiveFromDate("");
    setSelectedBoilerEffectiveFromDate("");
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

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setDetailsSnapshotId(null);
  };

  const handleModalSubmit = async () => {
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
                    disabled={loading || cardsLoading}
                  >
                    Refresh dashboard
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={openAddModal}
                    disabled={loading || cardsLoading}
                  >
                    Add new reading
                  </button>
                </div>
              </div>

              <div className="alert alert-light border mb-3" role="status">
                <div className="fw-semibold mb-1">Dashboard status</div>
                <div>{dashboardMessage}</div>
                <div className="mt-1 text-secondary small">
                  {billingMessage}
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
                                      <span>Payment recorded:</span>
                                      <span>
                                        {formatCurrency(period.paymentAmount)}
                                      </span>
                                    </div>
                                    <div className="d-flex justify-content-between fw-semibold mt-1">
                                      <span>Period difference:</span>
                                      <span>
                                        {formatCurrency(
                                          period.periodDifference,
                                        )}
                                      </span>
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
                            value={readingDate}
                            onChange={(event) =>
                              onReadingDateChange(event.target.value)
                            }
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
        </div>
      </main>
    </div>
  );
}
