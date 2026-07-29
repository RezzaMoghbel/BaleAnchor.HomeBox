import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AdminDashboardView } from "./components/dashboard/AdminDashboardView";
import { OverviewDashboardView } from "./components/dashboard/OverviewDashboardView";
import { PaymentsDashboardView } from "./components/dashboard/PaymentsDashboardView";
import { ReadingsDashboardView } from "./components/dashboard/ReadingsDashboardView";
import { StatementsDashboardView } from "./components/dashboard/StatementsDashboardView";
import { LoginView } from "./components/auth/LoginView";
import { OnboardingView } from "./components/onboarding/OnboardingView";
import { portalClient, PortalApiError } from "./api/portalClient";
import type {
  ActiveTariffResponse,
  ActiveTermsResponse,
  AllTimeBalanceResponse,
  CalculateLatestPeriodResponse,
  LatestPeriodPaymentSummaryResponse,
  LatestReadingsResponse,
  OnboardingProgressResponse,
  PaymentHistoryItemResponse,
  PendingApprovalUserItem,
  SessionStatusResponse,
  StatementExportHistoryItemResponse,
  StatementPeriodItemResponse,
  StatementSummaryResponse,
  FieldErrors,
} from "./shared/contracts";
import {
  formatCurrencyGbp,
  formatDateRange,
  formatDisplayDate,
  formatDisplayDateTime,
} from "./shared/formatters";
import { getFieldErrors } from "./shared/problemDetails";
import "./App.css";
function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionStatusResponse | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "No authentication action run yet.",
  );

  const [activeTerms, setActiveTerms] = useState<ActiveTermsResponse | null>(
    null,
  );
  const [termsMessage, setTermsMessage] = useState("Active terms not loaded.");

  const [surname, setSurname] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [profileMessage, setProfileMessage] = useState(
    "Profile details not submitted.",
  );
  const [profileFieldErrors, setProfileFieldErrors] = useState<FieldErrors>({});

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
    "Utility setup not submitted.",
  );
  const [utilityFieldErrors, setUtilityFieldErrors] = useState<FieldErrors>({});

  const [onboardingProgress, setOnboardingProgress] =
    useState<OnboardingProgressResponse | null>(null);
  const [progressMessage, setProgressMessage] = useState(
    "Onboarding progress not loaded.",
  );

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
      const body = await portalClient.requestCode({ email });
      setStatusMessage(
        `${body.message} Expires in ${body.expiresInSeconds}s. Resend after ${body.resendAfterSeconds}s.`,
      );
    } catch (error) {
      if (error instanceof PortalApiError) {
        setStatusMessage(`Failed to request OTP code. ${error.message}`);
      } else {
        setStatusMessage("Failed to request OTP code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    try {
      const body = await portalClient.verifyCode({ email, code });
      setStatusMessage(
        `${body.message} Current user status: ${body.userStatus}.`,
      );
      await refreshSession(true);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setStatusMessage(`Failed to verify OTP code. ${error.message}`);
      } else {
        setStatusMessage("Failed to verify OTP code.");
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getSession();
      setSession(body);
      if (!silent) {
        setStatusMessage(
          body.isAuthenticated ? "Session is active." : "No active session.",
        );
      }
      setSessionChecked(true);
    } catch (error) {
      if (!silent) {
        if (error instanceof PortalApiError) {
          setStatusMessage(
            `Failed to retrieve session status. ${error.message}`,
          );
        } else {
          setStatusMessage("Failed to retrieve session status.");
        }
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
      await portalClient.logout();
      setSession(null);
      setStatusMessage("Signed out successfully.");
    } catch (error) {
      if (error instanceof PortalApiError) {
        setStatusMessage(`Failed to sign out. ${error.message}`);
      } else {
        setStatusMessage("Failed to sign out.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadActiveTerms = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getActiveTerms();
      setActiveTerms(body);
      setTermsMessage(`Loaded ${body.versionLabel}.`);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setTermsMessage(
          `No active terms are currently published. ${error.message}`,
        );
      } else {
        setTermsMessage("Failed to load active terms.");
      }
      setActiveTerms(null);
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
      const body = await portalClient.acceptTerms(activeTerms.versionId);
      setTermsMessage(`${body.message} Accepted at ${body.acceptedAtUtc}.`);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setTermsMessage(`Terms acceptance failed. ${error.message}`);
      } else {
        setTermsMessage("Failed to accept terms.");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitUtilitySetup = async () => {
    setUtilityFieldErrors({});
    setLoading(true);
    try {
      const body = await portalClient.submitUtilitySetup({
        moveInDate,
        openingColdWaterReading,
        openingHotWaterReading,
        openingElectricityReading,
        initialWaterTariffPerUnit,
        initialElectricityTariffPerUnit,
        boilerKwhPerCubicMeter,
        boilerEfficiencyPercent,
      });
      setUtilityFieldErrors({});
      setUtilitySetupMessage(`${body.message} Status: ${body.status}.`);
      setStatusMessage(`Utility setup complete for user ${body.userId}.`);
      await refreshSession();
    } catch (error) {
      if (error instanceof PortalApiError) {
        setUtilityFieldErrors(error.errors);
        setUtilitySetupMessage(`Utility setup failed. ${error.message}`);
      } else {
        setUtilitySetupMessage("Failed to submit utility setup.");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitProfile = async () => {
    setProfileFieldErrors({});
    setLoading(true);
    try {
      const body = await portalClient.submitProfile({
        surname,
        dateOfBirth,
        flatNumber,
        mobileNumber,
      });
      setProfileFieldErrors({});
      setProfileMessage(`${body.message} Status: ${body.status}.`);
      setStatusMessage(`Profile details saved for user ${body.userId}.`);
      await refreshSession();
    } catch (error) {
      if (error instanceof PortalApiError) {
        setProfileFieldErrors(error.errors);
        setProfileMessage(`Profile submission failed. ${error.message}`);
      } else {
        setProfileMessage("Failed to submit profile details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOnboardingProgress = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getOnboardingProgress();
      setOnboardingProgress(body);
      setProgressMessage(`Next required step: ${body.nextStep}.`);
    } catch (error) {
      setOnboardingProgress(null);
      if (error instanceof PortalApiError) {
        setProgressMessage(
          `Unable to load onboarding progress. ${error.message}`,
        );
      } else {
        setProgressMessage("Failed to load onboarding progress.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getPendingApprovals();
      setPendingApprovals(body.items);
      setAdminMessage(`Loaded ${body.count} pending approval record(s).`);
    } catch (error) {
      setPendingApprovals([]);
      if (error instanceof PortalApiError) {
        setAdminMessage(`Unable to load pending approvals. ${error.message}`);
      } else {
        setAdminMessage("Unable to load pending approvals.");
      }
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
      const body = await portalClient.submitAdminDecision(
        adminTargetUserId,
        action,
        { reason: adminReason },
      );
      setAdminMessage(
        `${body.message} User ${body.userId} now in state ${body.newStatus}.`,
      );
      await loadPendingApprovals();
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(
          `${action === "approve" ? "Approve" : "Reject"} failed. ${error.message}`,
        );
      } else {
        setAdminMessage(
          `${action === "approve" ? "Approve" : "Reject"} action failed.`,
        );
      }
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
      const body = await portalClient.submitRoleChange(adminTargetUserId, {
        role: adminRoleTarget,
        reason: adminReason,
      });
      setAdminMessage(
        `${body.message} User ${body.userId}: ${body.previousRole} -> ${body.newRole}.`,
      );
      await loadPendingApprovals();
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Role update failed. ${error.message}`);
      } else {
        setAdminMessage("Role update failed.");
      }
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
      const body = await portalClient.submitReadings({
        readingDate,
        coldWaterReading,
        hotWaterReading,
        electricityReading,
      });
      setBillingMessage(`${body.message} Date: ${body.readingDate}.`);
      await loadLatestReadings();
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(`Reading submission failed. ${error.message}`);
      } else {
        setBillingMessage("Reading submission failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLatestReadings = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getLatestReadings();
      setLatestReadings(body);
      setBillingMessage(`Loaded latest readings for ${body.readingDate}.`);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(`Unable to load latest readings. ${error.message}`);
      } else {
        setBillingMessage("Unable to load latest readings.");
      }
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
      const body = await portalClient.submitTariffVersion({
        effectiveFromDate: tariffEffectiveFromDate,
        waterTariffPerUnit,
        waterStandingChargePerDay,
        waterVatPercent,
        electricityTariffPerUnit,
        electricityStandingChargePerDay,
        electricityVatPercent,
      });
      setBillingMessage(
        `${body.message} Effective from ${body.effectiveFromDate}.`,
      );
      await loadActiveTariff();
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(`Tariff save failed. ${error.message}`);
      } else {
        setBillingMessage("Tariff save failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadActiveTariff = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getActiveTariff();
      setActiveTariff(body);
      setBillingMessage(`Loaded active tariff from ${body.effectiveFromDate}.`);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(`Unable to load active tariff. ${error.message}`);
      } else {
        setBillingMessage("Unable to load active tariff.");
      }
      setActiveTariff(null);
    } finally {
      setLoading(false);
    }
  };

  const runLatestCalculation = async () => {
    setLoading(true);
    try {
      const body = await portalClient.runLatestCalculation();
      setLatestCalculation(body);
      setBillingMessage(`Calculation snapshot created: ${body.snapshotId}.`);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(`Calculation failed. ${error.message}`);
      } else {
        setBillingMessage("Calculation failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLatestCalculation = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getLatestCalculation();
      setLatestCalculation(body);
      setBillingMessage(`Loaded calculation snapshot ${body.snapshotId}.`);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(
          `Unable to load calculation snapshot. ${error.message}`,
        );
      } else {
        setBillingMessage("Unable to load calculation snapshot.");
      }
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
      const body = await portalClient.recordLatestPeriodPayment({
        amount: paymentAmount,
        paymentDate,
        method: paymentMethod,
        reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
      });
      setPaymentMessage(`${body.message} Payment ${body.paymentId} saved.`);
      await Promise.all([
        loadLatestPeriodPaymentSummary(true),
        loadPaymentHistory(true),
        loadAllTimeBalance(true),
      ]);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setPaymentMessage(`Payment save failed. ${error.message}`);
      } else {
        setPaymentMessage("Payment save failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLatestPeriodPaymentSummary = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getLatestPeriodPaymentSummary();
      setLatestPaymentSummary(body);
      if (!silent) {
        setPaymentMessage(
          `Loaded payment summary for ${body.periodStartDate} to ${body.periodEndDateExclusive}.`,
        );
      }
    } catch (error) {
      setLatestPaymentSummary(null);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setPaymentMessage(
            `Unable to load latest payment summary. ${error.message}`,
          );
        } else {
          setPaymentMessage("Unable to load latest payment summary.");
        }
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
      const body = await portalClient.getPaymentHistory();
      setPaymentHistory(body.items);
      if (!silent) {
        setPaymentMessage(`Loaded ${body.count} payment history record(s).`);
      }
    } catch (error) {
      setPaymentHistory([]);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setPaymentMessage(`Unable to load payment history. ${error.message}`);
        } else {
          setPaymentMessage("Unable to load payment history.");
        }
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
      const body = await portalClient.getAllTimeBalance();
      setBalanceSummary(body);
      if (!silent) {
        setPaymentMessage(`Loaded all-time balance (${body.balanceStatus}).`);
      }
    } catch (error) {
      setBalanceSummary(null);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setPaymentMessage(
            `Unable to load all-time balance. ${error.message}`,
          );
        } else {
          setPaymentMessage("Unable to load all-time balance.");
        }
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
      const body = await portalClient.getLatestStatementSummary();
      setLatestStatementSummary(body);
      setStatementMessage(
        `Loaded latest statement summary for ${body.periodStartDate} to ${body.periodEndDateExclusive}.`,
      );
    } catch (error) {
      setLatestStatementSummary(null);
      if (error instanceof PortalApiError) {
        setStatementMessage(
          `Unable to load latest statement summary. ${error.message}`,
        );
      } else {
        setStatementMessage("Unable to load latest statement summary.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStatementPeriods = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getStatementPeriods();
      setStatementPeriods(body.items);
      if (!selectedSnapshotId && body.items.length > 0) {
        setSelectedSnapshotId(body.items[0].snapshotId);
      }
      setStatementMessage(`Loaded ${body.count} statement period option(s).`);
    } catch (error) {
      setStatementPeriods([]);
      if (error instanceof PortalApiError) {
        setStatementMessage(
          `Unable to load statement periods. ${error.message}`,
        );
      } else {
        setStatementMessage("Unable to load statement periods.");
      }
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
      const body = await portalClient.getStatementSummary(snapshot);
      setSelectedStatementSummary(body);
      setStatementMessage(
        `Loaded selected summary for ${body.periodStartDate} to ${body.periodEndDateExclusive}.`,
      );
    } catch (error) {
      setSelectedStatementSummary(null);
      if (error instanceof PortalApiError) {
        setStatementMessage(
          `Unable to load selected summary. ${error.message}`,
        );
      } else {
        setStatementMessage("Unable to load selected summary.");
      }
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
      const { blob, exportId, suggestedName } =
        await portalClient.exportStatementPdf(snapshot);
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = suggestedName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setStatementMessage(`Statement PDF exported. Export ID: ${exportId}.`);
      await loadStatementExportHistory(true);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setStatementMessage(`Statement PDF export failed. ${error.message}`);
      } else {
        setStatementMessage("Statement PDF export failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStatementExportHistory = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getStatementExportHistory();
      setStatementExportHistory(body.items);
      if (!silent) {
        setStatementMessage(`Loaded ${body.count} statement export record(s).`);
      }
    } catch (error) {
      setStatementExportHistory([]);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setStatementMessage(
            `Unable to load statement exports. ${error.message}`,
          );
        } else {
          setStatementMessage("Unable to load statement exports.");
        }
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
    <LoginView
      shellHeader={renderShellHeader()}
      session={session}
      email={email}
      code={code}
      loading={loading}
      statusMessage={statusMessage}
      onEmailChange={setEmail}
      onCodeChange={setCode}
      onRequestCode={requestCode}
      onVerifyCode={verifyCode}
      onRefreshSession={() => refreshSession()}
      onLogout={logout}
      formatDisplayDateTime={formatDisplayDateTime}
    />
  );

  const renderOnboardingView = () => (
    <OnboardingView
      shellHeader={renderShellHeader()}
      loading={loading}
      activeTerms={activeTerms}
      termsMessage={termsMessage}
      profileMessage={profileMessage}
      utilitySetupMessage={utilitySetupMessage}
      progressMessage={progressMessage}
      onboardingProgress={onboardingProgress}
      surname={surname}
      dateOfBirth={dateOfBirth}
      flatNumber={flatNumber}
      mobileNumber={mobileNumber}
      moveInDate={moveInDate}
      openingColdWaterReading={openingColdWaterReading}
      openingHotWaterReading={openingHotWaterReading}
      openingElectricityReading={openingElectricityReading}
      initialWaterTariffPerUnit={initialWaterTariffPerUnit}
      initialElectricityTariffPerUnit={initialElectricityTariffPerUnit}
      boilerKwhPerCubicMeter={boilerKwhPerCubicMeter}
      boilerEfficiencyPercent={boilerEfficiencyPercent}
      profileFieldErrors={profileFieldErrors}
      utilityFieldErrors={utilityFieldErrors}
      getFieldErrors={getFieldErrors}
      onLoadActiveTerms={loadActiveTerms}
      onAcceptTerms={acceptTerms}
      onSubmitProfile={submitProfile}
      onSubmitUtilitySetup={submitUtilitySetup}
      onLoadOnboardingProgress={loadOnboardingProgress}
      onSurnameChange={setSurname}
      onDateOfBirthChange={setDateOfBirth}
      onFlatNumberChange={setFlatNumber}
      onMobileNumberChange={setMobileNumber}
      onMoveInDateChange={setMoveInDate}
      onOpeningColdWaterReadingChange={setOpeningColdWaterReading}
      onOpeningHotWaterReadingChange={setOpeningHotWaterReading}
      onOpeningElectricityReadingChange={setOpeningElectricityReading}
      onInitialWaterTariffPerUnitChange={setInitialWaterTariffPerUnit}
      onInitialElectricityTariffPerUnitChange={
        setInitialElectricityTariffPerUnit
      }
      onBoilerKwhPerCubicMeterChange={setBoilerKwhPerCubicMeter}
      onBoilerEfficiencyPercentChange={setBoilerEfficiencyPercent}
    />
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
      onElectricityStandingChargePerDayChange={
        setElectricityStandingChargePerDay
      }
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
