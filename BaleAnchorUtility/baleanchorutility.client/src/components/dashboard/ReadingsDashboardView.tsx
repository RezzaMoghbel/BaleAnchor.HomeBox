import type { ReactNode } from "react";
import type {
  ActiveTariffResponse,
  CalculateLatestPeriodResponse,
  LatestReadingsResponse,
} from "../../shared/contracts";

interface ReadingsDashboardViewProps {
  shellHeader: ReactNode;
  routeTabs: ReactNode;
  loading: boolean;
  readingDate: string;
  coldWaterReading: string;
  hotWaterReading: string;
  electricityReading: string;
  tariffEffectiveFromDate: string;
  waterTariffPerUnit: string;
  waterStandingChargePerDay: string;
  waterVatPercent: string;
  electricityTariffPerUnit: string;
  electricityStandingChargePerDay: string;
  electricityVatPercent: string;
  billingMessage: string;
  latestReadings: LatestReadingsResponse | null;
  activeTariff: ActiveTariffResponse | null;
  latestCalculation: CalculateLatestPeriodResponse | null;
  onReadingDateChange: (value: string) => void;
  onColdWaterReadingChange: (value: string) => void;
  onHotWaterReadingChange: (value: string) => void;
  onElectricityReadingChange: (value: string) => void;
  onTariffEffectiveFromDateChange: (value: string) => void;
  onWaterTariffPerUnitChange: (value: string) => void;
  onWaterStandingChargePerDayChange: (value: string) => void;
  onWaterVatPercentChange: (value: string) => void;
  onElectricityTariffPerUnitChange: (value: string) => void;
  onElectricityStandingChargePerDayChange: (value: string) => void;
  onElectricityVatPercentChange: (value: string) => void;
  onSubmitReadings: () => Promise<void>;
  onLoadLatestReadings: () => Promise<void>;
  onSubmitTariffVersion: () => Promise<void>;
  onLoadActiveTariff: () => Promise<void>;
  onRunLatestCalculation: () => Promise<void>;
  onLoadLatestCalculation: () => Promise<void>;
  formatDateRange: (startDate: string, endDateExclusive: string) => string;
  formatCurrencyGbp: (value?: string) => string;
}

export function ReadingsDashboardView({
  shellHeader,
  routeTabs,
  loading,
  readingDate,
  coldWaterReading,
  hotWaterReading,
  electricityReading,
  tariffEffectiveFromDate,
  waterTariffPerUnit,
  waterStandingChargePerDay,
  waterVatPercent,
  electricityTariffPerUnit,
  electricityStandingChargePerDay,
  electricityVatPercent,
  billingMessage,
  latestReadings,
  activeTariff,
  latestCalculation,
  onReadingDateChange,
  onColdWaterReadingChange,
  onHotWaterReadingChange,
  onElectricityReadingChange,
  onTariffEffectiveFromDateChange,
  onWaterTariffPerUnitChange,
  onWaterStandingChargePerDayChange,
  onWaterVatPercentChange,
  onElectricityTariffPerUnitChange,
  onElectricityStandingChargePerDayChange,
  onElectricityVatPercentChange,
  onSubmitReadings,
  onLoadLatestReadings,
  onSubmitTariffVersion,
  onLoadActiveTariff,
  onRunLatestCalculation,
  onLoadLatestCalculation,
  formatDateRange,
  formatCurrencyGbp,
}: ReadingsDashboardViewProps) {
  return (
    <div className="wrapper">
      {shellHeader}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Readings and tariff controls</h1>
              <p className="hero-copy mb-0">
                Submit combined meter readings, maintain dated tariffs, and
                refresh calculation snapshots for your billing period.
              </p>
            </div>
          </section>

          {routeTabs}

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Billing Inputs</h5>
              <p className="text-secondary mb-3">
                Submit combined meter readings and maintain dated tariffs for
                independent billing inputs.
              </p>

              <div className="row g-3 align-items-end">
                <div className="col-12 col-lg-3">
                  <label htmlFor="readingDate" className="form-label">
                    Reading date
                  </label>
                  <input
                    id="readingDate"
                    type="date"
                    className="form-control"
                    value={readingDate}
                    onChange={(event) =>
                      onReadingDateChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="coldWaterReading" className="form-label">
                    Cold water
                  </label>
                  <input
                    id="coldWaterReading"
                    type="text"
                    className="form-control"
                    placeholder="0.000"
                    value={coldWaterReading}
                    onChange={(event) =>
                      onColdWaterReadingChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="hotWaterReading" className="form-label">
                    Hot water
                  </label>
                  <input
                    id="hotWaterReading"
                    type="text"
                    className="form-control"
                    placeholder="0.000"
                    value={hotWaterReading}
                    onChange={(event) =>
                      onHotWaterReadingChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="electricityReading" className="form-label">
                    Electricity
                  </label>
                  <input
                    id="electricityReading"
                    type="text"
                    className="form-control"
                    placeholder="0.000"
                    value={electricityReading}
                    onChange={(event) =>
                      onElectricityReadingChange(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => void onSubmitReadings()}
                  disabled={loading}
                >
                  Submit readings
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void onLoadLatestReadings()}
                  disabled={loading}
                >
                  Load latest readings
                </button>
              </div>

              <hr />

              <div className="row g-3 align-items-end">
                <div className="col-12 col-lg-2">
                  <label
                    htmlFor="tariffEffectiveFromDate"
                    className="form-label"
                  >
                    Tariff effective from
                  </label>
                  <input
                    id="tariffEffectiveFromDate"
                    type="date"
                    className="form-control"
                    value={tariffEffectiveFromDate}
                    onChange={(event) =>
                      onTariffEffectiveFromDateChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="waterTariffPerUnit" className="form-label">
                    Water tariff per unit
                  </label>
                  <input
                    id="waterTariffPerUnit"
                    type="text"
                    className="form-control"
                    placeholder="0.000000"
                    value={waterTariffPerUnit}
                    onChange={(event) =>
                      onWaterTariffPerUnitChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label
                    htmlFor="waterStandingChargePerDay"
                    className="form-label"
                  >
                    Water standing/day
                  </label>
                  <input
                    id="waterStandingChargePerDay"
                    type="text"
                    className="form-control"
                    placeholder="0.000000"
                    value={waterStandingChargePerDay}
                    onChange={(event) =>
                      onWaterStandingChargePerDayChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="waterVatPercent" className="form-label">
                    Water VAT %
                  </label>
                  <input
                    id="waterVatPercent"
                    type="text"
                    className="form-control"
                    placeholder="0.00"
                    value={waterVatPercent}
                    onChange={(event) =>
                      onWaterVatPercentChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label
                    htmlFor="electricityTariffPerUnit"
                    className="form-label"
                  >
                    Electricity tariff per unit
                  </label>
                  <input
                    id="electricityTariffPerUnit"
                    type="text"
                    className="form-control"
                    placeholder="0.000000"
                    value={electricityTariffPerUnit}
                    onChange={(event) =>
                      onElectricityTariffPerUnitChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label
                    htmlFor="electricityStandingChargePerDay"
                    className="form-label"
                  >
                    Elec standing/day
                  </label>
                  <input
                    id="electricityStandingChargePerDay"
                    type="text"
                    className="form-control"
                    placeholder="0.000000"
                    value={electricityStandingChargePerDay}
                    onChange={(event) =>
                      onElectricityStandingChargePerDayChange(
                        event.target.value,
                      )
                    }
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="electricityVatPercent" className="form-label">
                    Elec VAT %
                  </label>
                  <input
                    id="electricityVatPercent"
                    type="text"
                    className="form-control"
                    placeholder="5.00"
                    value={electricityVatPercent}
                    onChange={(event) =>
                      onElectricityVatPercentChange(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={() => void onSubmitTariffVersion()}
                  disabled={loading}
                >
                  Save tariff version
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void onLoadActiveTariff()}
                  disabled={loading}
                >
                  Load active tariff
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => void onRunLatestCalculation()}
                  disabled={loading}
                >
                  Run latest calculation
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => void onLoadLatestCalculation()}
                  disabled={loading}
                >
                  Load latest calculation
                </button>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">Billing status</div>
                <div>{billingMessage}</div>
                {latestReadings && (
                  <div className="mt-2 text-secondary small">
                    Latest ({latestReadings.readingDate})
                    {` | Cold: ${latestReadings.coldWaterReading}`}
                    {` | Hot: ${latestReadings.hotWaterReading}`}
                    {` | Electricity: ${latestReadings.electricityReading}`}
                  </div>
                )}
                {activeTariff && (
                  <div className="mt-2 text-secondary small">
                    Tariff from {activeTariff.effectiveFromDate}
                    {` | Water unit: ${activeTariff.waterTariffPerUnit}`}
                    {` | Water standing/day: ${activeTariff.waterStandingChargePerDay}`}
                    {` | Water VAT: ${activeTariff.waterVatPercent}%`}
                    {` | Elec unit: ${activeTariff.electricityTariffPerUnit}`}
                    {` | Elec standing/day: ${activeTariff.electricityStandingChargePerDay}`}
                    {` | Elec VAT: ${activeTariff.electricityVatPercent}%`}
                  </div>
                )}
                {latestCalculation && (
                  <div className="mt-2 text-secondary small">
                    Calc{" "}
                    {formatDateRange(
                      latestCalculation.periodStartDate,
                      latestCalculation.periodEndDateExclusive,
                    )}
                    {` | Period total: ${formatCurrencyGbp(latestCalculation.periodTotal)}`}
                    {latestCalculation.containsEstimatedSegments
                      ? " | Estimated segments applied"
                      : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
