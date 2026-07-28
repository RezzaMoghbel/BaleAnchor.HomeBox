import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
                              ? ` | Expires: ${session.expiresAtUtc}`
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
    <div className="wrapper">
      {renderShellHeader()}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Admin workspace</h1>
              <p className="hero-copy mb-0">
                Role-bound area for approval, tenancy, and audit workflows.
                This route is visible only to Admin and SuperAdmin sessions.
              </p>
            </div>
          </section>

          {renderDashboardRouteTabs()}

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Next slice queued</h5>
              <p className="text-secondary mb-0">
                Admin operations will be migrated into this page in the next
                implementation step, separated from resident dashboard routes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const renderReadingsView = () => (
    <div className="wrapper">
      {renderShellHeader()}
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

          {renderDashboardRouteTabs()}

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
                    {` | Period total: ${latestCalculation.periodTotal}`}
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

  const renderPaymentsView = () => (
    <div className="wrapper">
      {renderShellHeader()}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Payments and balance tracking</h1>
              <p className="hero-copy mb-0">
                Record one payment for the latest period, review payment
                history, and track the all-time balance state.
              </p>
            </div>
          </section>

          {renderDashboardRouteTabs()}

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Record latest-period payment</h5>

              <div className="row g-3 align-items-end">
                <div className="col-12 col-lg-2">
                  <label htmlFor="paymentAmount" className="form-label">
                    Amount
                  </label>
                  <input
                    id="paymentAmount"
                    type="text"
                    className="form-control"
                    placeholder="120.50"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="paymentDate" className="form-label">
                    Payment date
                  </label>
                  <input
                    id="paymentDate"
                    type="date"
                    className="form-control"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                  />
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="paymentMethod" className="form-label">
                    Method
                  </label>
                  <input
                    id="paymentMethod"
                    type="text"
                    className="form-control"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="paymentReference" className="form-label">
                    Reference
                  </label>
                  <input
                    id="paymentReference"
                    type="text"
                    className="form-control"
                    placeholder="Optional"
                    value={paymentReference}
                    onChange={(event) =>
                      setPaymentReference(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="paymentNotes" className="form-label">
                    Notes
                  </label>
                  <input
                    id="paymentNotes"
                    type="text"
                    className="form-control"
                    placeholder="Optional"
                    value={paymentNotes}
                    onChange={(event) => setPaymentNotes(event.target.value)}
                  />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={recordLatestPeriodPayment}
                  disabled={loading}
                >
                  Save payment
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void loadLatestPeriodPaymentSummary()}
                  disabled={loading}
                >
                  Load latest summary
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void loadPaymentHistory()}
                  disabled={loading}
                >
                  Load payment history
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => void loadAllTimeBalance()}
                  disabled={loading}
                >
                  Load all-time balance
                </button>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">Payment status</div>
                <div>{paymentMessage}</div>
                {latestPaymentSummary && (
                  <div className="mt-2 text-secondary small">
                    Latest period: {latestPaymentSummary.periodStartDate} to{" "}
                    {latestPaymentSummary.periodEndDateExclusive}
                    {` | Total: ${latestPaymentSummary.periodTotal}`}
                    {` | Paid: ${latestPaymentSummary.paymentAmount ?? "0.00"}`}
                    {` | Difference: ${latestPaymentSummary.periodDifference}`}
                    {` | Status: ${latestPaymentSummary.periodBalanceStatus}`}
                  </div>
                )}
                {balanceSummary && (
                  <div className="mt-2 text-secondary small">
                    All-time charges: {balanceSummary.totalCalculatedCharges}
                    {` | Payments: ${balanceSummary.totalRecordedPayments}`}
                    {` | Balance: ${balanceSummary.balance}`}
                    {` | ${balanceSummary.balanceStatus}`}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Recent payment history</h5>
              {paymentHistory.length === 0 ? (
                <p className="text-secondary mb-0">
                  No payment history loaded yet.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Verification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.slice(0, 10).map((item) => (
                        <tr key={item.paymentId}>
                          <td>
                            {item.periodStartDate} to{" "}
                            {item.periodEndDateExclusive}
                          </td>
                          <td>{item.paymentDate}</td>
                          <td>{item.amount}</td>
                          <td>{item.method}</td>
                          <td>{item.verificationStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const renderStatementsView = () => (
    <div className="wrapper">
      {renderShellHeader()}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Statements and PDF exports</h1>
              <p className="hero-copy mb-0">
                Review latest and selected period statements, then export a
                traceable PDF with versioned renderer metadata.
              </p>
            </div>
          </section>

          {renderDashboardRouteTabs()}

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Statement actions</h5>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={loadLatestStatementSummary}
                  disabled={loading}
                >
                  Load latest summary
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={loadStatementPeriods}
                  disabled={loading}
                >
                  Load statement periods
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void loadSelectedStatementSummary()}
                  disabled={loading || !selectedSnapshotId}
                >
                  Load selected summary
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={() => void exportSelectedStatementPdf()}
                  disabled={loading || !selectedSnapshotId}
                >
                  Export selected PDF
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => void loadStatementExportHistory()}
                  disabled={loading}
                >
                  Load export history
                </button>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">Statement status</div>
                <div>{statementMessage}</div>
                {selectedSnapshotId && (
                  <div className="mt-2 text-secondary small">
                    Selected snapshot: {selectedSnapshotId}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="row g-4 mt-1">
            <div className="col-12 col-xl-6">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="mb-3">Latest statement summary</h5>
                  {latestStatementSummary ? (
                    <div className="text-secondary small">
                      <div>
                        Period: {latestStatementSummary.periodStartDate} to{" "}
                        {latestStatementSummary.periodEndDateExclusive}
                      </div>
                      <div>
                        Period total: {latestStatementSummary.periodTotal}
                      </div>
                      <div>
                        Payment:{" "}
                        {latestStatementSummary.paymentAmount ?? "0.00"}
                      </div>
                      <div>
                        Difference: {latestStatementSummary.periodDifference}
                      </div>
                      <div>
                        Status: {latestStatementSummary.periodBalanceStatus}
                      </div>
                      <div>
                        Current balance: {latestStatementSummary.currentBalance}
                      </div>
                      <div>
                        Balance status:{" "}
                        {latestStatementSummary.currentBalanceStatus}
                      </div>
                    </div>
                  ) : (
                    <p className="text-secondary mb-0">
                      No latest summary loaded yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-6">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="mb-3">Selected statement summary</h5>
                  {selectedStatementSummary ? (
                    <div className="text-secondary small">
                      <div>
                        Period: {selectedStatementSummary.periodStartDate} to{" "}
                        {selectedStatementSummary.periodEndDateExclusive}
                      </div>
                      <div>
                        Period total: {selectedStatementSummary.periodTotal}
                      </div>
                      <div>
                        Payment:{" "}
                        {selectedStatementSummary.paymentAmount ?? "0.00"}
                      </div>
                      <div>
                        Difference: {selectedStatementSummary.periodDifference}
                      </div>
                      <div>
                        Status: {selectedStatementSummary.periodBalanceStatus}
                      </div>
                      <div>
                        Estimated segments:{" "}
                        {selectedStatementSummary.containsEstimatedSegments
                          ? "Yes"
                          : "No"}
                      </div>
                    </div>
                  ) : (
                    <p className="text-secondary mb-0">
                      No selected summary loaded yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Statement periods</h5>
              {statementPeriods.length === 0 ? (
                <p className="text-secondary mb-0">
                  No statement periods loaded yet.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Total</th>
                        <th>Difference</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementPeriods.slice(0, 12).map((item) => (
                        <tr key={item.snapshotId}>
                          <td>
                            {item.periodStartDate} to{" "}
                            {item.periodEndDateExclusive}
                          </td>
                          <td>{item.periodTotal}</td>
                          <td>{item.periodDifference}</td>
                          <td>{item.periodBalanceStatus}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`btn btn-sm ${selectedSnapshotId === item.snapshotId ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() =>
                                  setSelectedSnapshotId(item.snapshotId)
                                }
                              >
                                {selectedSnapshotId === item.snapshotId
                                  ? "Selected"
                                  : "Select"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  void loadSelectedStatementSummary(
                                    item.snapshotId,
                                  )
                                }
                                disabled={loading}
                              >
                                Load
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() =>
                                  void exportSelectedStatementPdf(
                                    item.snapshotId,
                                  )
                                }
                                disabled={loading}
                              >
                                Export
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Export history</h5>
              {statementExportHistory.length === 0 ? (
                <p className="text-secondary mb-0">No exports loaded yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Export ID</th>
                        <th>Period</th>
                        <th>Template</th>
                        <th>Renderer</th>
                        <th>Created UTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementExportHistory.slice(0, 10).map((item) => (
                        <tr key={item.exportId}>
                          <td>{item.exportId}</td>
                          <td>
                            {item.periodStartDate} to{" "}
                            {item.periodEndDateExclusive}
                          </td>
                          <td>{item.templateVersion}</td>
                          <td>{item.rendererVersion}</td>
                          <td>{item.createdAtUtc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
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
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <div className="row g-4 align-items-center">
                <div className="col-12 col-xl-7">
                  <span className="hero-eyebrow">Resident portal</span>
                  <h1 className="hero-title mb-3">
                    Sign in with your email OTP and continue into your own
                    utility workspace.
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
                          <label htmlFor="email" className="form-label">
                            Email
                          </label>
                          <input
                            id="email"
                            type="email"
                            className="form-control form-control-lg"
                            placeholder="resident@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                          />
                        </div>
                        <div className="col-12 col-md-5">
                          <label htmlFor="code" className="form-label">
                            OTP code
                          </label>
                          <input
                            id="code"
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
                              ? ` | Expires: ${session.expiresAtUtc}`
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
