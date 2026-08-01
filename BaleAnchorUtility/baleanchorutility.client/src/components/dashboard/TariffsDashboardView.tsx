import type { ReactNode } from "react";
import type {
  ActiveBoilerAssumptionResponse,
  ActiveTariffResponse,
  CalculateLatestPeriodResponse,
  FieldErrors,
} from "../../shared/contracts";

interface TariffsDashboardViewProps {
  shellHeader: ReactNode;
  routeTabs: ReactNode;
  loading: boolean;
  tariffEffectiveFromDate: string;
  waterTariffPerUnit: string;
  waterStandingChargePerDay: string;
  waterVatPercent: string;
  electricityTariffPerUnit: string;
  electricityStandingChargePerDay: string;
  electricityVatPercent: string;
  boilerEffectiveFromDate: string;
  hotWaterTemperatureCelsius: string;
  hotWaterHeatCapacity: string;
  hotWaterDensity: string;
  kiloJouleToKiloWattHourFactor: string;
  boilerKwhPerCubicMeter: string;
  boilerEfficiencyPercent: string;
  tariffFieldErrors: FieldErrors;
  boilerFieldErrors: FieldErrors;
  billingMessage: string;
  activeTariff: ActiveTariffResponse | null;
  activeBoilerAssumption: ActiveBoilerAssumptionResponse | null;
  latestCalculation: CalculateLatestPeriodResponse | null;
  getFieldErrors: (errors: FieldErrors, fieldName: string) => string[];
  onTariffEffectiveFromDateChange: (value: string) => void;
  onWaterTariffPerUnitChange: (value: string) => void;
  onWaterStandingChargePerDayChange: (value: string) => void;
  onWaterVatPercentChange: (value: string) => void;
  onElectricityTariffPerUnitChange: (value: string) => void;
  onElectricityStandingChargePerDayChange: (value: string) => void;
  onElectricityVatPercentChange: (value: string) => void;
  onBoilerEffectiveFromDateChange: (value: string) => void;
  onHotWaterTemperatureCelsiusChange: (value: string) => void;
  onHotWaterHeatCapacityChange: (value: string) => void;
  onHotWaterDensityChange: (value: string) => void;
  onKiloJouleToKiloWattHourFactorChange: (value: string) => void;
  onBoilerKwhPerCubicMeterChange: (value: string) => void;
  onBoilerEfficiencyPercentChange: (value: string) => void;
  onSubmitTariffVersion: () => Promise<void>;
  onLoadActiveTariff: () => Promise<void>;
  onSubmitBoilerAssumptionVersion: () => Promise<void>;
  onLoadActiveBoilerAssumption: () => Promise<void>;
  onRunLatestCalculation: () => Promise<void>;
  onLoadLatestCalculation: () => Promise<void>;
  formatDateRange: (startDate: string, endDateExclusive: string) => string;
  formatCurrencyGbp: (value?: string) => string;
}

export function TariffsDashboardView({
  shellHeader,
  routeTabs,
  loading,
  tariffEffectiveFromDate,
  waterTariffPerUnit,
  waterStandingChargePerDay,
  waterVatPercent,
  electricityTariffPerUnit,
  electricityStandingChargePerDay,
  electricityVatPercent,
  boilerEffectiveFromDate,
  hotWaterTemperatureCelsius,
  hotWaterHeatCapacity,
  hotWaterDensity,
  kiloJouleToKiloWattHourFactor,
  boilerKwhPerCubicMeter,
  boilerEfficiencyPercent,
  tariffFieldErrors,
  boilerFieldErrors,
  billingMessage,
  activeTariff,
  activeBoilerAssumption,
  latestCalculation,
  getFieldErrors,
  onTariffEffectiveFromDateChange,
  onWaterTariffPerUnitChange,
  onWaterStandingChargePerDayChange,
  onWaterVatPercentChange,
  onElectricityTariffPerUnitChange,
  onElectricityStandingChargePerDayChange,
  onElectricityVatPercentChange,
  onBoilerEffectiveFromDateChange,
  onHotWaterTemperatureCelsiusChange,
  onHotWaterHeatCapacityChange,
  onHotWaterDensityChange,
  onKiloJouleToKiloWattHourFactorChange,
  onBoilerKwhPerCubicMeterChange,
  onBoilerEfficiencyPercentChange,
  onSubmitTariffVersion,
  onLoadActiveTariff,
  onSubmitBoilerAssumptionVersion,
  onLoadActiveBoilerAssumption,
  onRunLatestCalculation,
  onLoadLatestCalculation,
  formatDateRange,
  formatCurrencyGbp,
}: TariffsDashboardViewProps) {
  return (
    <div className="wrapper">
      {shellHeader}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Tariffs and calculations</h1>
              <p className="hero-copy mb-0">
                Maintain dated water and electricity tariffs, then run or review
                the latest billing calculation snapshot.
              </p>
            </div>
          </section>

          {routeTabs}

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Tariff management</h5>
              <p className="text-secondary mb-3">
                Save a dated tariff version and use the calculation actions to
                refresh the latest period output.
              </p>

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
                    className={`form-control ${getFieldErrors(tariffFieldErrors, "effectiveFromDate").length > 0 ? "is-invalid" : ""}`}
                    value={tariffEffectiveFromDate}
                    onChange={(event) =>
                      onTariffEffectiveFromDateChange(event.target.value)
                    }
                  />
                  {getFieldErrors(tariffFieldErrors, "effectiveFromDate")
                    .length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        tariffFieldErrors,
                        "effectiveFromDate",
                      ).join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="waterTariffPerUnit" className="form-label">
                    Water tariff per unit
                  </label>
                  <input
                    id="waterTariffPerUnit"
                    type="text"
                    className={`form-control ${getFieldErrors(tariffFieldErrors, "waterTariffPerUnit").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.000000"
                    value={waterTariffPerUnit}
                    onChange={(event) =>
                      onWaterTariffPerUnitChange(event.target.value)
                    }
                  />
                  {getFieldErrors(tariffFieldErrors, "waterTariffPerUnit")
                    .length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        tariffFieldErrors,
                        "waterTariffPerUnit",
                      ).join(" ")}
                    </div>
                  )}
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
                    className={`form-control ${getFieldErrors(tariffFieldErrors, "waterStandingChargePerDay").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.000000"
                    value={waterStandingChargePerDay}
                    onChange={(event) =>
                      onWaterStandingChargePerDayChange(event.target.value)
                    }
                  />
                  {getFieldErrors(
                    tariffFieldErrors,
                    "waterStandingChargePerDay",
                  ).length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        tariffFieldErrors,
                        "waterStandingChargePerDay",
                      ).join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="waterVatPercent" className="form-label">
                    Water VAT %
                  </label>
                  <input
                    id="waterVatPercent"
                    type="text"
                    className={`form-control ${getFieldErrors(tariffFieldErrors, "waterVatPercent").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.00"
                    value={waterVatPercent}
                    onChange={(event) =>
                      onWaterVatPercentChange(event.target.value)
                    }
                  />
                  {getFieldErrors(tariffFieldErrors, "waterVatPercent").length >
                    0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        tariffFieldErrors,
                        "waterVatPercent",
                      ).join(" ")}
                    </div>
                  )}
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
                    className={`form-control ${getFieldErrors(tariffFieldErrors, "electricityTariffPerUnit").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.000000"
                    value={electricityTariffPerUnit}
                    onChange={(event) =>
                      onElectricityTariffPerUnitChange(event.target.value)
                    }
                  />
                  {getFieldErrors(tariffFieldErrors, "electricityTariffPerUnit")
                    .length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        tariffFieldErrors,
                        "electricityTariffPerUnit",
                      ).join(" ")}
                    </div>
                  )}
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
                    className={`form-control ${getFieldErrors(tariffFieldErrors, "electricityStandingChargePerDay").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.000000"
                    value={electricityStandingChargePerDay}
                    onChange={(event) =>
                      onElectricityStandingChargePerDayChange(
                        event.target.value,
                      )
                    }
                  />
                  {getFieldErrors(
                    tariffFieldErrors,
                    "electricityStandingChargePerDay",
                  ).length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        tariffFieldErrors,
                        "electricityStandingChargePerDay",
                      ).join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="electricityVatPercent" className="form-label">
                    Elec VAT %
                  </label>
                  <input
                    id="electricityVatPercent"
                    type="text"
                    className={`form-control ${getFieldErrors(tariffFieldErrors, "electricityVatPercent").length > 0 ? "is-invalid" : ""}`}
                    placeholder="5.00"
                    value={electricityVatPercent}
                    onChange={(event) =>
                      onElectricityVatPercentChange(event.target.value)
                    }
                  />
                  {getFieldErrors(tariffFieldErrors, "electricityVatPercent")
                    .length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        tariffFieldErrors,
                        "electricityVatPercent",
                      ).join(" ")}
                    </div>
                  )}
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

              <hr className="my-4" />

              <h5 className="mb-3">Boiler assumptions management</h5>
              <p className="text-secondary mb-3">
                Save dated boiler assumptions. The latest applicable version is
                used in Add Reading and billing calculations.
              </p>

              <div className="row g-3 align-items-end">
                <div className="col-12 col-lg-2">
                  <label
                    htmlFor="boilerEffectiveFromDate"
                    className="form-label"
                  >
                    Boiler effective from
                  </label>
                  <input
                    id="boilerEffectiveFromDate"
                    type="date"
                    className={`form-control ${getFieldErrors(boilerFieldErrors, "effectiveFromDate").length > 0 ? "is-invalid" : ""}`}
                    value={boilerEffectiveFromDate}
                    onChange={(event) =>
                      onBoilerEffectiveFromDateChange(event.target.value)
                    }
                  />
                  {getFieldErrors(boilerFieldErrors, "effectiveFromDate")
                    .length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        boilerFieldErrors,
                        "effectiveFromDate",
                      ).join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-2">
                  <label
                    htmlFor="hotWaterTemperatureCelsius"
                    className="form-label"
                  >
                    Temp (C)
                  </label>
                  <input
                    id="hotWaterTemperatureCelsius"
                    type="text"
                    className={`form-control ${getFieldErrors(boilerFieldErrors, "hotWaterTemperatureCelsius").length > 0 ? "is-invalid" : ""}`}
                    placeholder="55.000000"
                    value={hotWaterTemperatureCelsius}
                    onChange={(event) =>
                      onHotWaterTemperatureCelsiusChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="hotWaterHeatCapacity" className="form-label">
                    Heat cap
                  </label>
                  <input
                    id="hotWaterHeatCapacity"
                    type="text"
                    className={`form-control ${getFieldErrors(boilerFieldErrors, "hotWaterHeatCapacity").length > 0 ? "is-invalid" : ""}`}
                    placeholder="4.186000"
                    value={hotWaterHeatCapacity}
                    onChange={(event) =>
                      onHotWaterHeatCapacityChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="hotWaterDensity" className="form-label">
                    Density
                  </label>
                  <input
                    id="hotWaterDensity"
                    type="text"
                    className={`form-control ${getFieldErrors(boilerFieldErrors, "hotWaterDensity").length > 0 ? "is-invalid" : ""}`}
                    placeholder="1000.000000"
                    value={hotWaterDensity}
                    onChange={(event) =>
                      onHotWaterDensityChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label
                    htmlFor="kiloJouleToKiloWattHourFactor"
                    className="form-label"
                  >
                    kJ to kWh
                  </label>
                  <input
                    id="kiloJouleToKiloWattHourFactor"
                    type="text"
                    className={`form-control ${getFieldErrors(boilerFieldErrors, "kiloJouleToKiloWattHourFactor").length > 0 ? "is-invalid" : ""}`}
                    placeholder="3600.000000"
                    value={kiloJouleToKiloWattHourFactor}
                    onChange={(event) =>
                      onKiloJouleToKiloWattHourFactorChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label
                    htmlFor="boilerKwhPerCubicMeter"
                    className="form-label"
                  >
                    Boiler kWh/m3
                  </label>
                  <input
                    id="boilerKwhPerCubicMeter"
                    type="text"
                    className={`form-control ${getFieldErrors(boilerFieldErrors, "boilerKwhPerCubicMeter").length > 0 ? "is-invalid" : ""}`}
                    placeholder="10.500000"
                    value={boilerKwhPerCubicMeter}
                    onChange={(event) =>
                      onBoilerKwhPerCubicMeterChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label
                    htmlFor="boilerEfficiencyPercent"
                    className="form-label"
                  >
                    Efficiency %
                  </label>
                  <input
                    id="boilerEfficiencyPercent"
                    type="text"
                    className={`form-control ${getFieldErrors(boilerFieldErrors, "boilerEfficiencyPercent").length > 0 ? "is-invalid" : ""}`}
                    placeholder="85.000000"
                    value={boilerEfficiencyPercent}
                    onChange={(event) =>
                      onBoilerEfficiencyPercentChange(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => void onSubmitBoilerAssumptionVersion()}
                  disabled={loading}
                >
                  Save boiler version
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void onLoadActiveBoilerAssumption()}
                  disabled={loading}
                >
                  Load active boiler assumptions
                </button>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">
                  Tariffs and calculation status
                </div>
                <div>{billingMessage}</div>
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
                {activeBoilerAssumption && (
                  <div className="mt-2 text-secondary small">
                    Boiler from {activeBoilerAssumption.effectiveFromDate}
                    {` | Temp: ${activeBoilerAssumption.hotWaterTemperatureCelsius}`}
                    {` | Heat cap: ${activeBoilerAssumption.hotWaterHeatCapacity}`}
                    {` | Density: ${activeBoilerAssumption.hotWaterDensity}`}
                    {` | kJ→kWh: ${activeBoilerAssumption.kiloJouleToKiloWattHourFactor}`}
                    {` | kWh/m3: ${activeBoilerAssumption.boilerKwhPerCubicMeter}`}
                    {` | Efficiency: ${activeBoilerAssumption.boilerEfficiencyPercent}%`}
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
