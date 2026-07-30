import { useEffect, useState, type ReactNode } from "react";
import type {
  ActiveTermsResponse,
  FieldErrors,
  OnboardingProgressResponse,
} from "../../shared/contracts";

type OnboardingSection = "terms" | "profile" | "utility" | "progress";

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
  initialWaterStandingChargePerDay: string;
  initialWaterVatPercent: string;
  initialElectricityTariffPerUnit: string;
  initialElectricityStandingChargePerDay: string;
  initialElectricityVatPercent: string;
  hotWaterTemperatureCelsius: string;
  hotWaterHeatCapacity: string;
  hotWaterDensity: string;
  kiloJouleToKiloWattHourFactor: string;
  profileFieldErrors: FieldErrors;
  utilityFieldErrors: FieldErrors;
  getFieldErrors: (errors: FieldErrors, fieldName: string) => string[];
  onLoadActiveTerms: () => Promise<void>;
  onAcceptTerms: () => Promise<void>;
  onSubmitProfile: () => Promise<void>;
  onSubmitUtilitySetup: () => Promise<void>;
  onLoadOnboardingState: () => Promise<void>;
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
  onInitialWaterStandingChargePerDayChange: (value: string) => void;
  onInitialWaterVatPercentChange: (value: string) => void;
  onInitialElectricityTariffPerUnitChange: (value: string) => void;
  onInitialElectricityStandingChargePerDayChange: (value: string) => void;
  onInitialElectricityVatPercentChange: (value: string) => void;
  onHotWaterTemperatureCelsiusChange: (value: string) => void;
  onHotWaterHeatCapacityChange: (value: string) => void;
  onHotWaterDensityChange: (value: string) => void;
  onKiloJouleToKiloWattHourFactorChange: (value: string) => void;
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
  initialWaterStandingChargePerDay,
  initialWaterVatPercent,
  initialElectricityTariffPerUnit,
  initialElectricityStandingChargePerDay,
  initialElectricityVatPercent,
  hotWaterTemperatureCelsius,
  hotWaterHeatCapacity,
  hotWaterDensity,
  kiloJouleToKiloWattHourFactor,
  profileFieldErrors,
  utilityFieldErrors,
  getFieldErrors,
  onLoadActiveTerms,
  onAcceptTerms,
  onSubmitProfile,
  onSubmitUtilitySetup,
  onLoadOnboardingState,
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
  onInitialWaterStandingChargePerDayChange,
  onInitialWaterVatPercentChange,
  onInitialElectricityTariffPerUnitChange,
  onInitialElectricityStandingChargePerDayChange,
  onInitialElectricityVatPercentChange,
  onHotWaterTemperatureCelsiusChange,
  onHotWaterHeatCapacityChange,
  onHotWaterDensityChange,
  onKiloJouleToKiloWattHourFactorChange,
}: OnboardingViewProps) {
  const [openSection, setOpenSection] = useState<OnboardingSection>("terms");

  useEffect(() => {
    void onLoadOnboardingState();
    void onLoadActiveTerms();
    void onLoadOnboardingProgress();
  }, []);

  useEffect(() => {
    const nextStep = onboardingProgress?.nextStep?.trim().toLowerCase();
    if (nextStep === "completesetup" || nextStep === "completeutilitysetup") {
      setOpenSection("utility");
      return;
    }

    if (nextStep === "completeprofile") {
      setOpenSection("profile");
      return;
    }

    if (nextStep === "awaitapproval") {
      setOpenSection("progress");
      return;
    }

    setOpenSection("terms");
  }, [onboardingProgress?.nextStep]);

  const accountStatus =
    onboardingProgress?.accountStatus?.trim().toLowerCase() ?? "";
  const termsAccepted = onboardingProgress?.termsAccepted ?? false;
  const profileComplete = onboardingProgress?.profileComplete ?? false;
  const utilitySetupComplete =
    onboardingProgress?.utilitySetupComplete ?? false;
  const allStepsComplete =
    termsAccepted && profileComplete && utilitySetupComplete;
  const isActiveAccount = accountStatus === "active";
  const showPendingReadOnlyNotice =
    allStepsComplete && accountStatus === "pendingapproval";
  const lockAfterCompletion = allStepsComplete && isActiveAccount;

  const profileUnlocked =
    termsAccepted && !profileComplete && !lockAfterCompletion;
  const utilityUnlocked =
    termsAccepted &&
    profileComplete &&
    !utilitySetupComplete &&
    !lockAfterCompletion;

  const canOpenProfile = termsAccepted;
  const canOpenUtility = termsAccepted && profileComplete;
  const canOpenProgress = allStepsComplete;

  const nextStepText = onboardingProgress?.nextStep
    ? onboardingProgress.nextStep
    : "Load onboarding progress";

  const sectionButtonClass = (section: OnboardingSection) =>
    `onboarding-accordion__button ${openSection === section ? "onboarding-accordion__button--open" : ""}`;

  const sectionBodyClass = (section: OnboardingSection) =>
    `onboarding-accordion__body ${openSection === section ? "d-block" : "d-none"}`;

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
                    Complete your onboarding in three guided steps.
                  </h1>
                  <p className="hero-copy mb-0">
                    This page captures your legal acceptance, resident profile,
                    and opening utility values used for accurate billing.
                  </p>
                </div>
                <div className="col-12 col-xl-4">
                  <div className="metric-card">
                    <div className="metric-label">Next step</div>
                    <div className="metric-value">{nextStepText}</div>
                    <div className="metric-note">
                      {onboardingProgress?.accountStatus ??
                        "Server-authenticated user flow"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {lockAfterCompletion && (
            <div className="alert alert-success border mb-4" role="status">
              <div className="fw-semibold mb-1">Onboarding complete</div>
              <div>
                Your onboarding submission is complete. Fields are now locked.
                You can view current progress below.
              </div>
            </div>
          )}

          {showPendingReadOnlyNotice && (
            <div className="alert alert-warning border mb-4" role="status">
              <div className="fw-semibold mb-1">Pending approval</div>
              <div>
                Your submission is with admin review. Completed onboarding
                fields are now read-only while approval is pending.
              </div>
            </div>
          )}

          <div className="card radius-10 border-0 shadow-sm onboarding-accordion">
            <div className="card-body p-0">
              <section className="onboarding-accordion__section">
                <button
                  type="button"
                  className={sectionButtonClass("terms")}
                  onClick={() => setOpenSection("terms")}
                >
                  <span>
                    1. Terms and acknowledgement
                    {termsAccepted && (
                      <span className="badge bg-success ms-2">Completed</span>
                    )}
                  </span>
                  <span>{openSection === "terms" ? "-" : "+"}</span>
                </button>

                <div className={sectionBodyClass("terms")}>
                  <p className="text-secondary mb-3">
                    Why this matters: your onboarding data is used to verify
                    your identity, map you to a flat, and calculate your utility
                    costs correctly from day one.
                  </p>
                  <p className="text-secondary mb-3">
                    Please review and acknowledge the active terms before
                    continuing to your tenant profile.
                  </p>

                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => void onLoadActiveTerms()}
                      disabled={loading}
                    >
                      Refresh terms
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={() => void onAcceptTerms()}
                      disabled={
                        loading ||
                        !activeTerms ||
                        termsAccepted ||
                        lockAfterCompletion
                      }
                    >
                      Accept terms and acknowledgement
                    </button>
                  </div>

                  <div className="alert alert-light border mb-0" role="status">
                    <div className="fw-semibold mb-1">Terms status</div>
                    <div>{termsMessage}</div>
                    {activeTerms && (
                      <div className="mt-2 text-secondary small">
                        Version: {activeTerms.versionLabel} (
                        {activeTerms.versionId})
                        {` | Effective: ${activeTerms.effectiveFromUtc}`}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="onboarding-accordion__section">
                <button
                  type="button"
                  className={sectionButtonClass("profile")}
                  onClick={() => {
                    if (canOpenProfile) {
                      setOpenSection("profile");
                    }
                  }}
                >
                  <span>
                    2. Tenant profile
                    {profileComplete && (
                      <span className="badge bg-success ms-2">Completed</span>
                    )}
                  </span>
                  <span>{openSection === "profile" ? "-" : "+"}</span>
                </button>

                <div className={sectionBodyClass("profile")}>
                  {!termsAccepted && (
                    <div className="alert alert-warning border" role="status">
                      Accept terms first to unlock tenant profile.
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12 col-lg-3">
                      <label
                        htmlFor="surname-onboarding"
                        className="form-label"
                      >
                        Surname
                      </label>
                      <input
                        id="surname-onboarding"
                        type="text"
                        className={`form-control ${getFieldErrors(profileFieldErrors, "surname").length > 0 ? "is-invalid" : ""}`}
                        placeholder="Smith"
                        value={surname}
                        onChange={(event) =>
                          onSurnameChange(event.target.value)
                        }
                        disabled={loading || !profileUnlocked}
                      />
                      {getFieldErrors(profileFieldErrors, "surname").length >
                        0 && (
                        <div className="invalid-feedback d-block">
                          {getFieldErrors(profileFieldErrors, "surname").join(
                            " ",
                          )}
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
                        disabled={loading || !profileUnlocked}
                      />
                      {getFieldErrors(profileFieldErrors, "dateOfBirth")
                        .length > 0 && (
                        <div className="invalid-feedback d-block">
                          {getFieldErrors(
                            profileFieldErrors,
                            "dateOfBirth",
                          ).join(" ")}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-lg-3">
                      <label
                        htmlFor="flatNumber-onboarding"
                        className="form-label"
                      >
                        Flat number
                      </label>
                      <input
                        id="flatNumber-onboarding"
                        type="text"
                        className={`form-control ${getFieldErrors(profileFieldErrors, "flatNumber").length > 0 ? "is-invalid" : ""}`}
                        placeholder="A12"
                        value={flatNumber}
                        onChange={(event) =>
                          onFlatNumberChange(event.target.value)
                        }
                        disabled={loading || !profileUnlocked}
                      />
                      {getFieldErrors(profileFieldErrors, "flatNumber").length >
                        0 && (
                        <div className="invalid-feedback d-block">
                          {getFieldErrors(
                            profileFieldErrors,
                            "flatNumber",
                          ).join(" ")}
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
                        disabled={loading || !profileUnlocked}
                      />
                      {getFieldErrors(profileFieldErrors, "mobileNumber")
                        .length > 0 && (
                        <div className="invalid-feedback d-block">
                          {getFieldErrors(
                            profileFieldErrors,
                            "mobileNumber",
                          ).join(" ")}
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
                        !profileUnlocked ||
                        !surname ||
                        !dateOfBirth ||
                        !flatNumber ||
                        !mobileNumber
                      }
                    >
                      Submit profile details
                    </button>
                  </div>

                  <div
                    className="alert alert-light border mt-3 mb-0"
                    role="status"
                  >
                    <div className="fw-semibold mb-1">Profile status</div>
                    <div>{profileMessage}</div>
                  </div>
                </div>
              </section>

              <section className="onboarding-accordion__section">
                <button
                  type="button"
                  className={sectionButtonClass("utility")}
                  onClick={() => {
                    if (canOpenUtility) {
                      setOpenSection("utility");
                    }
                  }}
                >
                  <span>
                    3. Initial utility setup
                    {utilitySetupComplete && (
                      <span className="badge bg-success ms-2">Completed</span>
                    )}
                  </span>
                  <span>{openSection === "utility" ? "-" : "+"}</span>
                </button>

                <div className={sectionBodyClass("utility")}>
                  {!profileComplete && (
                    <div className="alert alert-warning border" role="status">
                      Complete tenant profile first to unlock utility setup.
                    </div>
                  )}

                  <div className="mb-3">
                    <h6 className="mb-2">Initial utility setup</h6>
                    <div className="row g-3">
                      <div className="col-12 col-lg-3">
                        <label
                          htmlFor="moveInDate-onboarding"
                          className="form-label"
                        >
                          Move-in date
                        </label>
                        <input
                          id="moveInDate-onboarding"
                          type="date"
                          className={`form-control ${getFieldErrors(utilityFieldErrors, "moveInDate").length > 0 ? "is-invalid" : ""}`}
                          value={moveInDate}
                          onChange={(event) =>
                            onMoveInDateChange(event.target.value)
                          }
                          disabled={loading || !utilityUnlocked}
                        />
                        {getFieldErrors(utilityFieldErrors, "moveInDate")
                          .length > 0 && (
                          <div className="invalid-feedback d-block">
                            {getFieldErrors(
                              utilityFieldErrors,
                              "moveInDate",
                            ).join(" ")}
                          </div>
                        )}
                      </div>
                      <div className="col-12 col-lg-3">
                        <label
                          htmlFor="coldWater-onboarding"
                          className="form-label"
                        >
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
                          disabled={loading || !utilityUnlocked}
                        />
                        {getFieldErrors(
                          utilityFieldErrors,
                          "openingColdWaterReading",
                        ).length > 0 && (
                          <div className="invalid-feedback d-block">
                            {getFieldErrors(
                              utilityFieldErrors,
                              "openingColdWaterReading",
                            ).join(" ")}
                          </div>
                        )}
                      </div>
                      <div className="col-12 col-lg-3">
                        <label
                          htmlFor="hotWater-onboarding"
                          className="form-label"
                        >
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
                          disabled={loading || !utilityUnlocked}
                        />
                        {getFieldErrors(
                          utilityFieldErrors,
                          "openingHotWaterReading",
                        ).length > 0 && (
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
                            onOpeningElectricityReadingChange(
                              event.target.value,
                            )
                          }
                          disabled={loading || !utilityUnlocked}
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
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="mb-2">Rates</h6>
                    <p className="text-secondary small mb-3">
                      VAT values are percentages, for example enter 5 for 5%.
                    </p>
                    <div className="row g-3">
                      <div className="col-12 col-lg-4">
                        <label
                          htmlFor="waterTariff-onboarding"
                          className="form-label"
                        >
                          Water Unit Rate (/m3)
                        </label>
                        <input
                          id="waterTariff-onboarding"
                          type="text"
                          className={`form-control ${getFieldErrors(utilityFieldErrors, "initialWaterTariffPerUnit").length > 0 ? "is-invalid" : ""}`}
                          placeholder="1.234567"
                          value={initialWaterTariffPerUnit}
                          onChange={(event) =>
                            onInitialWaterTariffPerUnitChange(
                              event.target.value,
                            )
                          }
                          disabled={loading || !utilityUnlocked}
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
                      <div className="col-12 col-lg-4">
                        <label
                          htmlFor="waterStanding-onboarding"
                          className="form-label"
                        >
                          Water Standing (/day)
                        </label>
                        <input
                          id="waterStanding-onboarding"
                          type="text"
                          className={`form-control ${getFieldErrors(utilityFieldErrors, "initialWaterStandingChargePerDay").length > 0 ? "is-invalid" : ""}`}
                          placeholder="0.000000"
                          value={initialWaterStandingChargePerDay}
                          onChange={(event) =>
                            onInitialWaterStandingChargePerDayChange(
                              event.target.value,
                            )
                          }
                          disabled={loading || !utilityUnlocked}
                        />
                        {getFieldErrors(
                          utilityFieldErrors,
                          "initialWaterStandingChargePerDay",
                        ).length > 0 && (
                          <div className="invalid-feedback d-block">
                            {getFieldErrors(
                              utilityFieldErrors,
                              "initialWaterStandingChargePerDay",
                            ).join(" ")}
                          </div>
                        )}
                      </div>
                      <div className="col-12 col-lg-4">
                        <label
                          htmlFor="waterVat-onboarding"
                          className="form-label"
                        >
                          Water VAT (%)
                        </label>
                        <input
                          id="waterVat-onboarding"
                          type="text"
                          className={`form-control ${getFieldErrors(utilityFieldErrors, "initialWaterVatPercent").length > 0 ? "is-invalid" : ""}`}
                          placeholder="5"
                          value={initialWaterVatPercent}
                          onChange={(event) =>
                            onInitialWaterVatPercentChange(event.target.value)
                          }
                          disabled={loading || !utilityUnlocked}
                        />
                        {getFieldErrors(
                          utilityFieldErrors,
                          "initialWaterVatPercent",
                        ).length > 0 && (
                          <div className="invalid-feedback d-block">
                            {getFieldErrors(
                              utilityFieldErrors,
                              "initialWaterVatPercent",
                            ).join(" ")}
                          </div>
                        )}
                      </div>
                      <div className="col-12 col-lg-4">
                        <label
                          htmlFor="electricityTariff-onboarding"
                          className="form-label"
                        >
                          Electricity Unit Rate (/m3)
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
                          disabled={loading || !utilityUnlocked}
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
                      <div className="col-12 col-lg-4">
                        <label
                          htmlFor="electricityStanding-onboarding"
                          className="form-label"
                        >
                          Electricity Standing (/day)
                        </label>
                        <input
                          id="electricityStanding-onboarding"
                          type="text"
                          className={`form-control ${getFieldErrors(utilityFieldErrors, "initialElectricityStandingChargePerDay").length > 0 ? "is-invalid" : ""}`}
                          placeholder="0.000000"
                          value={initialElectricityStandingChargePerDay}
                          onChange={(event) =>
                            onInitialElectricityStandingChargePerDayChange(
                              event.target.value,
                            )
                          }
                          disabled={loading || !utilityUnlocked}
                        />
                        {getFieldErrors(
                          utilityFieldErrors,
                          "initialElectricityStandingChargePerDay",
                        ).length > 0 && (
                          <div className="invalid-feedback d-block">
                            {getFieldErrors(
                              utilityFieldErrors,
                              "initialElectricityStandingChargePerDay",
                            ).join(" ")}
                          </div>
                        )}
                      </div>
                      <div className="col-12 col-lg-4">
                        <label
                          htmlFor="electricityVat-onboarding"
                          className="form-label"
                        >
                          Electricity VAT (%)
                        </label>
                        <input
                          id="electricityVat-onboarding"
                          type="text"
                          className={`form-control ${getFieldErrors(utilityFieldErrors, "initialElectricityVatPercent").length > 0 ? "is-invalid" : ""}`}
                          placeholder="20"
                          value={initialElectricityVatPercent}
                          onChange={(event) =>
                            onInitialElectricityVatPercentChange(
                              event.target.value,
                            )
                          }
                          disabled={loading || !utilityUnlocked}
                        />
                        {getFieldErrors(
                          utilityFieldErrors,
                          "initialElectricityVatPercent",
                        ).length > 0 && (
                          <div className="invalid-feedback d-block">
                            {getFieldErrors(
                              utilityFieldErrors,
                              "initialElectricityVatPercent",
                            ).join(" ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-0">
                    <h6 className="mb-2">Hot water equation</h6>
                    <div className="row g-3">
                      <div className="col-12 col-lg-3">
                        <label
                          htmlFor="hotWaterTemperature-onboarding"
                          className="form-label"
                        >
                          Temperature
                        </label>
                        <input
                          id="hotWaterTemperature-onboarding"
                          type="text"
                          className={`form-control ${getFieldErrors(utilityFieldErrors, "hotWaterTemperatureCelsius").length > 0 ? "is-invalid" : ""}`}
                          placeholder="55"
                          value={hotWaterTemperatureCelsius}
                          onChange={(event) =>
                            onHotWaterTemperatureCelsiusChange(
                              event.target.value,
                            )
                          }
                          disabled={loading || !utilityUnlocked}
                        />
                        {getFieldErrors(
                          utilityFieldErrors,
                          "hotWaterTemperatureCelsius",
                        ).length > 0 && (
                          <div className="invalid-feedback d-block">
                            {getFieldErrors(
                              utilityFieldErrors,
                              "hotWaterTemperatureCelsius",
                            ).join(" ")}
                          </div>
                        )}
                      </div>
                      <div className="col-12 col-lg-3">
                        <label
                          htmlFor="hotWaterHeatCapacity-onboarding"
                          className="form-label"
                        >
                          Heat capacity
                        </label>
                        <input
                          id="hotWaterHeatCapacity-onboarding"
                          type="text"
                          className={`form-control ${getFieldErrors(utilityFieldErrors, "hotWaterHeatCapacity").length > 0 ? "is-invalid" : ""}`}
                          placeholder="4.186"
                          value={hotWaterHeatCapacity}
                          onChange={(event) =>
                            onHotWaterHeatCapacityChange(event.target.value)
                          }
                          disabled={loading || !utilityUnlocked}
                        />
                        {getFieldErrors(
                          utilityFieldErrors,
                          "hotWaterHeatCapacity",
                        ).length > 0 && (
                          <div className="invalid-feedback d-block">
                            {getFieldErrors(
                              utilityFieldErrors,
                              "hotWaterHeatCapacity",
                            ).join(" ")}
                          </div>
                        )}
                      </div>
                      <div className="col-12 col-lg-3">
                        <label
                          htmlFor="hotWaterDensity-onboarding"
                          className="form-label"
                        >
                          Density
                        </label>
                        <input
                          id="hotWaterDensity-onboarding"
                          type="text"
                          className={`form-control ${getFieldErrors(utilityFieldErrors, "hotWaterDensity").length > 0 ? "is-invalid" : ""}`}
                          placeholder="1000"
                          value={hotWaterDensity}
                          onChange={(event) =>
                            onHotWaterDensityChange(event.target.value)
                          }
                          disabled={loading || !utilityUnlocked}
                        />
                        {getFieldErrors(utilityFieldErrors, "hotWaterDensity")
                          .length > 0 && (
                          <div className="invalid-feedback d-block">
                            {getFieldErrors(
                              utilityFieldErrors,
                              "hotWaterDensity",
                            ).join(" ")}
                          </div>
                        )}
                      </div>
                      <div className="col-12 col-lg-3">
                        <label
                          htmlFor="kjToKwh-onboarding"
                          className="form-label"
                        >
                          Conversion factor (kJ to kWh)
                        </label>
                        <input
                          id="kjToKwh-onboarding"
                          type="text"
                          className={`form-control ${getFieldErrors(utilityFieldErrors, "kiloJouleToKiloWattHourFactor").length > 0 ? "is-invalid" : ""}`}
                          placeholder="3600"
                          value={kiloJouleToKiloWattHourFactor}
                          onChange={(event) =>
                            onKiloJouleToKiloWattHourFactorChange(
                              event.target.value,
                            )
                          }
                          disabled={loading || !utilityUnlocked}
                        />
                        {getFieldErrors(
                          utilityFieldErrors,
                          "kiloJouleToKiloWattHourFactor",
                        ).length > 0 && (
                          <div className="invalid-feedback d-block">
                            {getFieldErrors(
                              utilityFieldErrors,
                              "kiloJouleToKiloWattHourFactor",
                            ).join(" ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => void onSubmitUtilitySetup()}
                      disabled={loading || !utilityUnlocked}
                    >
                      Submit utility setup
                    </button>
                  </div>

                  <div
                    className="alert alert-light border mt-3 mb-0"
                    role="status"
                  >
                    <div className="fw-semibold mb-1">Utility setup status</div>
                    <div>{utilitySetupMessage}</div>
                  </div>
                </div>
              </section>

              <section className="onboarding-accordion__section">
                <button
                  type="button"
                  className={sectionButtonClass("progress")}
                  onClick={() => {
                    if (canOpenProgress || openSection === "progress") {
                      setOpenSection("progress");
                    }
                  }}
                >
                  <span>Progress status</span>
                  <span>{openSection === "progress" ? "-" : "+"}</span>
                </button>

                <div className={sectionBodyClass("progress")}>
                  {!allStepsComplete && (
                    <div className="alert alert-info border" role="status">
                      Progress summary becomes final once terms, profile, and
                      utility setup are complete.
                    </div>
                  )}

                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => void onLoadOnboardingProgress()}
                      disabled={loading}
                    >
                      Refresh onboarding progress
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
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
