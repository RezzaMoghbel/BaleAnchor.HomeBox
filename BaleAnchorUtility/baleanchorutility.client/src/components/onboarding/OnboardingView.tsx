import type { ReactNode } from "react";
import type {
  ActiveTermsResponse,
  FieldErrors,
  OnboardingProgressResponse,
} from "../../shared/contracts";

interface OnboardingViewProps {
  shellHeader: ReactNode;
  loading: boolean;
  activeTerms: ActiveTermsResponse | null;
  termsMessage: string;
  profileMessage: string;
  utilitySetupMessage: string;
  progressMessage: string;
  onboardingProgress: OnboardingProgressResponse | null;
  surname: string;
  dateOfBirth: string;
  flatNumber: string;
  mobileNumber: string;
  moveInDate: string;
  openingColdWaterReading: string;
  openingHotWaterReading: string;
  openingElectricityReading: string;
  initialWaterTariffPerUnit: string;
  initialElectricityTariffPerUnit: string;
  boilerKwhPerCubicMeter: string;
  boilerEfficiencyPercent: string;
  profileFieldErrors: FieldErrors;
  utilityFieldErrors: FieldErrors;
  getFieldErrors: (errors: FieldErrors, fieldName: string) => string[];
  onLoadActiveTerms: () => Promise<void>;
  onAcceptTerms: () => Promise<void>;
  onSubmitProfile: () => Promise<void>;
  onSubmitUtilitySetup: () => Promise<void>;
  onLoadOnboardingProgress: () => Promise<void>;
  onSurnameChange: (value: string) => void;
  onDateOfBirthChange: (value: string) => void;
  onFlatNumberChange: (value: string) => void;
  onMobileNumberChange: (value: string) => void;
  onMoveInDateChange: (value: string) => void;
  onOpeningColdWaterReadingChange: (value: string) => void;
  onOpeningHotWaterReadingChange: (value: string) => void;
  onOpeningElectricityReadingChange: (value: string) => void;
  onInitialWaterTariffPerUnitChange: (value: string) => void;
  onInitialElectricityTariffPerUnitChange: (value: string) => void;
  onBoilerKwhPerCubicMeterChange: (value: string) => void;
  onBoilerEfficiencyPercentChange: (value: string) => void;
}

export function OnboardingView({
  shellHeader,
  loading,
  activeTerms,
  termsMessage,
  profileMessage,
  utilitySetupMessage,
  progressMessage,
  onboardingProgress,
  surname,
  dateOfBirth,
  flatNumber,
  mobileNumber,
  moveInDate,
  openingColdWaterReading,
  openingHotWaterReading,
  openingElectricityReading,
  initialWaterTariffPerUnit,
  initialElectricityTariffPerUnit,
  boilerKwhPerCubicMeter,
  boilerEfficiencyPercent,
  profileFieldErrors,
  utilityFieldErrors,
  getFieldErrors,
  onLoadActiveTerms,
  onAcceptTerms,
  onSubmitProfile,
  onSubmitUtilitySetup,
  onLoadOnboardingProgress,
  onSurnameChange,
  onDateOfBirthChange,
  onFlatNumberChange,
  onMobileNumberChange,
  onMoveInDateChange,
  onOpeningColdWaterReadingChange,
  onOpeningHotWaterReadingChange,
  onOpeningElectricityReadingChange,
  onInitialWaterTariffPerUnitChange,
  onInitialElectricityTariffPerUnitChange,
  onBoilerKwhPerCubicMeterChange,
  onBoilerEfficiencyPercentChange,
}: OnboardingViewProps) {
  return (
    <div className="wrapper">
      {shellHeader}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <div className="row g-4 align-items-center">
                <div className="col-12 col-xl-8">
                  <span className="hero-eyebrow">Setup flow</span>
                  <h1 className="hero-title mb-3">
                    Complete onboarding in the order CLAUDE requires.
                  </h1>
                  <p className="hero-copy mb-0">
                    Terms acceptance, profile completion, and utility setup are
                    the next visible steps after login.
                  </p>
                </div>
                <div className="col-12 col-xl-4">
                  <div className="metric-card">
                    <div className="metric-label">Next step</div>
                    <div className="metric-value">
                      {onboardingProgress?.nextStep ??
                        "Load your onboarding status"}
                    </div>
                    <div className="metric-note">
                      {onboardingProgress?.accountStatus ??
                        "Server-authenticated user flow"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Terms Prototype</h5>
              <p className="text-secondary mb-3">
                Required terms flow endpoint slice: load active terms, then
                accept them while authenticated.
              </p>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => void onLoadActiveTerms()}
                  disabled={loading}
                >
                  Load active terms
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={() => void onAcceptTerms()}
                  disabled={loading || !activeTerms}
                >
                  Accept active terms
                </button>
              </div>

              <div className="alert alert-light border mb-0" role="status">
                <div className="fw-semibold mb-1">Terms status</div>
                <div>{termsMessage}</div>
                {activeTerms && (
                  <div className="mt-2 text-secondary small">
                    Version: {activeTerms.versionLabel} ({activeTerms.versionId}
                    ){` | Effective: ${activeTerms.effectiveFromUtc}`}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Onboarding Profile</h5>
              <p className="text-secondary mb-3">
                Required sequence step after terms: surname, DOB, flat number,
                and mobile number.
              </p>

              <div className="row g-3">
                <div className="col-12 col-lg-3">
                  <label htmlFor="surname-onboarding" className="form-label">
                    Surname
                  </label>
                  <input
                    id="surname-onboarding"
                    type="text"
                    className={`form-control ${getFieldErrors(profileFieldErrors, "surname").length > 0 ? "is-invalid" : ""}`}
                    placeholder="Smith"
                    value={surname}
                    onChange={(event) => onSurnameChange(event.target.value)}
                  />
                  {getFieldErrors(profileFieldErrors, "surname").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(profileFieldErrors, "surname").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="dob-onboarding" className="form-label">
                    Date of birth
                  </label>
                  <input
                    id="dob-onboarding"
                    type="date"
                    className={`form-control ${getFieldErrors(profileFieldErrors, "dateOfBirth").length > 0 ? "is-invalid" : ""}`}
                    value={dateOfBirth}
                    onChange={(event) =>
                      onDateOfBirthChange(event.target.value)
                    }
                  />
                  {getFieldErrors(profileFieldErrors, "dateOfBirth").length >
                    0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(profileFieldErrors, "dateOfBirth").join(
                        " ",
                      )}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="flatNumber-onboarding" className="form-label">
                    Flat number
                  </label>
                  <input
                    id="flatNumber-onboarding"
                    type="text"
                    className={`form-control ${getFieldErrors(profileFieldErrors, "flatNumber").length > 0 ? "is-invalid" : ""}`}
                    placeholder="A12"
                    value={flatNumber}
                    onChange={(event) => onFlatNumberChange(event.target.value)}
                  />
                  {getFieldErrors(profileFieldErrors, "flatNumber").length >
                    0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(profileFieldErrors, "flatNumber").join(
                        " ",
                      )}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label
                    htmlFor="mobileNumber-onboarding"
                    className="form-label"
                  >
                    Mobile / WhatsApp
                  </label>
                  <input
                    id="mobileNumber-onboarding"
                    type="text"
                    className={`form-control ${getFieldErrors(profileFieldErrors, "mobileNumber").length > 0 ? "is-invalid" : ""}`}
                    placeholder="07123456789"
                    value={mobileNumber}
                    onChange={(event) =>
                      onMobileNumberChange(event.target.value)
                    }
                  />
                  {getFieldErrors(profileFieldErrors, "mobileNumber").length >
                    0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(profileFieldErrors, "mobileNumber").join(
                        " ",
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => void onSubmitProfile()}
                  disabled={
                    loading ||
                    !surname ||
                    !dateOfBirth ||
                    !flatNumber ||
                    !mobileNumber
                  }
                >
                  Submit profile details
                </button>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">Profile status</div>
                <div>{profileMessage}</div>
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Onboarding Utility Setup</h5>
              <p className="text-secondary mb-3">
                Next vertical slice: move-in date, opening readings, initial
                tariffs, and boiler assumptions.
              </p>

              <div className="row g-3">
                <div className="col-12 col-lg-3">
                  <label htmlFor="moveInDate-onboarding" className="form-label">
                    Move-in date
                  </label>
                  <input
                    id="moveInDate-onboarding"
                    type="date"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "moveInDate").length > 0 ? "is-invalid" : ""}`}
                    value={moveInDate}
                    onChange={(event) => onMoveInDateChange(event.target.value)}
                  />
                  {getFieldErrors(utilityFieldErrors, "moveInDate").length >
                    0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(utilityFieldErrors, "moveInDate").join(
                        " ",
                      )}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="coldWater-onboarding" className="form-label">
                    Opening cold-water
                  </label>
                  <input
                    id="coldWater-onboarding"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "openingColdWaterReading").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.000"
                    value={openingColdWaterReading}
                    onChange={(event) =>
                      onOpeningColdWaterReadingChange(event.target.value)
                    }
                  />
                  {getFieldErrors(utilityFieldErrors, "openingColdWaterReading")
                    .length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        utilityFieldErrors,
                        "openingColdWaterReading",
                      ).join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="hotWater-onboarding" className="form-label">
                    Opening hot-water
                  </label>
                  <input
                    id="hotWater-onboarding"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "openingHotWaterReading").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.000"
                    value={openingHotWaterReading}
                    onChange={(event) =>
                      onOpeningHotWaterReadingChange(event.target.value)
                    }
                  />
                  {getFieldErrors(utilityFieldErrors, "openingHotWaterReading")
                    .length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        utilityFieldErrors,
                        "openingHotWaterReading",
                      ).join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label
                    htmlFor="electricity-onboarding"
                    className="form-label"
                  >
                    Opening electricity
                  </label>
                  <input
                    id="electricity-onboarding"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "openingElectricityReading").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.000"
                    value={openingElectricityReading}
                    onChange={(event) =>
                      onOpeningElectricityReadingChange(event.target.value)
                    }
                  />
                  {getFieldErrors(
                    utilityFieldErrors,
                    "openingElectricityReading",
                  ).length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        utilityFieldErrors,
                        "openingElectricityReading",
                      ).join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label
                    htmlFor="waterTariff-onboarding"
                    className="form-label"
                  >
                    Initial water tariff
                  </label>
                  <input
                    id="waterTariff-onboarding"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "initialWaterTariffPerUnit").length > 0 ? "is-invalid" : ""}`}
                    placeholder="1.234567"
                    value={initialWaterTariffPerUnit}
                    onChange={(event) =>
                      onInitialWaterTariffPerUnitChange(event.target.value)
                    }
                  />
                  {getFieldErrors(
                    utilityFieldErrors,
                    "initialWaterTariffPerUnit",
                  ).length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        utilityFieldErrors,
                        "initialWaterTariffPerUnit",
                      ).join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label
                    htmlFor="electricityTariff-onboarding"
                    className="form-label"
                  >
                    Initial electricity tariff
                  </label>
                  <input
                    id="electricityTariff-onboarding"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "initialElectricityTariffPerUnit").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.456789"
                    value={initialElectricityTariffPerUnit}
                    onChange={(event) =>
                      onInitialElectricityTariffPerUnitChange(
                        event.target.value,
                      )
                    }
                  />
                  {getFieldErrors(
                    utilityFieldErrors,
                    "initialElectricityTariffPerUnit",
                  ).length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        utilityFieldErrors,
                        "initialElectricityTariffPerUnit",
                      ).join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="boilerKwh-onboarding" className="form-label">
                    Boiler kWh/m3
                  </label>
                  <input
                    id="boilerKwh-onboarding"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "boilerKwhPerCubicMeter").length > 0 ? "is-invalid" : ""}`}
                    placeholder="10.500000"
                    value={boilerKwhPerCubicMeter}
                    onChange={(event) =>
                      onBoilerKwhPerCubicMeterChange(event.target.value)
                    }
                  />
                  {getFieldErrors(utilityFieldErrors, "boilerKwhPerCubicMeter")
                    .length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        utilityFieldErrors,
                        "boilerKwhPerCubicMeter",
                      ).join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label
                    htmlFor="boilerEfficiency-onboarding"
                    className="form-label"
                  >
                    Boiler efficiency (%)
                  </label>
                  <input
                    id="boilerEfficiency-onboarding"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "boilerEfficiencyPercent").length > 0 ? "is-invalid" : ""}`}
                    placeholder="85.00"
                    value={boilerEfficiencyPercent}
                    onChange={(event) =>
                      onBoilerEfficiencyPercentChange(event.target.value)
                    }
                  />
                  {getFieldErrors(utilityFieldErrors, "boilerEfficiencyPercent")
                    .length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(
                        utilityFieldErrors,
                        "boilerEfficiencyPercent",
                      ).join(" ")}
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => void onSubmitUtilitySetup()}
                  disabled={loading}
                >
                  Submit utility setup
                </button>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">Utility setup status</div>
                <div>{utilitySetupMessage}</div>
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Onboarding Progress</h5>
              <p className="text-secondary mb-3">
                Check current onboarding status and the next required action.
              </p>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void onLoadOnboardingProgress()}
                  disabled={loading}
                >
                  Check onboarding progress
                </button>
              </div>

              <div className="alert alert-light border mb-0" role="status">
                <div className="fw-semibold mb-1">Progress status</div>
                <div>{progressMessage}</div>
                {onboardingProgress && (
                  <div className="mt-2 text-secondary small">
                    Account: {onboardingProgress.accountStatus}
                    {` | Terms: ${onboardingProgress.termsAccepted ? "Done" : "Pending"}`}
                    {` | Profile: ${onboardingProgress.profileComplete ? "Done" : "Pending"}`}
                    {` | Utility: ${onboardingProgress.utilitySetupComplete ? "Done" : "Pending"}`}
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
