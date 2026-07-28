import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AdminDashboardView } from "./components/dashboard/AdminDashboardView";
import { OverviewDashboardView } from "./components/dashboard/OverviewDashboardView";
import { PaymentsDashboardView } from "./components/dashboard/PaymentsDashboardView";
import { ReadingsDashboardView } from "./components/dashboard/ReadingsDashboardView";
import { StatementsDashboardView } from "./components/dashboard/StatementsDashboardView";
import {
  formatCurrencyGbp,
  formatDateRange,
  formatDisplayDate,
  formatDisplayDateTime,
} from "./shared/formatters";
import { getFieldErrors, readProblemDetails } from "./shared/problemDetails";
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
  userRole?: string;
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

interface RecordLatestPeriodPaymentResponse {
  paymentId: string;
  userId: string;
  periodStartDate: string;
  periodEndDateExclusive: string;
  amount: string;
  paymentDate: string;
  method: string;
  reference?: string;
  notes?: string;
  source: string;
  verificationStatus: string;
  message: string;
}

interface LatestPeriodPaymentSummaryResponse {
  userId: string;
  periodStartDate: string;
  periodEndDateExclusive: string;
  periodTotal: string;
  hasPayment: boolean;
  paymentId?: string;
  paymentAmount?: string;
  paymentDate?: string;
  paymentMethod?: string;
  periodDifference: string;
  periodBalanceStatus: string;
}

interface PaymentHistoryItemResponse {
  paymentId: string;
  periodStartDate: string;
  periodEndDateExclusive: string;
  amount: string;
  paymentDate: string;
  method: string;
  reference?: string;
  notes?: string;
  source: string;
  verificationStatus: string;
}

interface PaymentHistoryResponse {
  userId: string;
  count: number;
  items: PaymentHistoryItemResponse[];
}

interface AllTimeBalanceResponse {
  userId: string;
  totalCalculatedCharges: string;
  totalRecordedPayments: string;
  balance: string;
  balanceStatus: string;
}

interface StatementSummaryResponse {
  userId: string;
  periodStartDate: string;
  periodEndDateExclusive: string;
  periodTotal: string;
  hasPayment: boolean;
  paymentId?: string;
  paymentAmount?: string;
  paymentDate?: string;
  paymentMethod?: string;
  periodDifference: string;
  periodBalanceStatus: string;
  totalCalculatedCharges: string;
  totalRecordedPayments: string;
  currentBalance: string;
  currentBalanceStatus: string;
  containsEstimatedSegments: boolean;
  engineVersion: string;
  inputHash: string;
  equationSummary: string;
}

interface StatementPeriodItemResponse {
  snapshotId: string;
  periodStartDate: string;
  periodEndDateExclusive: string;
  periodTotal: string;
  hasPayment: boolean;
  paymentAmount?: string;
  paymentDate?: string;
  periodDifference: string;
  periodBalanceStatus: string;
  containsEstimatedSegments: boolean;
}

interface StatementPeriodListResponse {
  userId: string;
  count: number;
  items: StatementPeriodItemResponse[];
}

interface StatementExportHistoryItemResponse {
  exportId: string;
  snapshotId: string;
  periodStartDate: string;
  periodEndDateExclusive: string;
  fileName: string;
  contentType: string;
  contentSha256: string;
  templateVersion: string;
  rendererVersion: string;
  createdAtUtc: string;
}

interface StatementExportHistoryResponse {
  userId: string;
  count: number;
  items: StatementExportHistoryItemResponse[];
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [session, setSession] = useState<SessionStatusResponse | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
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
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Direct Debit");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentMessage, setPaymentMessage] = useState(
    "No payment action submitted.",
  );
  const [latestPaymentSummary, setLatestPaymentSummary] =
    useState<LatestPeriodPaymentSummaryResponse | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<
    PaymentHistoryItemResponse[]
  >([]);
  const [balanceSummary, setBalanceSummary] =
    useState<AllTimeBalanceResponse | null>(null);
  const [statementMessage, setStatementMessage] = useState(
    "No statement action run yet.",
  );
  const [latestStatementSummary, setLatestStatementSummary] =
    useState<StatementSummaryResponse | null>(null);
  const [selectedStatementSummary, setSelectedStatementSummary] =
    useState<StatementSummaryResponse | null>(null);
  const [statementPeriods, setStatementPeriods] = useState<
    StatementPeriodItemResponse[]
  >([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [statementExportHistory, setStatementExportHistory] = useState<
    StatementExportHistoryItemResponse[]
  >([]);
  const [loading, setLoading] = useState(false);

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
      await refreshSession(true);
    } catch {
      setStatusMessage("Failed to verify OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/v1/auth/session", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        if (!silent) {
          setStatusMessage(
            `Failed to retrieve session status. ${error.message}`,
          );
        }
        setSession(null);
        setSessionChecked(true);
        return;
      }

      const body = (await response.json()) as SessionStatusResponse;
      setSession(body);
      if (!silent) {
        setStatusMessage(
          body.isAuthenticated ? "Session is active." : "No active session.",
        );
      }
      setSessionChecked(true);
    } catch {
      if (!silent) {
        setStatusMessage("Failed to retrieve session status.");
      }
      setSession(null);
      setSessionChecked(true);
    } finally {
      if (!silent) {
        setLoading(false);
      }
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
        setPendingApprovals([]);
        setAdminMessage(`Unable to load pending approvals. ${error.message}`);
        return;
      }

      const body = (await response.json()) as PendingApprovalListResponse;
      setPendingApprovals(body.items);
      setAdminMessage(`Loaded ${body.count} pending approval record(s).`);
    } catch {
      setPendingApprovals([]);
      setAdminMessage("Unable to load pending approvals.");
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

  const recordLatestPeriodPayment = async () => {
    if (!paymentAmount || !paymentDate || !paymentMethod) {
      setPaymentMessage(
        "Amount, payment date, and payment method are required.",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "/api/v1/billing/calculations/latest/payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            amount: paymentAmount,
            paymentDate,
            method: paymentMethod,
            reference: paymentReference || undefined,
            notes: paymentNotes || undefined,
          }),
        },
      );

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setPaymentMessage(`Payment save failed. ${error.message}`);
        return;
      }

      const body = (await response.json()) as RecordLatestPeriodPaymentResponse;
      setPaymentMessage(`${body.message} Payment ${body.paymentId} saved.`);
      await Promise.all([
        loadLatestPeriodPaymentSummary(true),
        loadPaymentHistory(true),
        loadAllTimeBalance(true),
      ]);
    } catch {
      setPaymentMessage("Payment save failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadLatestPeriodPaymentSummary = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch(
        "/api/v1/billing/calculations/latest/payment",
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setLatestPaymentSummary(null);
        if (!silent) {
          setPaymentMessage(
            `Unable to load latest payment summary. ${error.message}`,
          );
        }
        return;
      }

      const body =
        (await response.json()) as LatestPeriodPaymentSummaryResponse;
      setLatestPaymentSummary(body);
      if (!silent) {
        setPaymentMessage(
          `Loaded payment summary for ${body.periodStartDate} to ${body.periodEndDateExclusive}.`,
        );
      }
    } catch {
      setLatestPaymentSummary(null);
      if (!silent) {
        setPaymentMessage("Unable to load latest payment summary.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadPaymentHistory = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/v1/billing/payments/history", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setPaymentHistory([]);
        if (!silent) {
          setPaymentMessage(`Unable to load payment history. ${error.message}`);
        }
        return;
      }

      const body = (await response.json()) as PaymentHistoryResponse;
      setPaymentHistory(body.items);
      if (!silent) {
        setPaymentMessage(`Loaded ${body.count} payment history record(s).`);
      }
    } catch {
      setPaymentHistory([]);
      if (!silent) {
        setPaymentMessage("Unable to load payment history.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadAllTimeBalance = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/v1/billing/payments/balance", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setBalanceSummary(null);
        if (!silent) {
          setPaymentMessage(
            `Unable to load all-time balance. ${error.message}`,
          );
        }
        return;
      }

      const body = (await response.json()) as AllTimeBalanceResponse;
      setBalanceSummary(body);
      if (!silent) {
        setPaymentMessage(`Loaded all-time balance (${body.balanceStatus}).`);
      }
    } catch {
      setBalanceSummary(null);
      if (!silent) {
        setPaymentMessage("Unable to load all-time balance.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadLatestStatementSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/v1/billing/statements/latest-summary",
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setLatestStatementSummary(null);
        setStatementMessage(
          `Unable to load latest statement summary. ${error.message}`,
        );
        return;
      }

      const body = (await response.json()) as StatementSummaryResponse;
      setLatestStatementSummary(body);
      setStatementMessage(
        `Loaded latest statement summary for ${body.periodStartDate} to ${body.periodEndDateExclusive}.`,
      );
    } catch {
      setLatestStatementSummary(null);
      setStatementMessage("Unable to load latest statement summary.");
    } finally {
      setLoading(false);
    }
  };

  const loadStatementPeriods = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/billing/statements/periods", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setStatementPeriods([]);
        setStatementMessage(
          `Unable to load statement periods. ${error.message}`,
        );
        return;
      }

      const body = (await response.json()) as StatementPeriodListResponse;
      setStatementPeriods(body.items);
      if (!selectedSnapshotId && body.items.length > 0) {
        setSelectedSnapshotId(body.items[0].snapshotId);
      }
      setStatementMessage(`Loaded ${body.count} statement period option(s).`);
    } catch {
      setStatementPeriods([]);
      setStatementMessage("Unable to load statement periods.");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedStatementSummary = async (snapshotId?: string) => {
    const snapshot = snapshotId ?? selectedSnapshotId;

    if (!snapshot) {
      setStatementMessage(
        "Select a period snapshot before loading selected summary.",
      );
      return;
    }

    if (snapshot !== selectedSnapshotId) {
      setSelectedSnapshotId(snapshot);
    }

    setLoading(true);
    try {
      const query = new URLSearchParams({ snapshotId: snapshot });
      const response = await fetch(
        `/api/v1/billing/statements/summary?${query.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setSelectedStatementSummary(null);
        setStatementMessage(
          `Unable to load selected summary. ${error.message}`,
        );
        return;
      }

      const body = (await response.json()) as StatementSummaryResponse;
      setSelectedStatementSummary(body);
      setStatementMessage(
        `Loaded selected summary for ${body.periodStartDate} to ${body.periodEndDateExclusive}.`,
      );
    } catch {
      setSelectedStatementSummary(null);
      setStatementMessage("Unable to load selected summary.");
    } finally {
      setLoading(false);
    }
  };

  const exportSelectedStatementPdf = async (snapshotId?: string) => {
    const snapshot = snapshotId ?? selectedSnapshotId;

    if (!snapshot) {
      setStatementMessage("Select a period snapshot before exporting PDF.");
      return;
    }

    if (snapshot !== selectedSnapshotId) {
      setSelectedSnapshotId(snapshot);
    }

    setLoading(true);
    try {
      const query = new URLSearchParams({ snapshotId: snapshot });
      const response = await fetch(
        `/api/v1/billing/statements/export-pdf?${query.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setStatementMessage(`Statement PDF export failed. ${error.message}`);
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const exportId = response.headers.get("X-Statement-Export-Id") ?? "n/a";
      const suggestedName =
        response.headers
          .get("Content-Disposition")
          ?.split("filename=")
          .at(1)
          ?.replaceAll('"', "")
          ?.trim() || `statement-${snapshot}.pdf`;

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = suggestedName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setStatementMessage(`Statement PDF exported. Export ID: ${exportId}.`);
      await loadStatementExportHistory(true);
    } catch {
      setStatementMessage("Statement PDF export failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadStatementExportHistory = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await fetch("/api/v1/billing/statements/exports", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await readProblemDetails(response);
        setStatementExportHistory([]);
        if (!silent) {
          setStatementMessage(
            `Unable to load statement exports. ${error.message}`,
          );
        }
        return;
      }

      const body = (await response.json()) as StatementExportHistoryResponse;
      setStatementExportHistory(body.items);
      if (!silent) {
        setStatementMessage(`Loaded ${body.count} statement export record(s).`);
      }
    } catch {
      setStatementExportHistory([]);
      if (!silent) {
        setStatementMessage("Unable to load statement exports.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const getTargetRoute = (
    path: string,
    currentSession: SessionStatusResponse | null,
  ): string | null => {
    const isLoginPath = path === "/" || path === "/login";
    const isOnboardingPath = path === "/onboarding";
    const isDashboardPath = path.startsWith("/dashboard");
    const isAdminPath = path.startsWith("/dashboard/admin");

    const isAuthenticated = currentSession?.isAuthenticated === true;
    const status = currentSession?.userStatus?.trim().toLowerCase();
    const role = currentSession?.userRole?.trim().toLowerCase();
    const needsOnboarding = isAuthenticated && status !== "active";
    const isAdminUser = role === "admin" || role === "superadmin";

    if (!isAuthenticated) {
      return isLoginPath ? null : "/login";
    }

    if (needsOnboarding) {
      return isOnboardingPath ? null : "/onboarding";
    }

    if (isAdminPath && !isAdminUser) {
      return "/dashboard";
    }

    return isDashboardPath ? null : "/dashboard";
  };

  useEffect(() => {
    void refreshSession(true);
  }, []);

  useEffect(() => {
    if (!sessionChecked) {
      return;
    }

    const target = getTargetRoute(location.pathname, session);
    if (target && target !== location.pathname) {
      navigate(target, { replace: true });
    }
  }, [location.pathname, navigate, session, sessionChecked]);

  const pageMode =
    location.pathname === "/onboarding"
      ? "onboarding"
      : location.pathname.startsWith("/dashboard")
        ? "dashboard"
        : "login";

  const dashboardSection = location.pathname.startsWith("/dashboard/payments")
    ? "payments"
    : location.pathname.startsWith("/dashboard/statements")
      ? "statements"
      : location.pathname.startsWith("/dashboard/admin")
        ? "admin"
        : location.pathname.startsWith("/dashboard/readings")
          ? "readings"
          : "overview";

  const userRole = session?.userRole?.trim().toLowerCase() ?? "";
  const isAdminUser = userRole === "admin" || userRole === "superadmin";

  useEffect(() => {
    if (dashboardSection !== "statements") {
      return;
    }

    if (statementPeriods.length === 0) {
      void loadStatementPeriods();
    }

    if (statementExportHistory.length === 0) {
      void loadStatementExportHistory(true);
    }
  }, [
    dashboardSection,
    statementExportHistory.length,
    statementPeriods.length,
  ]);

  const shellLinkClass = (path: string) =>
    `shell-nav-link${pageMode === path ? " shell-nav-link--active" : ""}`;

  const renderShellHeader = () => (
    <header className="top-header">
      <nav className="navbar navbar-expand align-items-center justify-content-between px-3 shell-nav">
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-buildings fs-4 text-primary"></i>
          <div>
            <h5 className="mb-0 fw-bold">BaleAnchor Utility</h5>
            <small className="text-secondary">Resident Portal</small>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
          <Link className={shellLinkClass("login")} to="/login">
            Login
          </Link>
          <Link className={shellLinkClass("onboarding")} to="/onboarding">
            Onboarding
          </Link>
          <Link className={shellLinkClass("dashboard")} to="/dashboard">
            Dashboard
          </Link>
        </div>
      </nav>
    </header>
  );

  if (!sessionChecked) {
    return (
      <div className="wrapper">
        {renderShellHeader()}
        <main className="page-content p-4">
          <div className="container-fluid">
            <div className="card radius-10 border-0 shadow-sm">
              <div className="card-body py-5 text-center">
                <h5 className="mb-2">Checking your session</h5>
                <p className="text-secondary mb-0">
                  Validating secure sign-in state before loading your portal.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const renderLoginView = () => (
    <div className="wrapper">
      {renderShellHeader()}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <div className="row g-4 align-items-center">
                <div className="col-12 col-xl-7">
                  <span className="hero-eyebrow">Resident portal</span>
                  <h1 className="hero-title mb-3">
                    Sign in with your email OTP and continue into your utility
                    workspace.
                  </h1>
                  <p className="hero-copy mb-4">
                    BaleAnchor Utility is moving from prototype screens to a
                    resident-first experience with secure session handling,
                    statements, payments, and transparent calculations.
                  </p>

                  <div className="d-flex flex-wrap gap-2 mb-4">
                    <span className="feature-chip">Email OTP login</span>
                    <span className="feature-chip">Secure session cookie</span>
                    <span className="feature-chip">Resident-specific data</span>
                    <span className="feature-chip">Transparent statements</span>
                  </div>

                  <div className="hero-metrics row g-3">
                    <div className="col-12 col-md-4">
                      <div className="metric-card">
                        <div className="metric-label">Sign-in state</div>
                        <div className="metric-value">
                          {session?.isAuthenticated ? "Active" : "Awaiting OTP"}
                        </div>
                        <div className="metric-note">
                          {session?.emailMasked ?? "No session yet"}
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="metric-card">
                        <div className="metric-label">Current access</div>
                        <div className="metric-value">
                          {session?.userStatus ?? "Not loaded"}
                        </div>
                        <div className="metric-note">
                          Account state returned by the server
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="metric-card">
                        <div className="metric-label">Next step</div>
                        <div className="metric-value">OTP flow</div>
                        <div className="metric-note">
                          Request code, verify, then continue
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-xl-5">
                  <div className="auth-panel card border-0 shadow-sm h-100">
                    <div className="card-body p-4 p-xl-4">
                      <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                        <div>
                          <div className="auth-panel__eyebrow">Login</div>
                          <h2 className="auth-panel__title mb-1">
                            Resume your resident session
                          </h2>
                          <p className="auth-panel__copy mb-0">
                            Use the email OTP flow already wired to the server.
                          </p>
                        </div>
                        <div
                          className={`auth-status-pill ${session?.isAuthenticated ? "auth-status-pill--active" : ""}`}
                        >
                          {session?.isAuthenticated
                            ? "Signed in"
                            : "Not signed in"}
                        </div>
                      </div>

                      <div className="row g-3 align-items-end">
                        <div className="col-12 col-md-7">
                          <label htmlFor="email-login" className="form-label">
                            Email
                          </label>
                          <input
                            id="email-login"
                            type="email"
                            className="form-control form-control-lg"
                            placeholder="resident@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                          />
                        </div>
                        <div className="col-12 col-md-5">
                          <label htmlFor="code-login" className="form-label">
                            OTP code
                          </label>
                          <input
                            id="code-login"
                            type="text"
                            className="form-control form-control-lg"
                            placeholder="123456"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            maxLength={6}
                          />
                        </div>
                      </div>

                      <div className="d-flex flex-wrap gap-2 mt-3">
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
                          onClick={() => void refreshSession()}
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

                      <div
                        className="alert alert-light border mt-3 mb-0 auth-status-box"
                        role="status"
                      >
                        <div className="fw-semibold mb-1">Status</div>
                        <div>{statusMessage}</div>
                        {session && (
                          <div className="mt-2 text-secondary small">
                            Session:{" "}
                            {session.isAuthenticated ? "Active" : "Inactive"}
                            {session.emailMasked
                              ? ` | User: ${session.emailMasked}`
                              : ""}
                            {session.userStatus
                              ? ` | Account state: ${session.userStatus}`
                              : ""}
                            {session.expiresAtUtc
                              ? ` | Expires: ${formatDisplayDateTime(session.expiresAtUtc)}`
                              : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );

  const renderOnboardingView = () => (
    <div className="wrapper">
      {renderShellHeader()}
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
                    onChange={(event) => setSurname(event.target.value)}
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
                  <label htmlFor="flatNumber-onboarding" className="form-label">
                    Flat number
                  </label>
                  <input
                    id="flatNumber-onboarding"
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
                  <label htmlFor="moveInDate-onboarding" className="form-label">
                    Move-in date
                  </label>
                  <input
                    id="moveInDate-onboarding"
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
                      setInitialWaterTariffPerUnit(event.target.value)
                    }
                  />
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
                      setInitialElectricityTariffPerUnit(event.target.value)
                    }
                  />
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
                      setBoilerKwhPerCubicMeter(event.target.value)
                    }
                  />
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
                      setBoilerEfficiencyPercent(event.target.value)
                    }
                  />
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
        </div>
      </main>
    </div>
  );

  const renderDashboardRouteTabs = () => (
    <div className="d-flex flex-wrap gap-2 mb-4">
      <Link
        className={`shell-nav-link ${dashboardSection === "overview" ? "shell-nav-link--active" : ""}`}
        to="/dashboard"
      >
        Overview
      </Link>
      <Link
        className={`shell-nav-link ${dashboardSection === "readings" ? "shell-nav-link--active" : ""}`}
        to="/dashboard/readings"
      >
        Readings & Tariffs
      </Link>
      <Link
        className={`shell-nav-link ${dashboardSection === "payments" ? "shell-nav-link--active" : ""}`}
        to="/dashboard/payments"
      >
        Payments
      </Link>
      <Link
        className={`shell-nav-link ${dashboardSection === "statements" ? "shell-nav-link--active" : ""}`}
        to="/dashboard/statements"
      >
        Statements
      </Link>
      {isAdminUser && (
        <Link
          className={`shell-nav-link ${dashboardSection === "admin" ? "shell-nav-link--active" : ""}`}
          to="/dashboard/admin"
        >
          Admin
        </Link>
      )}
    </div>
  );

  const renderAdminView = () => (
    <AdminDashboardView
      shellHeader={renderShellHeader()}
      routeTabs={renderDashboardRouteTabs()}
      loading={loading}
      adminTargetUserId={adminTargetUserId}
      adminReason={adminReason}
      adminRoleTarget={adminRoleTarget}
      adminMessage={adminMessage}
      pendingApprovals={pendingApprovals}
      onAdminTargetUserIdChange={setAdminTargetUserId}
      onAdminReasonChange={setAdminReason}
      onAdminRoleTargetChange={setAdminRoleTarget}
      onLoadPendingApprovals={loadPendingApprovals}
      onSubmitAdminDecision={submitAdminDecision}
      onSubmitRoleChange={submitRoleChange}
      formatDisplayDateTime={formatDisplayDateTime}
    />
  );

  const renderReadingsView = () => (
    <ReadingsDashboardView
      shellHeader={renderShellHeader()}
      routeTabs={renderDashboardRouteTabs()}
      loading={loading}
      readingDate={readingDate}
      coldWaterReading={coldWaterReading}
      hotWaterReading={hotWaterReading}
      electricityReading={electricityReading}
      tariffEffectiveFromDate={tariffEffectiveFromDate}
      waterTariffPerUnit={waterTariffPerUnit}
      waterStandingChargePerDay={waterStandingChargePerDay}
      waterVatPercent={waterVatPercent}
      electricityTariffPerUnit={electricityTariffPerUnit}
      electricityStandingChargePerDay={electricityStandingChargePerDay}
      electricityVatPercent={electricityVatPercent}
      billingMessage={billingMessage}
      latestReadings={latestReadings}
      activeTariff={activeTariff}
      latestCalculation={latestCalculation}
      onReadingDateChange={setReadingDate}
      onColdWaterReadingChange={setColdWaterReading}
      onHotWaterReadingChange={setHotWaterReading}
      onElectricityReadingChange={setElectricityReading}
      onTariffEffectiveFromDateChange={setTariffEffectiveFromDate}
      onWaterTariffPerUnitChange={setWaterTariffPerUnit}
      onWaterStandingChargePerDayChange={setWaterStandingChargePerDay}
      onWaterVatPercentChange={setWaterVatPercent}
      onElectricityTariffPerUnitChange={setElectricityTariffPerUnit}
      onElectricityStandingChargePerDayChange={setElectricityStandingChargePerDay}
      onElectricityVatPercentChange={setElectricityVatPercent}
      onSubmitReadings={submitReadings}
      onLoadLatestReadings={loadLatestReadings}
      onSubmitTariffVersion={submitTariffVersion}
      onLoadActiveTariff={loadActiveTariff}
      onRunLatestCalculation={runLatestCalculation}
      onLoadLatestCalculation={loadLatestCalculation}
      formatDateRange={formatDateRange}
      formatCurrencyGbp={formatCurrencyGbp}
    />
  );

  const renderPaymentsView = () => (
    <PaymentsDashboardView
      shellHeader={renderShellHeader()}
      routeTabs={renderDashboardRouteTabs()}
      loading={loading}
      paymentAmount={paymentAmount}
      paymentDate={paymentDate}
      paymentMethod={paymentMethod}
      paymentReference={paymentReference}
      paymentNotes={paymentNotes}
      paymentMessage={paymentMessage}
      latestPaymentSummary={latestPaymentSummary}
      balanceSummary={balanceSummary}
      paymentHistory={paymentHistory}
      onPaymentAmountChange={setPaymentAmount}
      onPaymentDateChange={setPaymentDate}
      onPaymentMethodChange={setPaymentMethod}
      onPaymentReferenceChange={setPaymentReference}
      onPaymentNotesChange={setPaymentNotes}
      onRecordLatestPeriodPayment={recordLatestPeriodPayment}
      onLoadLatestPeriodPaymentSummary={() => loadLatestPeriodPaymentSummary()}
      onLoadPaymentHistory={() => loadPaymentHistory()}
      onLoadAllTimeBalance={() => loadAllTimeBalance()}
      formatDateRange={formatDateRange}
      formatDisplayDate={formatDisplayDate}
      formatCurrencyGbp={formatCurrencyGbp}
    />
  );

  const renderStatementsView = () => (
    <StatementsDashboardView
      shellHeader={renderShellHeader()}
      routeTabs={renderDashboardRouteTabs()}
      loading={loading}
      statementMessage={statementMessage}
      selectedSnapshotId={selectedSnapshotId}
      latestStatementSummary={latestStatementSummary}
      selectedStatementSummary={selectedStatementSummary}
      statementPeriods={statementPeriods}
      statementExportHistory={statementExportHistory}
      onLoadLatestStatementSummary={loadLatestStatementSummary}
      onLoadStatementPeriods={loadStatementPeriods}
      onLoadSelectedStatementSummary={loadSelectedStatementSummary}
      onExportSelectedStatementPdf={exportSelectedStatementPdf}
      onLoadStatementExportHistory={() => loadStatementExportHistory()}
      onSelectSnapshotId={setSelectedSnapshotId}
      formatDateRange={formatDateRange}
      formatCurrencyGbp={formatCurrencyGbp}
      formatDisplayDateTime={formatDisplayDateTime}
    />
  );

  if (pageMode === "login") {
    return renderLoginView();
  }

  if (pageMode === "onboarding") {
    return renderOnboardingView();
  }

  if (dashboardSection === "readings") {
    return renderReadingsView();
  }

  if (dashboardSection === "payments") {
    return renderPaymentsView();
  }

  if (dashboardSection === "statements") {
    return renderStatementsView();
  }

  if (dashboardSection === "admin") {
    return renderAdminView();
  }

  return (
    <OverviewDashboardView
      shellHeader={renderShellHeader()}
      routeTabs={renderDashboardRouteTabs()}
      session={session}
      statusMessage={statusMessage}
      formatDisplayDateTime={formatDisplayDateTime}
    />
  );
}

export default App;
