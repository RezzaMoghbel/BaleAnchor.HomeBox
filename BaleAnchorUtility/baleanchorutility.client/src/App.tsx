import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AdminDashboardView } from "./components/dashboard/AdminDashboardView";
import { OverviewDashboardView } from "./components/dashboard/OverviewDashboardView";
import { PaymentsDashboardView } from "./components/dashboard/PaymentsDashboardView";
import { ReadingsDashboardView } from "./components/dashboard/ReadingsDashboardView";
import { NotificationsDashboardView } from "./components/dashboard/NotificationsDashboardView";
import { StatementsDashboardView } from "./components/dashboard/StatementsDashboardView";
import { LoginView } from "./components/auth/LoginView";
import { OtpView } from "./components/auth/OtpView";
import { OnboardingView } from "./components/onboarding/OnboardingView";
import { portalClient, PortalApiError } from "./api/portalClient";
import type { SessionStatusResponse, FieldErrors } from "./shared/contracts";
import {
  formatCurrencyGbp,
  formatDateRange,
  formatDisplayDate,
  formatDisplayDateTime,
} from "./shared/formatters";
import { getFieldErrors } from "./shared/problemDetails";
import { getTargetRoute } from "./shared/routing";
import {
  validateRequestCodeInput,
  validateSignupRequestCodeInput,
  validateVerifyCodeInput,
} from "./validation/auth";
import { useAdminWorkflow } from "./hooks/useAdminWorkflow";
import { useBillingFormState } from "./hooks/useBillingFormState";
import { useBillingPaymentsWorkflow } from "./hooks/useBillingPaymentsWorkflow";
import { useNotificationsWorkflow } from "./hooks/useNotificationsWorkflow";
import { useOnboardingWorkflow } from "./hooks/useOnboardingWorkflow";
import { useStatementsWorkflow } from "./hooks/useStatementsWorkflow";
import "./App.css";

const ADMIN_RETURN_PATH_KEY = "bau.admin.returnPath";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionStatusResponse | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [code, setCode] = useState("");
  const [verifyPurpose, setVerifyPurpose] = useState<"login" | "signup">(
    "login",
  );
  const [loginFieldErrors, setLoginFieldErrors] = useState<FieldErrors>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [otpEnabled, setOtpEnabled] = useState(true);
  const {
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
    readingsFieldErrors,
    tariffFieldErrors,
    paymentAmount,
    paymentDate,
    paymentMethod,
    paymentReference,
    paymentNotes,
    paymentFieldErrors,
    setPaymentAmount,
    setPaymentDate,
    setPaymentMethod,
    setPaymentReference,
    setPaymentNotes,
    setReadingsFieldErrors,
    setTariffFieldErrors,
    setPaymentFieldErrors,
    handleReadingDateChange,
    handleColdWaterReadingChange,
    handleHotWaterReadingChange,
    handleElectricityReadingChange,
    handleTariffEffectiveFromDateChange,
    handleWaterTariffPerUnitChange,
    handleWaterStandingChargePerDayChange,
    handleWaterVatPercentChange,
    handleElectricityTariffPerUnitChange,
    handleElectricityStandingChargePerDayChange,
    handleElectricityVatPercentChange,
    handlePaymentAmountChange,
    handlePaymentDateChange,
    handlePaymentMethodChange,
    handlePaymentReferenceChange,
    handlePaymentNotesChange,
  } = useBillingFormState();
  const [loading, setLoading] = useState(false);

  const {
    pendingApprovals,
    adminUsers,
    adminTargetUserId,
    adminReason,
    adminSearchQuery,
    adminSearchStatus,
    adminBillingOnDate,
    adminBillingContext,
    adminTariffEffectiveFromDate,
    adminWaterTariffPerUnit,
    adminWaterStandingChargePerDay,
    adminWaterVatPercent,
    adminElectricityTariffPerUnit,
    adminElectricityStandingChargePerDay,
    adminElectricityVatPercent,
    adminBoilerKwhPerCubicMeter,
    adminBoilerEfficiencyPercent,
    termsVersionLabel,
    termsVersionTitle,
    termsContentMarkdown,
    termsEffectiveFromUtc,
    termsFilterUserId,
    termsFilterVersionId,
    termsVersions,
    termsAcceptances,
    auditActorUserId,
    auditTargetUserId,
    auditCategory,
    auditAction,
    auditEntries,
    flats,
    flatNumberInput,
    flatLabelInput,
    flatIsActiveInput,
    tenancies,
    tenancyIdInput,
    tenancyUserIdInput,
    tenancyFlatNumberInput,
    tenancyMoveInDateInput,
    tenancyMoveOutDateInput,
    tenancyStatusInput,
    tenancyNotesInput,
    tenancyFilterUserId,
    tenancyFilterFlatNumber,
    tenantGaps,
    gapFlatNumberInput,
    gapFromDateInput,
    gapToDateExclusiveInput,
    gapAssignedUserIdInput,
    gapAmountInput,
    gapStatusInput,
    gapFilterFlatNumber,
    adminRoleTarget,
    authOtpEnabled,
    authAllowLocalFixedOtp,
    authFixedOtpCode,
    authLocalDomains,
    emailTransportMode,
    emailFromName,
    emailFromAddress,
    emailSmtpHost,
    emailSmtpPort,
    emailSmtpUseSsl,
    emailSmtpUsername,
    emailSmtpPassword,
    emailTestRecipient,
    adminMessage,
    setAdminSearchQuery,
    setAdminSearchStatus,
    setAdminTargetUserId,
    setAdminReason,
    setAdminBillingOnDate,
    setAdminTariffEffectiveFromDate,
    setAdminWaterTariffPerUnit,
    setAdminWaterStandingChargePerDay,
    setAdminWaterVatPercent,
    setAdminElectricityTariffPerUnit,
    setAdminElectricityStandingChargePerDay,
    setAdminElectricityVatPercent,
    setAdminBoilerKwhPerCubicMeter,
    setAdminBoilerEfficiencyPercent,
    setTermsVersionLabel,
    setTermsVersionTitle,
    setTermsContentMarkdown,
    setTermsEffectiveFromUtc,
    setTermsFilterUserId,
    setTermsFilterVersionId,
    setAuditActorUserId,
    setAuditTargetUserId,
    setAuditCategory,
    setAuditAction,
    setFlatNumberInput,
    setFlatLabelInput,
    setFlatIsActiveInput,
    setTenancyIdInput,
    setTenancyUserIdInput,
    setTenancyFlatNumberInput,
    setTenancyMoveInDateInput,
    setTenancyMoveOutDateInput,
    setTenancyStatusInput,
    setTenancyNotesInput,
    setTenancyFilterUserId,
    setTenancyFilterFlatNumber,
    setGapFlatNumberInput,
    setGapFromDateInput,
    setGapToDateExclusiveInput,
    setGapAssignedUserIdInput,
    setGapAmountInput,
    setGapStatusInput,
    setGapFilterFlatNumber,
    setAdminRoleTarget,
    setAuthOtpEnabled,
    setAuthAllowLocalFixedOtp,
    setAuthFixedOtpCode,
    setAuthLocalDomains,
    setEmailTransportMode,
    setEmailFromName,
    setEmailFromAddress,
    setEmailSmtpHost,
    setEmailSmtpPort,
    setEmailSmtpUseSsl,
    setEmailSmtpUsername,
    setEmailSmtpPassword,
    setEmailTestRecipient,
    loadPendingApprovals,
    loadSystemSettings,
    saveAuthAccessSettings,
    saveEmailTransportSettings,
    sendEmailTransportTest,
    searchAdminUsers,
    loadAdminBillingContext,
    deleteAdminLatestReading,
    upsertAdminTariff,
    updateAdminBoilerAssumptions,
    loadTermsVersions,
    publishTermsVersion,
    loadTermsAcceptances,
    loadAuditLogs,
    loadSupportLifecycleAuditLogs,
    loadFlats,
    upsertFlat,
    loadTenancies,
    upsertTenancy,
    beginTenancyEdit,
    clearTenancyForm,
    loadTenantGaps,
    upsertTenantGap,
    beginTenantGapEdit,
    clearTenantGapForm,
    submitAdminDecision,
    submitRoleChange,
    submitAdminLifecycleAction,
    applyAccountStatusRoleChange,
    startDelegatedSupportSession,
    hardDeleteAdminUser,
  } = useAdminWorkflow({ setLoading });

  const {
    billingMessage,
    latestReadings,
    activeTariff,
    latestCalculation,
    paymentMessage,
    latestPaymentSummary,
    paymentHistory,
    balanceSummary,
    editingPaymentId,
    submitReadings,
    loadLatestReadings,
    submitTariffVersion,
    loadActiveTariff,
    runLatestCalculation,
    loadLatestCalculation,
    recordLatestPeriodPayment,
    beginPaymentEdit,
    cancelPaymentEdit,
    deletePayment,
    loadLatestPeriodPaymentSummary,
    loadPaymentHistory,
    loadAllTimeBalance,
  } = useBillingPaymentsWorkflow({
    setLoading,
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
    paymentAmount,
    paymentDate,
    paymentMethod,
    paymentReference,
    paymentNotes,
    setPaymentAmount,
    setPaymentDate,
    setPaymentMethod,
    setPaymentReference,
    setPaymentNotes,
    setReadingsFieldErrors,
    setTariffFieldErrors,
    setPaymentFieldErrors,
  });

  const {
    statementMessage,
    selectedSnapshotId,
    latestStatementSummary,
    selectedStatementSummary,
    statementPeriods,
    statementExportHistory,
    loadLatestStatementSummary,
    loadStatementPeriods,
    loadSelectedStatementSummary,
    exportSelectedStatementPdf,
    loadStatementExportHistory,
    setSelectedSnapshotId,
  } = useStatementsWorkflow({
    isStatementsDashboard: location.pathname.startsWith(
      "/dashboard/statements",
    ),
    setLoading,
  });

  const {
    notificationMessage,
    pushConfig,
    preferences,
    subscriptions,
    reminderJobs,
    loadPreferences,
    savePreferences,
    loadSubscriptions,
    loadReminderJobs,
    subscribePush,
    unsubscribePush,
    sendTestNotification,
    setTimeZoneId,
    setEmailRemindersEnabled,
    setPushRemindersEnabled,
    setReadingReminderEnabled,
  } = useNotificationsWorkflow({
    isNotificationsDashboard: location.pathname.startsWith(
      "/dashboard/notifications",
    ),
    setLoading,
  });

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setLoginFieldErrors((current) => {
      if (!current.email) {
        return current;
      }

      const next = { ...current };
      delete next.email;
      return next;
    });
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    setLoginFieldErrors((current) => {
      if (!current.code) {
        return current;
      }

      const next = { ...current };
      delete next.code;
      return next;
    });
  };

  const handleSignupPasswordChange = (value: string) => {
    setSignupPassword(value);
    setLoginFieldErrors((current) => {
      if (!current.password) {
        return current;
      }

      const next = { ...current };
      delete next.password;
      return next;
    });
  };

  const requestCode = async () => {
    if (!otpEnabled) {
      setStatusMessage(
        "OTP sign-in is disabled. Use email and password to sign in.",
      );
      return false;
    }

    const validationErrors = validateRequestCodeInput(email);
    if (Object.keys(validationErrors).length > 0) {
      setLoginFieldErrors(validationErrors);
      setStatusMessage("Enter a valid email address before requesting a code.");
      return false;
    }

    setLoginFieldErrors({});
    setLoading(true);
    try {
      await portalClient.requestCode({ email });
      setVerifyPurpose("login");
      setStatusMessage("");
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setStatusMessage(`Failed to request OTP code. ${error.message}`);
      } else {
        setStatusMessage("Failed to request OTP code.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signupRequestCode = async () => {
    const validationErrors = validateSignupRequestCodeInput(
      email,
      signupPassword,
    );
    if (Object.keys(validationErrors).length > 0) {
      setLoginFieldErrors(validationErrors);
      setStatusMessage(
        "Enter a valid email and a strong password before requesting signup OTP.",
      );
      return;
    }

    setLoginFieldErrors({});
    setLoading(true);
    try {
      await portalClient.signupRequestCode({
        email,
        password: signupPassword,
      });
      setVerifyPurpose("signup");
      setStatusMessage("");
      if (otpEnabled) {
        setCode("");
        setLoginFieldErrors({});
        navigate("/otp");
      }
    } catch (error) {
      if (error instanceof PortalApiError) {
        setLoginFieldErrors(error.errors);
        setStatusMessage(`Failed to start signup. ${error.message}`);
      } else {
        setStatusMessage("Failed to start signup.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!otpEnabled) {
      setStatusMessage(
        "OTP verification is disabled. Use email and password to sign in.",
      );
      return;
    }

    if (!email) {
      setStatusMessage("Start from Sign In or Sign Up before entering OTP.");
      return;
    }

    const validationErrors = validateVerifyCodeInput(email, code);
    if (Object.keys(validationErrors).length > 0) {
      setLoginFieldErrors(validationErrors);
      setStatusMessage("Enter a valid email address and 6-digit OTP code.");
      return;
    }

    setLoginFieldErrors({});
    setLoading(true);
    try {
      await portalClient.verifyCode({
        email,
        code,
        purpose: verifyPurpose,
      });
      setStatusMessage("");
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

  const passwordLogin = async () => {
    const validationErrors = validateSignupRequestCodeInput(
      email,
      signupPassword,
    );
    if (Object.keys(validationErrors).length > 0) {
      setLoginFieldErrors(validationErrors);
      setStatusMessage("Enter a valid email and password to sign in.");
      return;
    }

    setLoginFieldErrors({});
    setLoading(true);
    try {
      await portalClient.passwordLogin({
        email,
        password: signupPassword,
      });
      setStatusMessage("");
      await refreshSession(true);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setStatusMessage(`Failed to sign in with password. ${error.message}`);
      } else {
        setStatusMessage("Failed to sign in with password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshAuthMode = async () => {
    try {
      const mode = await portalClient.getAuthMode();
      setOtpEnabled(mode.otpEnabled);
    } catch {
      setOtpEnabled(true);
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

      let nextSession: SessionStatusResponse | null = null;
      try {
        nextSession = await portalClient.getSession();
      } catch {
        nextSession = null;
      }

      if (nextSession?.isAuthenticated) {
        setSession(nextSession);
        const returnPath =
          sessionStorage.getItem(ADMIN_RETURN_PATH_KEY) ||
          "/dashboard/admin/account";
        sessionStorage.removeItem(ADMIN_RETURN_PATH_KEY);
        setStatusMessage("Returned to admin session.");
        navigate(returnPath, { replace: true });
        return;
      }

      setSession(null);
      sessionStorage.removeItem(ADMIN_RETURN_PATH_KEY);
      setStatusMessage("");
      setCode("");
      setLoginFieldErrors({});
      navigate("/signin", { replace: true });
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

  const {
    activeTerms,
    termsMessage,
    surname,
    dateOfBirth,
    flatNumber,
    mobileNumber,
    profileMessage,
    profileFieldErrors,
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
    utilitySetupMessage,
    utilityFieldErrors,
    onboardingProgress,
    progressMessage,
    loadActiveTerms,
    acceptTerms,
    submitProfile,
    submitUtilitySetup,
    loadOnboardingState,
    loadOnboardingProgress,
    setSurname,
    setDateOfBirth,
    setFlatNumber,
    setMobileNumber,
    setMoveInDate,
    setOpeningColdWaterReading,
    setOpeningHotWaterReading,
    setOpeningElectricityReading,
    setInitialWaterTariffPerUnit,
    setInitialWaterStandingChargePerDay,
    setInitialWaterVatPercent,
    setInitialElectricityTariffPerUnit,
    setInitialElectricityStandingChargePerDay,
    setInitialElectricityVatPercent,
    setHotWaterTemperatureCelsius,
    setHotWaterHeatCapacity,
    setHotWaterDensity,
    setKiloJouleToKiloWattHourFactor,
  } = useOnboardingWorkflow({
    setLoading,
    setStatusMessage,
    refreshSession,
    enableOnboardingHeartbeat:
      sessionChecked &&
      session?.isAuthenticated === true &&
      location.pathname === "/onboarding",
  });

  const userRole = session?.userRole?.trim().toLowerCase() ?? "";
  const userStatus = session?.userStatus?.trim().toLowerCase() ?? "";
  const isAuthenticated = session?.isAuthenticated === true;
  const isRejected = isAuthenticated && userStatus === "rejected";
  const isSuspended = isAuthenticated && userStatus === "suspended";
  const needsOnboarding =
    isAuthenticated && !isRejected && !isSuspended && userStatus !== "active";
  const isAdminUser = userRole === "admin" || userRole === "superadmin";
  const isSuperAdminUser = userRole === "superadmin";
  const isDelegatedSession = session?.isDelegatedSession === true;

  const adminSection = location.pathname.startsWith("/dashboard/admin/settings")
    ? "settings"
    : location.pathname.startsWith("/dashboard/admin/system-auth")
      ? "system-auth"
      : location.pathname.startsWith("/dashboard/admin/search")
        ? "search"
        : location.pathname.startsWith("/dashboard/admin/flat-register")
          ? "flat-register"
          : "account";

  useEffect(() => {
    void refreshSession(true);
    void refreshAuthMode();
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

  useEffect(() => {
    if (!isAdminUser) {
      return;
    }

    if (
      location.pathname.startsWith("/dashboard/admin/account-access") ||
      location.pathname.startsWith("/dashboard/admin/approvals")
    ) {
      navigate("/dashboard/admin/account", { replace: true });
      return;
    }

    if (
      location.pathname.startsWith("/dashboard/admin") &&
      (adminSection === "settings" || adminSection === "system-auth")
    ) {
      void loadSystemSettings();
    }
  }, [adminSection, isAdminUser, location.pathname, navigate]);

  const pageMode =
    location.pathname === "/onboarding"
      ? "onboarding"
      : location.pathname.startsWith("/dashboard")
        ? "dashboard"
        : location.pathname === "/rejected"
          ? "rejected"
          : location.pathname === "/suspended"
            ? "suspended"
            : location.pathname === "/otp"
              ? "otp"
              : location.pathname === "/signup"
                ? "signup"
                : "signin";

  const dashboardSection = location.pathname.startsWith("/dashboard/payments")
    ? "payments"
    : location.pathname.startsWith("/dashboard/statements")
      ? "statements"
      : location.pathname.startsWith("/dashboard/notifications")
        ? "notifications"
        : location.pathname.startsWith("/dashboard/admin")
          ? "admin"
          : location.pathname.startsWith("/dashboard/readings")
            ? "readings"
            : "overview";

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
          {sessionChecked && !isAuthenticated && (
            <>
              <Link className={shellLinkClass("signin")} to="/signin">
                Sign In
              </Link>
              <Link className={shellLinkClass("signup")} to="/signup">
                Sign Up
              </Link>
            </>
          )}
          {sessionChecked && isAuthenticated && needsOnboarding && (
            <Link className={shellLinkClass("onboarding")} to="/onboarding">
              Onboarding
            </Link>
          )}
          {sessionChecked &&
            isAuthenticated &&
            !needsOnboarding &&
            !isRejected &&
            !isSuspended && (
              <Link className={shellLinkClass("dashboard")} to="/dashboard">
                Dashboard
              </Link>
            )}
          {sessionChecked && isAuthenticated && (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => void logout()}
              disabled={loading}
            >
              Sign out
            </button>
          )}
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
      authRoute={location.pathname === "/signup" ? "signup" : "signin"}
      otpEnabled={otpEnabled}
      email={email}
      signupPassword={signupPassword}
      loginFieldErrors={loginFieldErrors}
      loading={loading}
      statusMessage={statusMessage}
      onEmailChange={handleEmailChange}
      onSignupPasswordChange={handleSignupPasswordChange}
      onSignupRequestCode={signupRequestCode}
      onPasswordLogin={passwordLogin}
      onContinueToOtp={async () => {
        const requested = await requestCode();
        if (!requested) {
          return;
        }

        setCode("");
        setLoginFieldErrors({});
        setStatusMessage("");
        navigate("/otp");
      }}
    />
  );

  const renderOtpView = () => (
    <OtpView
      shellHeader={renderShellHeader()}
      code={code}
      loading={loading}
      loginFieldErrors={loginFieldErrors}
      statusMessage={statusMessage}
      onCodeChange={handleCodeChange}
      onVerifyOtp={verifyCode}
      onCancel={() => {
        setCode("");
        setLoginFieldErrors({});
        setStatusMessage("");
        navigate("/signin", { replace: true });
        window.location.reload();
      }}
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
      initialWaterStandingChargePerDay={initialWaterStandingChargePerDay}
      initialWaterVatPercent={initialWaterVatPercent}
      initialElectricityTariffPerUnit={initialElectricityTariffPerUnit}
      initialElectricityStandingChargePerDay={
        initialElectricityStandingChargePerDay
      }
      initialElectricityVatPercent={initialElectricityVatPercent}
      hotWaterTemperatureCelsius={hotWaterTemperatureCelsius}
      hotWaterHeatCapacity={hotWaterHeatCapacity}
      hotWaterDensity={hotWaterDensity}
      kiloJouleToKiloWattHourFactor={kiloJouleToKiloWattHourFactor}
      profileFieldErrors={profileFieldErrors}
      utilityFieldErrors={utilityFieldErrors}
      getFieldErrors={getFieldErrors}
      onLoadActiveTerms={loadActiveTerms}
      onAcceptTerms={acceptTerms}
      onSubmitProfile={submitProfile}
      onSubmitUtilitySetup={submitUtilitySetup}
      onLoadOnboardingState={loadOnboardingState}
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
      onInitialWaterStandingChargePerDayChange={
        setInitialWaterStandingChargePerDay
      }
      onInitialWaterVatPercentChange={setInitialWaterVatPercent}
      onInitialElectricityTariffPerUnitChange={
        setInitialElectricityTariffPerUnit
      }
      onInitialElectricityStandingChargePerDayChange={
        setInitialElectricityStandingChargePerDay
      }
      onInitialElectricityVatPercentChange={setInitialElectricityVatPercent}
      onHotWaterTemperatureCelsiusChange={setHotWaterTemperatureCelsius}
      onHotWaterHeatCapacityChange={setHotWaterHeatCapacity}
      onHotWaterDensityChange={setHotWaterDensity}
      onKiloJouleToKiloWattHourFactorChange={setKiloJouleToKiloWattHourFactor}
    />
  );

  const renderSuspendedView = () => (
    <div className="wrapper">
      {renderShellHeader()}
      <main className="page-content p-4">
        <div className="container-fluid">
          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body py-5 text-center">
              <h1 className="mb-3">Your account has been suspended</h1>
              <p className="text-secondary mb-0">
                Please contact the administrator for further details.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  const renderRejectedView = () => (
    <div className="wrapper">
      {renderShellHeader()}
      <main className="page-content p-4">
        <div className="container-fluid">
          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body py-5 text-center">
              <h1 className="mb-3">Your account has been rejected</h1>
              <p className="text-secondary mb-1">
                If you believe this decision is incorrect, you can appeal by
                emailing the administrator.
              </p>
              <a href="mailto:info@moghbel.co.uk">reza@moghbel.co.uk</a>
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
      {!isSuperAdminUser && (
        <Link
          className={`shell-nav-link ${dashboardSection === "readings" ? "shell-nav-link--active" : ""}`}
          to="/dashboard/readings"
        >
          Readings & Tariffs
        </Link>
      )}
      {!isAdminUser && (
        <Link
          className={`shell-nav-link ${dashboardSection === "payments" ? "shell-nav-link--active" : ""}`}
          to="/dashboard/payments"
        >
          Payments
        </Link>
      )}
      {!isAdminUser && (
        <Link
          className={`shell-nav-link ${dashboardSection === "statements" ? "shell-nav-link--active" : ""}`}
          to="/dashboard/statements"
        >
          Statements
        </Link>
      )}
      <Link
        className={`shell-nav-link ${dashboardSection === "notifications" ? "shell-nav-link--active" : ""}`}
        to="/dashboard/notifications"
      >
        Notifications
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

  const renderAdminRouteTabs = () => (
    <div className="d-flex flex-wrap gap-2 mb-4">
      <Link
        className={`shell-nav-link ${adminSection === "account" ? "shell-nav-link--active" : ""}`}
        to="/dashboard/admin/account"
      >
        Account
      </Link>
      <Link
        className={`shell-nav-link ${adminSection === "settings" ? "shell-nav-link--active" : ""}`}
        to="/dashboard/admin/settings"
      >
        Settings
      </Link>
      <Link
        className={`shell-nav-link ${adminSection === "system-auth" ? "shell-nav-link--active" : ""}`}
        to="/dashboard/admin/system-auth"
      >
        System auth
      </Link>
      <Link
        className={`shell-nav-link ${adminSection === "search" ? "shell-nav-link--active" : ""}`}
        to="/dashboard/admin/search"
      >
        Search users and target account context
      </Link>
      <Link
        className={`shell-nav-link ${adminSection === "flat-register" ? "shell-nav-link--active" : ""}`}
        to="/dashboard/admin/flat-register"
      >
        Flat register management
      </Link>
    </div>
  );

  const renderDashboardTabsWithDelegatedBanner = () => (
    <>
      {isDelegatedSession && (
        <div className="alert alert-warning border mb-3" role="status">
          You are viewing this account as delegated admin support.
          {session?.delegatedByUserId
            ? ` Started by ${session.delegatedByUserId}.`
            : ""}
          {session?.delegationReason
            ? ` Reason: ${session.delegationReason}.`
            : ""}
        </div>
      )}
      {renderDashboardRouteTabs()}
    </>
  );

  const openAccountFromAdminSearch = async (
    targetUserId: string,
    expectedEmail?: string,
  ) => {
    const reason =
      adminReason.trim().length >= 8
        ? adminReason.trim()
        : "Support-assisted account access";

    const started = await startDelegatedSupportSession({
      targetUserId,
      reason,
      expectedEmail,
    });

    if (started) {
      sessionStorage.setItem(
        ADMIN_RETURN_PATH_KEY,
        `${location.pathname}${location.search}${location.hash}`,
      );
      window.location.assign("/dashboard");
    }
  };

  const renderAdminView = () => (
    <AdminDashboardView
      shellHeader={renderShellHeader()}
      routeTabs={renderDashboardRouteTabs()}
      adminRouteTabs={renderAdminRouteTabs()}
      adminSection={adminSection}
      loading={loading}
      adminTargetUserId={adminTargetUserId}
      adminReason={adminReason}
      adminRoleTarget={adminRoleTarget}
      adminMessage={adminMessage}
      currentUserRole={userRole}
      adminUsers={adminUsers}
      adminSearchQuery={adminSearchQuery}
      adminSearchStatus={adminSearchStatus}
      adminBillingOnDate={adminBillingOnDate}
      adminBillingContext={adminBillingContext}
      adminTariffEffectiveFromDate={adminTariffEffectiveFromDate}
      adminWaterTariffPerUnit={adminWaterTariffPerUnit}
      adminWaterStandingChargePerDay={adminWaterStandingChargePerDay}
      adminWaterVatPercent={adminWaterVatPercent}
      adminElectricityTariffPerUnit={adminElectricityTariffPerUnit}
      adminElectricityStandingChargePerDay={
        adminElectricityStandingChargePerDay
      }
      adminElectricityVatPercent={adminElectricityVatPercent}
      adminBoilerKwhPerCubicMeter={adminBoilerKwhPerCubicMeter}
      adminBoilerEfficiencyPercent={adminBoilerEfficiencyPercent}
      termsVersionLabel={termsVersionLabel}
      termsVersionTitle={termsVersionTitle}
      termsContentMarkdown={termsContentMarkdown}
      termsEffectiveFromUtc={termsEffectiveFromUtc}
      termsFilterUserId={termsFilterUserId}
      termsFilterVersionId={termsFilterVersionId}
      termsVersions={termsVersions}
      termsAcceptances={termsAcceptances}
      auditActorUserId={auditActorUserId}
      auditTargetUserId={auditTargetUserId}
      auditCategory={auditCategory}
      auditAction={auditAction}
      auditEntries={auditEntries}
      flats={flats}
      flatNumberInput={flatNumberInput}
      flatLabelInput={flatLabelInput}
      flatIsActiveInput={flatIsActiveInput}
      tenancies={tenancies}
      tenancyIdInput={tenancyIdInput}
      tenancyUserIdInput={tenancyUserIdInput}
      tenancyFlatNumberInput={tenancyFlatNumberInput}
      tenancyMoveInDateInput={tenancyMoveInDateInput}
      tenancyMoveOutDateInput={tenancyMoveOutDateInput}
      tenancyStatusInput={tenancyStatusInput}
      tenancyNotesInput={tenancyNotesInput}
      tenancyFilterUserId={tenancyFilterUserId}
      tenancyFilterFlatNumber={tenancyFilterFlatNumber}
      tenantGaps={tenantGaps}
      gapFlatNumberInput={gapFlatNumberInput}
      gapFromDateInput={gapFromDateInput}
      gapToDateExclusiveInput={gapToDateExclusiveInput}
      gapAssignedUserIdInput={gapAssignedUserIdInput}
      gapAmountInput={gapAmountInput}
      gapStatusInput={gapStatusInput}
      gapFilterFlatNumber={gapFilterFlatNumber}
      pendingApprovals={pendingApprovals}
      authOtpEnabled={authOtpEnabled}
      authAllowLocalFixedOtp={authAllowLocalFixedOtp}
      authFixedOtpCode={authFixedOtpCode}
      authLocalDomains={authLocalDomains}
      emailTransportMode={emailTransportMode}
      emailFromName={emailFromName}
      emailFromAddress={emailFromAddress}
      emailSmtpHost={emailSmtpHost}
      emailSmtpPort={emailSmtpPort}
      emailSmtpUseSsl={emailSmtpUseSsl}
      emailSmtpUsername={emailSmtpUsername}
      emailSmtpPassword={emailSmtpPassword}
      emailTestRecipient={emailTestRecipient}
      onAdminSearchQueryChange={setAdminSearchQuery}
      onAdminSearchStatusChange={setAdminSearchStatus}
      onAdminTargetUserIdChange={setAdminTargetUserId}
      onAdminReasonChange={setAdminReason}
      onAdminRoleTargetChange={setAdminRoleTarget}
      onAdminBillingOnDateChange={setAdminBillingOnDate}
      onAdminTariffEffectiveFromDateChange={setAdminTariffEffectiveFromDate}
      onAdminWaterTariffPerUnitChange={setAdminWaterTariffPerUnit}
      onAdminWaterStandingChargePerDayChange={setAdminWaterStandingChargePerDay}
      onAdminWaterVatPercentChange={setAdminWaterVatPercent}
      onAdminElectricityTariffPerUnitChange={setAdminElectricityTariffPerUnit}
      onAdminElectricityStandingChargePerDayChange={
        setAdminElectricityStandingChargePerDay
      }
      onAdminElectricityVatPercentChange={setAdminElectricityVatPercent}
      onAdminBoilerKwhPerCubicMeterChange={setAdminBoilerKwhPerCubicMeter}
      onAdminBoilerEfficiencyPercentChange={setAdminBoilerEfficiencyPercent}
      onTermsVersionLabelChange={setTermsVersionLabel}
      onTermsVersionTitleChange={setTermsVersionTitle}
      onTermsContentMarkdownChange={setTermsContentMarkdown}
      onTermsEffectiveFromUtcChange={setTermsEffectiveFromUtc}
      onTermsFilterUserIdChange={setTermsFilterUserId}
      onTermsFilterVersionIdChange={setTermsFilterVersionId}
      onAuditActorUserIdChange={setAuditActorUserId}
      onAuditTargetUserIdChange={setAuditTargetUserId}
      onAuditCategoryChange={setAuditCategory}
      onAuditActionChange={setAuditAction}
      onFlatNumberInputChange={setFlatNumberInput}
      onFlatLabelInputChange={setFlatLabelInput}
      onFlatIsActiveInputChange={setFlatIsActiveInput}
      onTenancyIdInputChange={setTenancyIdInput}
      onTenancyUserIdInputChange={setTenancyUserIdInput}
      onTenancyFlatNumberInputChange={setTenancyFlatNumberInput}
      onTenancyMoveInDateInputChange={setTenancyMoveInDateInput}
      onTenancyMoveOutDateInputChange={setTenancyMoveOutDateInput}
      onTenancyStatusInputChange={setTenancyStatusInput}
      onTenancyNotesInputChange={setTenancyNotesInput}
      onTenancyFilterUserIdChange={setTenancyFilterUserId}
      onTenancyFilterFlatNumberChange={setTenancyFilterFlatNumber}
      onGapFlatNumberInputChange={setGapFlatNumberInput}
      onGapFromDateInputChange={setGapFromDateInput}
      onGapToDateExclusiveInputChange={setGapToDateExclusiveInput}
      onGapAssignedUserIdInputChange={setGapAssignedUserIdInput}
      onGapAmountInputChange={setGapAmountInput}
      onGapStatusInputChange={setGapStatusInput}
      onGapFilterFlatNumberChange={setGapFilterFlatNumber}
      onAuthOtpEnabledChange={setAuthOtpEnabled}
      onAuthAllowLocalFixedOtpChange={setAuthAllowLocalFixedOtp}
      onAuthFixedOtpCodeChange={setAuthFixedOtpCode}
      onAuthLocalDomainsChange={setAuthLocalDomains}
      onEmailTransportModeChange={setEmailTransportMode}
      onEmailFromNameChange={setEmailFromName}
      onEmailFromAddressChange={setEmailFromAddress}
      onEmailSmtpHostChange={setEmailSmtpHost}
      onEmailSmtpPortChange={setEmailSmtpPort}
      onEmailSmtpUseSslChange={setEmailSmtpUseSsl}
      onEmailSmtpUsernameChange={setEmailSmtpUsername}
      onEmailSmtpPasswordChange={setEmailSmtpPassword}
      onEmailTestRecipientChange={setEmailTestRecipient}
      onLoadPendingApprovals={loadPendingApprovals}
      onLoadSystemSettings={loadSystemSettings}
      onSaveAuthAccessSettings={saveAuthAccessSettings}
      onSaveEmailTransportSettings={saveEmailTransportSettings}
      onSendEmailTransportTest={sendEmailTransportTest}
      onSearchAdminUsers={searchAdminUsers}
      onLoadAdminBillingContext={loadAdminBillingContext}
      onOpenAccountFromSearch={openAccountFromAdminSearch}
      onDeleteAdminLatestReading={deleteAdminLatestReading}
      onUpsertAdminTariff={upsertAdminTariff}
      onUpdateAdminBoilerAssumptions={updateAdminBoilerAssumptions}
      onLoadTermsVersions={loadTermsVersions}
      onPublishTermsVersion={publishTermsVersion}
      onLoadTermsAcceptances={loadTermsAcceptances}
      onLoadAuditLogs={loadAuditLogs}
      onLoadSupportLifecycleAuditLogs={loadSupportLifecycleAuditLogs}
      onLoadFlats={loadFlats}
      onUpsertFlat={upsertFlat}
      onLoadTenancies={loadTenancies}
      onUpsertTenancy={upsertTenancy}
      onBeginTenancyEdit={beginTenancyEdit}
      onClearTenancyForm={clearTenancyForm}
      onLoadTenantGaps={loadTenantGaps}
      onUpsertTenantGap={upsertTenantGap}
      onBeginTenantGapEdit={beginTenantGapEdit}
      onClearTenantGapForm={clearTenantGapForm}
      onSubmitAdminDecision={submitAdminDecision}
      onSubmitRoleChange={submitRoleChange}
      onSubmitAdminLifecycleAction={submitAdminLifecycleAction}
      onApplyAccountStatusRoleChange={applyAccountStatusRoleChange}
      onStartDelegatedSupportSession={startDelegatedSupportSession}
      onHardDeleteAdminUser={hardDeleteAdminUser}
      formatDisplayDateTime={formatDisplayDateTime}
    />
  );

  const renderReadingsView = () => (
    <ReadingsDashboardView
      shellHeader={renderShellHeader()}
      routeTabs={renderDashboardTabsWithDelegatedBanner()}
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
      readingsFieldErrors={readingsFieldErrors}
      tariffFieldErrors={tariffFieldErrors}
      billingMessage={billingMessage}
      latestReadings={latestReadings}
      activeTariff={activeTariff}
      latestCalculation={latestCalculation}
      getFieldErrors={getFieldErrors}
      onReadingDateChange={handleReadingDateChange}
      onColdWaterReadingChange={handleColdWaterReadingChange}
      onHotWaterReadingChange={handleHotWaterReadingChange}
      onElectricityReadingChange={handleElectricityReadingChange}
      onTariffEffectiveFromDateChange={handleTariffEffectiveFromDateChange}
      onWaterTariffPerUnitChange={handleWaterTariffPerUnitChange}
      onWaterStandingChargePerDayChange={handleWaterStandingChargePerDayChange}
      onWaterVatPercentChange={handleWaterVatPercentChange}
      onElectricityTariffPerUnitChange={handleElectricityTariffPerUnitChange}
      onElectricityStandingChargePerDayChange={
        handleElectricityStandingChargePerDayChange
      }
      onElectricityVatPercentChange={handleElectricityVatPercentChange}
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
      routeTabs={renderDashboardTabsWithDelegatedBanner()}
      loading={loading}
      paymentAmount={paymentAmount}
      paymentDate={paymentDate}
      paymentMethod={paymentMethod}
      paymentReference={paymentReference}
      paymentNotes={paymentNotes}
      paymentFieldErrors={paymentFieldErrors}
      paymentMessage={paymentMessage}
      latestPaymentSummary={latestPaymentSummary}
      balanceSummary={balanceSummary}
      paymentHistory={paymentHistory}
      editingPaymentId={editingPaymentId}
      getFieldErrors={getFieldErrors}
      onPaymentAmountChange={handlePaymentAmountChange}
      onPaymentDateChange={handlePaymentDateChange}
      onPaymentMethodChange={handlePaymentMethodChange}
      onPaymentReferenceChange={handlePaymentReferenceChange}
      onPaymentNotesChange={handlePaymentNotesChange}
      onRecordLatestPeriodPayment={recordLatestPeriodPayment}
      onBeginPaymentEdit={beginPaymentEdit}
      onCancelPaymentEdit={cancelPaymentEdit}
      onDeletePayment={deletePayment}
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
      routeTabs={renderDashboardTabsWithDelegatedBanner()}
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

  const renderNotificationsView = () => (
    <NotificationsDashboardView
      shellHeader={renderShellHeader()}
      routeTabs={renderDashboardTabsWithDelegatedBanner()}
      loading={loading}
      notificationMessage={notificationMessage}
      pushConfig={pushConfig}
      preferences={preferences}
      subscriptions={subscriptions}
      reminderJobs={reminderJobs}
      onLoadPreferences={loadPreferences}
      onSavePreferences={savePreferences}
      onLoadSubscriptions={() => loadSubscriptions()}
      onLoadReminderJobs={() => loadReminderJobs()}
      onSubscribePush={subscribePush}
      onUnsubscribePush={unsubscribePush}
      onSendTestNotification={sendTestNotification}
      onTimeZoneIdChange={setTimeZoneId}
      onEmailRemindersEnabledChange={setEmailRemindersEnabled}
      onPushRemindersEnabledChange={setPushRemindersEnabled}
      onReadingReminderEnabledChange={setReadingReminderEnabled}
      formatDisplayDateTime={formatDisplayDateTime}
    />
  );

  if (pageMode === "signin" || pageMode === "signup") {
    return renderLoginView();
  }

  if (pageMode === "otp") {
    return renderOtpView();
  }

  if (pageMode === "onboarding") {
    return renderOnboardingView();
  }

  if (pageMode === "suspended") {
    return renderSuspendedView();
  }

  if (pageMode === "rejected") {
    return renderRejectedView();
  }

  if (dashboardSection === "readings") {
    if (isSuperAdminUser) {
      return renderAdminView();
    }

    return renderReadingsView();
  }

  if (dashboardSection === "payments") {
    if (isAdminUser) {
      return renderAdminView();
    }

    return renderPaymentsView();
  }

  if (dashboardSection === "statements") {
    if (isAdminUser) {
      return renderAdminView();
    }

    return renderStatementsView();
  }

  if (dashboardSection === "notifications") {
    return renderNotificationsView();
  }

  if (dashboardSection === "admin") {
    return renderAdminView();
  }

  return (
    <OverviewDashboardView
      shellHeader={renderShellHeader()}
      routeTabs={renderDashboardTabsWithDelegatedBanner()}
      session={session}
      statusMessage={statusMessage}
      formatDisplayDateTime={formatDisplayDateTime}
    />
  );
}

export default App;
