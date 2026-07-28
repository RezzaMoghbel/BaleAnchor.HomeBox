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

interface PendingApprovalUserItem {
  userId: string;
  emailMasked: string;
  submittedState: string;
  updatedAtUtc: string;
}

interface PendingApprovalListResponse {
  items: PendingApprovalUserItem[];
  count: number;
}

interface AdminDecisionResponse {
  userId: string;
  newStatus: string;
  message: string;
}

interface AdminRoleChangeResponse {
  userId: string;
  previousRole: string;
  newRole: string;
  message: string;
}

interface SubmitReadingsResponse {
  userId: string;
  readingDate: string;
  message: string;
}

interface LatestReadingsResponse {
  userId: string;
  readingDate: string;
  coldWaterReading: string;
  hotWaterReading: string;
  electricityReading: string;
}

interface UpsertTariffResponse {
  userId: string;
  effectiveFromDate: string;
  waterTariffPerUnit: string;
  waterStandingChargePerDay: string;
  waterVatPercent: string;
  electricityTariffPerUnit: string;
  electricityStandingChargePerDay: string;
  electricityVatPercent: string;
  message: string;
}

interface ActiveTariffResponse {
  userId: string;
  effectiveFromDate: string;
  waterTariffPerUnit: string;
  waterStandingChargePerDay: string;
  waterVatPercent: string;
  electricityTariffPerUnit: string;
  electricityStandingChargePerDay: string;
  electricityVatPercent: string;
}

interface CalculateLatestPeriodResponse {
  snapshotId: string;
  userId: string;
  periodStartDate: string;
  periodEndDateExclusive: string;
  daysInPeriod: number;
  coldWaterUsed: string;
  hotWaterUsed: string;
  apartmentElectricityUsed: string;
  boilerElectricityUsed: string;
  coldWaterTotal: string;
  hotWaterTotal: string;
  apartmentElectricityTotal: string;
  boilerElectricityTotal: string;
  waterTotal: string;
  electricityTotal: string;
  periodTotal: string;
  containsEstimatedSegments: boolean;
  engineVersion: string;
  inputHash: string;
  equationSummary: string;
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
  const [pendingApprovals, setPendingApprovals] = useState<
    PendingApprovalUserItem[]
  >([]);
  const [adminTargetUserId, setAdminTargetUserId] = useState("");
  const [adminReason, setAdminReason] = useState("");
  const [adminRoleTarget, setAdminRoleTarget] = useState("Admin");
  const [adminMessage, setAdminMessage] = useState(
    "Admin approvals not loaded.",
  );
  const [readingDate, setReadingDate] = useState("");
  const [coldWaterReading, setColdWaterReading] = useState("");
  const [hotWaterReading, setHotWaterReading] = useState("");
  const [electricityReading, setElectricityReading] = useState("");
  const [tariffEffectiveFromDate, setTariffEffectiveFromDate] = useState("");
  const [waterTariffPerUnit, setWaterTariffPerUnit] = useState("");
  const [waterStandingChargePerDay, setWaterStandingChargePerDay] =
    useState("");
  const [waterVatPercent, setWaterVatPercent] = useState("");
  const [electricityTariffPerUnit, setElectricityTariffPerUnit] = useState("");
  const [electricityStandingChargePerDay, setElectricityStandingChargePerDay] =
    useState("");
  const [electricityVatPercent, setElectricityVatPercent] = useState("");
  const [billingMessage, setBillingMessage] = useState(
    "Billing inputs have not been submitted.",
  );
  const [latestReadings, setLatestReadings] =
    useState<LatestReadingsResponse | null>(null);
  const [activeTariff, setActiveTariff] = useState<ActiveTariffResponse | null>(
    null,
  );
  const [latestCalculation, setLatestCalculation] =
    useState<CalculateLatestPeriodResponse | null>(null);
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

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/admin/approvals/pending", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setAdminMessage(`Unable to load pending approvals. ${error.message}`);
        setPendingApprovals([]);
        return;
      }

      const body = (await response.json()) as PendingApprovalListResponse;
      setPendingApprovals(body.items);
      setAdminMessage(`Loaded ${body.count} pending approval record(s).`);
    } catch {
      setAdminMessage("Failed to load pending approvals.");
      setPendingApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const submitAdminDecision = async (action: "approve" | "reject") => {
    if (!adminTargetUserId || !adminReason) {
      setAdminMessage("Target user ID and reason are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/admin/approvals/${encodeURIComponent(adminTargetUserId)}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ reason: adminReason }),
        },
      );

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setAdminMessage(
          `${action === "approve" ? "Approve" : "Reject"} failed. ${error.message}`,
        );
        return;
      }

      const body = (await response.json()) as AdminDecisionResponse;
      setAdminMessage(
        `${body.message} User ${body.userId} now in state ${body.newStatus}.`,
      );
      await loadPendingApprovals();
    } catch {
      setAdminMessage(
        `${action === "approve" ? "Approve" : "Reject"} action failed.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const submitRoleChange = async () => {
    if (!adminTargetUserId || !adminReason || !adminRoleTarget) {
      setAdminMessage("Target user ID, role, and reason are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/admin/roles/${encodeURIComponent(adminTargetUserId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ role: adminRoleTarget, reason: adminReason }),
        },
      );

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setAdminMessage(`Role update failed. ${error.message}`);
        return;
      }

      const body = (await response.json()) as AdminRoleChangeResponse;
      setAdminMessage(
        `${body.message} User ${body.userId}: ${body.previousRole} -> ${body.newRole}.`,
      );
      await loadPendingApprovals();
    } catch {
      setAdminMessage("Role update failed.");
    } finally {
      setLoading(false);
    }
  };

  const submitReadings = async () => {
    if (
      !readingDate ||
      !coldWaterReading ||
      !hotWaterReading ||
      !electricityReading
    ) {
      setBillingMessage("Reading date and all meter values are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/v1/billing/readings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          readingDate,
          coldWaterReading,
          hotWaterReading,
          electricityReading,
        }),
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setBillingMessage(`Reading submission failed. ${error.message}`);
        return;
      }

      const body = (await response.json()) as SubmitReadingsResponse;
      setBillingMessage(`${body.message} Date: ${body.readingDate}.`);
      await loadLatestReadings();
    } catch {
      setBillingMessage("Reading submission failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadLatestReadings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/billing/readings/latest", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setBillingMessage(`Unable to load latest readings. ${error.message}`);
        setLatestReadings(null);
        return;
      }

      const body = (await response.json()) as LatestReadingsResponse;
      setLatestReadings(body);
      setBillingMessage(`Loaded latest readings for ${body.readingDate}.`);
    } catch {
      setBillingMessage("Unable to load latest readings.");
      setLatestReadings(null);
    } finally {
      setLoading(false);
    }
  };

  const submitTariffVersion = async () => {
    if (
      !tariffEffectiveFromDate ||
      !waterTariffPerUnit ||
      !waterStandingChargePerDay ||
      !waterVatPercent ||
      !electricityTariffPerUnit ||
      !electricityStandingChargePerDay ||
      !electricityVatPercent
    ) {
      setBillingMessage(
        "Tariff effective date, unit rates, standing/day, and VAT values are required.",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/v1/billing/tariffs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          effectiveFromDate: tariffEffectiveFromDate,
          waterTariffPerUnit,
          waterStandingChargePerDay,
          waterVatPercent,
          electricityTariffPerUnit,
          electricityStandingChargePerDay,
          electricityVatPercent,
        }),
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setBillingMessage(`Tariff save failed. ${error.message}`);
        return;
      }

      const body = (await response.json()) as UpsertTariffResponse;
      setBillingMessage(
        `${body.message} Effective from ${body.effectiveFromDate}.`,
      );
      await loadActiveTariff();
    } catch {
      setBillingMessage("Tariff save failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadActiveTariff = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/billing/tariffs/active", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setBillingMessage(`Unable to load active tariff. ${error.message}`);
        setActiveTariff(null);
        return;
      }

      const body = (await response.json()) as ActiveTariffResponse;
      setActiveTariff(body);
      setBillingMessage(`Loaded active tariff from ${body.effectiveFromDate}.`);
    } catch {
      setBillingMessage("Unable to load active tariff.");
      setActiveTariff(null);
    } finally {
      setLoading(false);
    }
  };

  const runLatestCalculation = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/billing/calculations/latest", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setBillingMessage(`Calculation failed. ${error.message}`);
        return;
      }

      const body = (await response.json()) as CalculateLatestPeriodResponse;
      setLatestCalculation(body);
      setBillingMessage(`Calculation snapshot created: ${body.snapshotId}.`);
    } catch {
      setBillingMessage("Calculation failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadLatestCalculation = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/billing/calculations/latest", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setBillingMessage(
          `Unable to load calculation snapshot. ${error.message}`,
        );
        setLatestCalculation(null);
        return;
      }

      const body = (await response.json()) as CalculateLatestPeriodResponse;
      setLatestCalculation(body);
      setBillingMessage(`Loaded calculation snapshot ${body.snapshotId}.`);
    } catch {
      setBillingMessage("Unable to load calculation snapshot.");
      setLatestCalculation(null);
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
              <h5 className="mb-3">Admin Review Prototype</h5>
              <p className="text-secondary mb-3">
                Role-based pending approval review with reasoned approve/reject
                actions. For first-time setup, add your account email to
                BootstrapAdminEmails.
              </p>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={loadPendingApprovals}
                  disabled={loading}
                >
                  Load pending approvals
                </button>
              </div>

              <div className="row g-3 align-items-end">
                <div className="col-12 col-lg-4">
                  <label htmlFor="adminTargetUserId" className="form-label">
                    Target user ID
                  </label>
                  <input
                    id="adminTargetUserId"
                    type="text"
                    className="form-control"
                    placeholder="user id"
                    value={adminTargetUserId}
                    onChange={(event) =>
                      setAdminTargetUserId(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-5">
                  <label htmlFor="adminReason" className="form-label">
                    Decision reason
                  </label>
                  <input
                    id="adminReason"
                    type="text"
                    className="form-control"
                    placeholder="reason"
                    value={adminReason}
                    onChange={(event) => setAdminReason(event.target.value)}
                  />
                </div>
                <div className="col-12 col-lg-3">
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={() => submitAdminDecision("approve")}
                      disabled={loading}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => submitAdminDecision("reject")}
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>

              <div className="row g-3 align-items-end mt-1">
                <div className="col-12 col-lg-3">
                  <label htmlFor="adminRoleTarget" className="form-label">
                    New role
                  </label>
                  <select
                    id="adminRoleTarget"
                    className="form-select"
                    value={adminRoleTarget}
                    onChange={(event) => setAdminRoleTarget(event.target.value)}
                  >
                    <option value="Resident">Resident</option>
                    <option value="Admin">Admin</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>
                <div className="col-12 col-lg-3">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={submitRoleChange}
                    disabled={loading}
                  >
                    Update role
                  </button>
                </div>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">Admin status</div>
                <div>{adminMessage}</div>
                {pendingApprovals.length > 0 && (
                  <div className="mt-2 text-secondary small">
                    {pendingApprovals
                      .slice(0, 5)
                      .map(
                        (item) =>
                          `${item.userId} (${item.emailMasked}) - ${item.submittedState}`,
                      )
                      .join(" | ")}
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
              <h5 className="mb-3">Billing Inputs Prototype</h5>
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
                    onChange={(event) => setReadingDate(event.target.value)}
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
                      setColdWaterReading(event.target.value)
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
                    onChange={(event) => setHotWaterReading(event.target.value)}
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
                      setElectricityReading(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={submitReadings}
                  disabled={loading}
                >
                  Submit readings
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={loadLatestReadings}
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
                      setTariffEffectiveFromDate(event.target.value)
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
                      setWaterTariffPerUnit(event.target.value)
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
                      setWaterStandingChargePerDay(event.target.value)
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
                    onChange={(event) => setWaterVatPercent(event.target.value)}
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
                      setElectricityTariffPerUnit(event.target.value)
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
                      setElectricityStandingChargePerDay(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label
                    htmlFor="electricityVatPercent"
                    className="form-label"
                  >
                    Elec VAT %
                  </label>
                  <input
                    id="electricityVatPercent"
                    type="text"
                    className="form-control"
                    placeholder="5.00"
                    value={electricityVatPercent}
                    onChange={(event) =>
                      setElectricityVatPercent(event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={submitTariffVersion}
                  disabled={loading}
                >
                  Save tariff version
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={loadActiveTariff}
                  disabled={loading}
                >
                  Load active tariff
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={runLatestCalculation}
                  disabled={loading}
                >
                  Run latest calculation
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={loadLatestCalculation}
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
                    Calc {latestCalculation.periodStartDate} to{" "}
                    {latestCalculation.periodEndDateExclusive}
                    {` | Cold total: ${latestCalculation.coldWaterTotal}`}
                    {` | Hot total: ${latestCalculation.hotWaterTotal}`}
                    {` | Apartment total: ${latestCalculation.apartmentElectricityTotal}`}
                    {` | Boiler total: ${latestCalculation.boilerElectricityTotal}`}
                    {` | Water total: ${latestCalculation.waterTotal}`}
                    {` | Electricity total: ${latestCalculation.electricityTotal}`}
                    {` | Period total: ${latestCalculation.periodTotal}`}
                    {latestCalculation.containsEstimatedSegments
                      ? " | Estimated segments applied"
                      : ""}
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
