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
  validateVerifyCodeInput,
} from "./validation/auth";
import { useAdminWorkflow } from "./hooks/useAdminWorkflow";
import { useBillingFormState } from "./hooks/useBillingFormState";
import { useBillingPaymentsWorkflow } from "./hooks/useBillingPaymentsWorkflow";
import { useOnboardingWorkflow } from "./hooks/useOnboardingWorkflow";
import { useStatementsWorkflow } from "./hooks/useStatementsWorkflow";
import "./App.css";
function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionStatusResponse | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loginFieldErrors, setLoginFieldErrors] = useState<FieldErrors>({});
  const [statusMessage, setStatusMessage] = useState(
    "No authentication action run yet.",
  );
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
    adminTargetUserId,
    adminReason,
    adminRoleTarget,
    adminMessage,
    setAdminTargetUserId,
    setAdminReason,
    setAdminRoleTarget,
    loadPendingApprovals,
    submitAdminDecision,
    submitRoleChange,
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
    submitReadings,
    loadLatestReadings,
    submitTariffVersion,
    loadActiveTariff,
    runLatestCalculation,
    loadLatestCalculation,
    recordLatestPeriodPayment,
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

  const requestCode = async () => {
    const validationErrors = validateRequestCodeInput(email);
    if (Object.keys(validationErrors).length > 0) {
      setLoginFieldErrors(validationErrors);
      setStatusMessage("Enter a valid email address before requesting a code.");
      return;
    }

    setLoginFieldErrors({});
    setLoading(true);
    try {
      const body = await portalClient.requestCode({ email });
      setStatusMessage(
        `${body.message} Expires in ${body.expiresInSeconds}s. Resend after ${body.resendAfterSeconds}s.${body.developmentCode ? ` Development code: ${body.developmentCode}.` : ""}`,
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
    const validationErrors = validateVerifyCodeInput(email, code);
    if (Object.keys(validationErrors).length > 0) {
      setLoginFieldErrors(validationErrors);
      setStatusMessage("Enter a valid email address and 6-digit OTP code.");
      return;
    }

    setLoginFieldErrors({});
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
    initialElectricityTariffPerUnit,
    boilerKwhPerCubicMeter,
    boilerEfficiencyPercent,
    utilitySetupMessage,
    utilityFieldErrors,
    onboardingProgress,
    progressMessage,
    loadActiveTerms,
    acceptTerms,
    submitProfile,
    submitUtilitySetup,
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
    setInitialElectricityTariffPerUnit,
    setBoilerKwhPerCubicMeter,
    setBoilerEfficiencyPercent,
  } = useOnboardingWorkflow({
    setLoading,
    setStatusMessage,
    refreshSession: () => refreshSession(),
  });

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
      loginFieldErrors={loginFieldErrors}
      loading={loading}
      statusMessage={statusMessage}
      onEmailChange={handleEmailChange}
      onCodeChange={handleCodeChange}
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
      routeTabs={renderDashboardRouteTabs()}
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
      getFieldErrors={getFieldErrors}
      onPaymentAmountChange={handlePaymentAmountChange}
      onPaymentDateChange={handlePaymentDateChange}
      onPaymentMethodChange={handlePaymentMethodChange}
      onPaymentReferenceChange={handlePaymentReferenceChange}
      onPaymentNotesChange={handlePaymentNotesChange}
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
