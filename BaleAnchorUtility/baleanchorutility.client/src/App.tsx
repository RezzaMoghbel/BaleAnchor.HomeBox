import { useState } from "react";
import "./App.css";

interface RequestCodeResponse {
  message: string;
  resendAfterSeconds: number;
  expiresInSeconds: number;
}

interface VerifyCodeResponse {
  authenticated: boolean;
  userStatus: string;
  message: string;
}

interface SessionStatusResponse {
  isAuthenticated: boolean;
  userId?: string;
  emailMasked?: string;
  userStatus?: string;
  expiresAtUtc?: string;
}

interface ActiveTermsResponse {
  versionId: string;
  versionLabel: string;
  title: string;
  contentMarkdown: string;
  effectiveFromUtc: string;
  publishedAtUtc: string;
}

interface AcceptTermsResponse {
  termsVersionId: string;
  acceptedAtUtc: string;
  message: string;
}

interface CompleteUtilitySetupResponse {
  userId: string;
  status: string;
  message: string;
}

interface CompleteProfileResponse {
  userId: string;
  status: string;
  message: string;
}

interface OnboardingProgressResponse {
  userId: string;
  accountStatus: string;
  termsAccepted: boolean;
  profileComplete: boolean;
  utilitySetupComplete: boolean;
  nextStep: string;
}

interface ApiProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

interface ParsedProblemDetails {
  message: string;
  errors: Record<string, string[]>;
}

function App() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [session, setSession] = useState<SessionStatusResponse | null>(null);
  const [activeTerms, setActiveTerms] = useState<ActiveTermsResponse | null>(
    null,
  );
  const [termsMessage, setTermsMessage] = useState("No terms loaded.");
  const [surname, setSurname] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [profileMessage, setProfileMessage] = useState(
    "No profile details submitted.",
  );
  const [onboardingProgress, setOnboardingProgress] =
    useState<OnboardingProgressResponse | null>(null);
  const [progressMessage, setProgressMessage] = useState(
    "Onboarding progress not checked.",
  );
  const [moveInDate, setMoveInDate] = useState("");
  const [openingColdWaterReading, setOpeningColdWaterReading] = useState("");
  const [openingHotWaterReading, setOpeningHotWaterReading] = useState("");
  const [openingElectricityReading, setOpeningElectricityReading] =
    useState("");
  const [initialWaterTariffPerUnit, setInitialWaterTariffPerUnit] =
    useState("");
  const [initialElectricityTariffPerUnit, setInitialElectricityTariffPerUnit] =
    useState("");
  const [boilerKwhPerCubicMeter, setBoilerKwhPerCubicMeter] = useState("");
  const [boilerEfficiencyPercent, setBoilerEfficiencyPercent] = useState("");
  const [utilitySetupMessage, setUtilitySetupMessage] = useState(
    "No utility setup submitted.",
  );
  const [profileFieldErrors, setProfileFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [utilityFieldErrors, setUtilityFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [loading, setLoading] = useState(false);

  const formatValidationErrors = (errors?: Record<string, string[]>) => {
    if (!errors) {
      return "";
    }

    const parts = Object.entries(errors)
      .flatMap(([field, messages]) =>
        messages.map((message) => `${field}: ${message}`),
      )
      .filter((x) => x.length > 0);

    return parts.length > 0 ? ` ${parts.join(" | ")}` : "";
  };

  const getFieldErrors = (
    errors: Record<string, string[]>,
    fieldName: string,
  ) => {
    const direct = errors[fieldName];
    if (direct && direct.length > 0) {
      return direct;
    }

    const wanted = fieldName.toLowerCase();
    const matchEntry = Object.entries(errors).find(([key]) => {
      const normalized = key.replace(/^\$\./, "").toLowerCase();
      return normalized === wanted;
    });

    return matchEntry?.[1] ?? [];
  };

  const readProblemDetails = async (
    response: Response,
  ): Promise<ParsedProblemDetails> => {
    try {
      const body = (await response.json()) as ApiProblemDetails;
      const detail = body.detail || body.title || "The request failed.";
      const errors = body.errors ?? {};
      return {
        message: `${detail}${formatValidationErrors(errors)}`,
        errors,
      };
    } catch {
      return {
        message: "The request failed.",
        errors: {},
      };
    }
  };

  const requestCode = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/request-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setStatusMessage(`Failed to request OTP code. ${error.message}`);
        return;
      }

      const body = (await response.json()) as RequestCodeResponse;
      setStatusMessage(
        `${body.message} Expires in ${body.expiresInSeconds}s. Resend after ${body.resendAfterSeconds}s.`,
      );
    } catch {
      setStatusMessage("Failed to request OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setStatusMessage(`Failed to verify OTP code. ${error.message}`);
        return;
      }

      const body = (await response.json()) as VerifyCodeResponse;
      setStatusMessage(
        `${body.message} Current user status: ${body.userStatus}.`,
      );
    } catch {
      setStatusMessage("Failed to verify OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/session", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setStatusMessage(`Failed to retrieve session status. ${error.message}`);
        return;
      }

      const body = (await response.json()) as SessionStatusResponse;
      setSession(body);
      setStatusMessage(
        body.isAuthenticated ? "Session is active." : "No active session.",
      );
    } catch {
      setStatusMessage("Failed to retrieve session status.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setStatusMessage(`Failed to sign out. ${error.message}`);
        return;
      }

      setSession(null);
      setStatusMessage("Signed out successfully.");
    } catch {
      setStatusMessage("Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  const loadActiveTerms = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/terms/active", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setTermsMessage(
          `No active terms are currently published. ${error.message}`,
        );
        setActiveTerms(null);
        return;
      }

      const body = (await response.json()) as ActiveTermsResponse;
      setActiveTerms(body);
      setTermsMessage(`Loaded ${body.versionLabel}.`);
    } catch {
      setTermsMessage("Failed to load active terms.");
    } finally {
      setLoading(false);
    }
  };

  const acceptTerms = async () => {
    if (!activeTerms) {
      setTermsMessage("Load active terms before accepting.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/terms/${encodeURIComponent(activeTerms.versionId)}/accept`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setTermsMessage(`Terms acceptance failed. ${error.message}`);
        return;
      }

      const body = (await response.json()) as AcceptTermsResponse;
      setTermsMessage(`${body.message} Accepted at ${body.acceptedAtUtc}.`);
    } catch {
      setTermsMessage("Failed to accept terms.");
    } finally {
      setLoading(false);
    }
  };

  const submitUtilitySetup = async () => {
    setUtilityFieldErrors({});
    setLoading(true);
    try {
      const response = await fetch("/api/v1/onboarding/utility-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          moveInDate,
          openingColdWaterReading,
          openingHotWaterReading,
          openingElectricityReading,
          initialWaterTariffPerUnit,
          initialElectricityTariffPerUnit,
          boilerKwhPerCubicMeter,
          boilerEfficiencyPercent,
        }),
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setUtilityFieldErrors(error.errors);
        setUtilitySetupMessage(`Utility setup failed. ${error.message}`);
        return;
      }

      const body = (await response.json()) as CompleteUtilitySetupResponse;
      setUtilityFieldErrors({});
      setUtilitySetupMessage(`${body.message} Status: ${body.status}.`);
      setStatusMessage(`Utility setup complete for user ${body.userId}.`);
      await refreshSession();
    } catch {
      setUtilitySetupMessage("Failed to submit utility setup.");
    } finally {
      setLoading(false);
    }
  };

  const submitProfile = async () => {
    setProfileFieldErrors({});
    setLoading(true);
    try {
      const response = await fetch("/api/v1/onboarding/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          surname,
          dateOfBirth,
          flatNumber,
          mobileNumber,
        }),
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setProfileFieldErrors(error.errors);
        setProfileMessage(`Profile submission failed. ${error.message}`);
        return;
      }

      const body = (await response.json()) as CompleteProfileResponse;
      setProfileFieldErrors({});
      setProfileMessage(`${body.message} Status: ${body.status}.`);
      setStatusMessage(`Profile details saved for user ${body.userId}.`);
      await refreshSession();
    } catch {
      setProfileMessage("Failed to submit profile details.");
    } finally {
      setLoading(false);
    }
  };

  const loadOnboardingProgress = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/onboarding/progress", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setOnboardingProgress(null);
        setProgressMessage(
          `Unable to load onboarding progress. ${error.message}`,
        );
        return;
      }

      const body = (await response.json()) as OnboardingProgressResponse;
      setOnboardingProgress(body);
      setProgressMessage(`Next required step: ${body.nextStep}.`);
    } catch {
      setOnboardingProgress(null);
      setProgressMessage("Failed to load onboarding progress.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <header className="top-header">
        <nav className="navbar navbar-expand align-items-center justify-content-between px-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-buildings fs-4 text-primary"></i>
            <div>
              <h5 className="mb-0 fw-bold">BaleAnchor Utility</h5>
              <small className="text-secondary">Resident Portal</small>
            </div>
          </div>
          <span className="badge bg-light text-dark border">
            Prototype Shell
          </span>
        </nav>
      </header>

      <main className="page-content p-4">
        <div className="container-fluid">
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-4">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-secondary">
                        Current Period Estimate
                      </p>
                      <h4 className="mb-0">£0.00</h4>
                    </div>
                    <div className="widget-icon bg-light-primary text-primary">
                      <i className="bi bi-cash-stack"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-secondary">Last Reading Date</p>
                      <h4 className="mb-0">Not submitted</h4>
                    </div>
                    <div className="widget-icon bg-light-success text-success">
                      <i className="bi bi-droplet-half"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-secondary">Balance</p>
                      <h4 className="mb-0">£0.00</h4>
                    </div>
                    <div className="widget-icon bg-light-danger text-danger">
                      <i className="bi bi-receipt"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Build Scope (from CLAUDE.md)</h5>
              <p className="text-secondary mb-3">
                This shell now uses the project template style and will be
                iteratively filled with the full resident onboarding, readings,
                tariffs, calculations, payments, statements, notifications, and
                admin flows specified in CLAUDE.md.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge rounded-pill bg-light text-dark border">
                  Email OTP onboarding
                </span>
                <span className="badge rounded-pill bg-light text-dark border">
                  Combined readings
                </span>
                <span className="badge rounded-pill bg-light text-dark border">
                  Independent tariffs
                </span>
                <span className="badge rounded-pill bg-light text-dark border">
                  Transparent equations
                </span>
                <span className="badge rounded-pill bg-light text-dark border">
                  PDF statements
                </span>
                <span className="badge rounded-pill bg-light text-dark border">
                  PWA reminders
                </span>
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Authentication Prototype (OTP)</h5>
              <p className="text-secondary mb-3">
                This slice validates the CLAUDE auth direction: request code,
                verify code, server-side session, and secure cookie flow.
              </p>

              <div className="row g-3 align-items-end">
                <div className="col-12 col-lg-4">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    placeholder="resident@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="code" className="form-label">
                    OTP code
                  </label>
                  <input
                    id="code"
                    type="text"
                    className="form-control"
                    placeholder="123456"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    maxLength={6}
                  />
                </div>
                <div className="col-12 col-lg-6">
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={requestCode}
                      disabled={loading || !email}
                    >
                      Request code
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={verifyCode}
                      disabled={loading || !email || code.length !== 6}
                    >
                      Verify code
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={refreshSession}
                      disabled={loading}
                    >
                      Check session
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={logout}
                      disabled={loading}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">Status</div>
                <div>{statusMessage}</div>
                {session && (
                  <div className="mt-2 text-secondary small">
                    Session: {session.isAuthenticated ? "Active" : "Inactive"}
                    {session.emailMasked
                      ? ` | User: ${session.emailMasked}`
                      : ""}
                    {session.userStatus
                      ? ` | Account state: ${session.userStatus}`
                      : ""}
                    {session.expiresAtUtc
                      ? ` | Expires: ${session.expiresAtUtc}`
                      : ""}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
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
                  onClick={loadActiveTerms}
                  disabled={loading}
                >
                  Load active terms
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={acceptTerms}
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
              <h5 className="mb-3">Onboarding Progress</h5>
              <p className="text-secondary mb-3">
                Check current onboarding status and the next required action.
              </p>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={loadOnboardingProgress}
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

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Onboarding Profile</h5>
              <p className="text-secondary mb-3">
                Required sequence step after terms: surname, DOB, flat number,
                and mobile number.
              </p>

              <div className="row g-3">
                <div className="col-12 col-lg-3">
                  <label htmlFor="surname" className="form-label">
                    Surname
                  </label>
                  <input
                    id="surname"
                    type="text"
                    className={`form-control ${getFieldErrors(profileFieldErrors, "surname").length > 0 ? "is-invalid" : ""}`}
                    placeholder="Smith"
                    value={surname}
                    onChange={(event) => setSurname(event.target.value)}
                  />
                  {getFieldErrors(profileFieldErrors, "surname").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(profileFieldErrors, "surname").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="dob" className="form-label">
                    Date of birth
                  </label>
                  <input
                    id="dob"
                    type="date"
                    className={`form-control ${getFieldErrors(profileFieldErrors, "dateOfBirth").length > 0 ? "is-invalid" : ""}`}
                    value={dateOfBirth}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                  />
                  {getFieldErrors(profileFieldErrors, "dateOfBirth").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(profileFieldErrors, "dateOfBirth").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="flatNumber" className="form-label">
                    Flat number
                  </label>
                  <input
                    id="flatNumber"
                    type="text"
                    className={`form-control ${getFieldErrors(profileFieldErrors, "flatNumber").length > 0 ? "is-invalid" : ""}`}
                    placeholder="A12"
                    value={flatNumber}
                    onChange={(event) => setFlatNumber(event.target.value)}
                  />
                  {getFieldErrors(profileFieldErrors, "flatNumber").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(profileFieldErrors, "flatNumber").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="mobileNumber" className="form-label">
                    Mobile / WhatsApp
                  </label>
                  <input
                    id="mobileNumber"
                    type="text"
                    className={`form-control ${getFieldErrors(profileFieldErrors, "mobileNumber").length > 0 ? "is-invalid" : ""}`}
                    placeholder="07123456789"
                    value={mobileNumber}
                    onChange={(event) => setMobileNumber(event.target.value)}
                  />
                  {getFieldErrors(profileFieldErrors, "mobileNumber").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(profileFieldErrors, "mobileNumber").join(" ")}
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={submitProfile}
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
                  <label htmlFor="moveInDate" className="form-label">
                    Move-in date
                  </label>
                  <input
                    id="moveInDate"
                    type="date"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "moveInDate").length > 0 ? "is-invalid" : ""}`}
                    value={moveInDate}
                    onChange={(event) => setMoveInDate(event.target.value)}
                  />
                  {getFieldErrors(utilityFieldErrors, "moveInDate").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(utilityFieldErrors, "moveInDate").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="coldWater" className="form-label">
                    Opening cold-water
                  </label>
                  <input
                    id="coldWater"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "openingColdWaterReading").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.000"
                    value={openingColdWaterReading}
                    onChange={(event) =>
                      setOpeningColdWaterReading(event.target.value)
                    }
                  />
                  {getFieldErrors(utilityFieldErrors, "openingColdWaterReading").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(utilityFieldErrors, "openingColdWaterReading").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="hotWater" className="form-label">
                    Opening hot-water
                  </label>
                  <input
                    id="hotWater"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "openingHotWaterReading").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.000"
                    value={openingHotWaterReading}
                    onChange={(event) =>
                      setOpeningHotWaterReading(event.target.value)
                    }
                  />
                  {getFieldErrors(utilityFieldErrors, "openingHotWaterReading").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(utilityFieldErrors, "openingHotWaterReading").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="electricity" className="form-label">
                    Opening electricity
                  </label>
                  <input
                    id="electricity"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "openingElectricityReading").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.000"
                    value={openingElectricityReading}
                    onChange={(event) =>
                      setOpeningElectricityReading(event.target.value)
                    }
                  />
                  {getFieldErrors(utilityFieldErrors, "openingElectricityReading").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(utilityFieldErrors, "openingElectricityReading").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="waterTariff" className="form-label">
                    Initial water tariff
                  </label>
                  <input
                    id="waterTariff"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "initialWaterTariffPerUnit").length > 0 ? "is-invalid" : ""}`}
                    placeholder="1.234567"
                    value={initialWaterTariffPerUnit}
                    onChange={(event) =>
                      setInitialWaterTariffPerUnit(event.target.value)
                    }
                  />
                  {getFieldErrors(utilityFieldErrors, "initialWaterTariffPerUnit").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(utilityFieldErrors, "initialWaterTariffPerUnit").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="electricityTariff" className="form-label">
                    Initial electricity tariff
                  </label>
                  <input
                    id="electricityTariff"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "initialElectricityTariffPerUnit").length > 0 ? "is-invalid" : ""}`}
                    placeholder="0.456789"
                    value={initialElectricityTariffPerUnit}
                    onChange={(event) =>
                      setInitialElectricityTariffPerUnit(event.target.value)
                    }
                  />
                  {getFieldErrors(utilityFieldErrors, "initialElectricityTariffPerUnit").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(utilityFieldErrors, "initialElectricityTariffPerUnit").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="boilerKwh" className="form-label">
                    Boiler kWh/m3
                  </label>
                  <input
                    id="boilerKwh"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "boilerKwhPerCubicMeter").length > 0 ? "is-invalid" : ""}`}
                    placeholder="10.500000"
                    value={boilerKwhPerCubicMeter}
                    onChange={(event) =>
                      setBoilerKwhPerCubicMeter(event.target.value)
                    }
                  />
                  {getFieldErrors(utilityFieldErrors, "boilerKwhPerCubicMeter").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(utilityFieldErrors, "boilerKwhPerCubicMeter").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="boilerEfficiency" className="form-label">
                    Boiler efficiency (%)
                  </label>
                  <input
                    id="boilerEfficiency"
                    type="text"
                    className={`form-control ${getFieldErrors(utilityFieldErrors, "boilerEfficiencyPercent").length > 0 ? "is-invalid" : ""}`}
                    placeholder="85.00"
                    value={boilerEfficiencyPercent}
                    onChange={(event) =>
                      setBoilerEfficiencyPercent(event.target.value)
                    }
                  />
                  {getFieldErrors(utilityFieldErrors, "boilerEfficiencyPercent").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(utilityFieldErrors, "boilerEfficiencyPercent").join(" ")}
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={submitUtilitySetup}
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
        </div>
      </main>
    </div>
  );
}

export default App;
