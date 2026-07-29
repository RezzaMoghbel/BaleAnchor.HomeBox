import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoginView } from "../components/auth/LoginView";
import { NotificationsDashboardView } from "../components/dashboard/NotificationsDashboardView";
import { OnboardingView } from "../components/onboarding/OnboardingView";

describe("critical screen accessibility baselines", () => {
  it("login screen includes labelled auth inputs and status region", () => {
    const html = renderToStaticMarkup(
      <LoginView
        shellHeader={<header>Header</header>}
        session={null}
        email="resident@example.com"
        code=""
        loginFieldErrors={{}}
        loading={false}
        statusMessage="Ready"
        onEmailChange={() => {}}
        onCodeChange={() => {}}
        onRequestCode={async () => {}}
        onVerifyCode={async () => {}}
        onRefreshSession={async () => {}}
        onLogout={async () => {}}
        formatDisplayDateTime={() => "-"}
      />,
    );

    expect(html).toContain('for="email-login"');
    expect(html).toContain('id="email-login"');
    expect(html).toContain('for="code-login"');
    expect(html).toContain('id="code-login"');
    expect(html).toContain('role="status"');
    expect(html).toContain("<main");
  });

  it("onboarding and notifications screens expose headings and status regions", () => {
    const onboarding = renderToStaticMarkup(
      <OnboardingView
        shellHeader={<header>Header</header>}
        loading={false}
        activeTerms={null}
        termsMessage="Terms idle"
        profileMessage="Profile idle"
        utilitySetupMessage="Utility idle"
        progressMessage="Progress idle"
        onboardingProgress={null}
        surname=""
        dateOfBirth=""
        flatNumber=""
        mobileNumber=""
        moveInDate=""
        openingColdWaterReading=""
        openingHotWaterReading=""
        openingElectricityReading=""
        initialWaterTariffPerUnit=""
        initialElectricityTariffPerUnit=""
        boilerKwhPerCubicMeter=""
        boilerEfficiencyPercent=""
        profileFieldErrors={{}}
        utilityFieldErrors={{}}
        getFieldErrors={() => []}
        onLoadActiveTerms={async () => {}}
        onAcceptTerms={async () => {}}
        onSubmitProfile={async () => {}}
        onSubmitUtilitySetup={async () => {}}
        onLoadOnboardingProgress={async () => {}}
        onSurnameChange={() => {}}
        onDateOfBirthChange={() => {}}
        onFlatNumberChange={() => {}}
        onMobileNumberChange={() => {}}
        onMoveInDateChange={() => {}}
        onOpeningColdWaterReadingChange={() => {}}
        onOpeningHotWaterReadingChange={() => {}}
        onOpeningElectricityReadingChange={() => {}}
        onInitialWaterTariffPerUnitChange={() => {}}
        onInitialElectricityTariffPerUnitChange={() => {}}
        onBoilerKwhPerCubicMeterChange={() => {}}
        onBoilerEfficiencyPercentChange={() => {}}
      />,
    );

    const notifications = renderToStaticMarkup(
      <NotificationsDashboardView
        shellHeader={<header>Header</header>}
        routeTabs={<nav>Tabs</nav>}
        loading={false}
        notificationMessage="No notification action run yet."
        pushConfig={{
          pushEnabled: false,
          deepLinkPath: "/dashboard/readings",
        }}
        preferences={null}
        subscriptions={[]}
        reminderJobs={[]}
        onLoadPreferences={async () => {}}
        onSavePreferences={async () => {}}
        onLoadSubscriptions={async () => {}}
        onLoadReminderJobs={async () => {}}
        onSubscribePush={async () => {}}
        onUnsubscribePush={async () => {}}
        onSendTestNotification={async () => {}}
        onTimeZoneIdChange={() => {}}
        onEmailRemindersEnabledChange={() => {}}
        onPushRemindersEnabledChange={() => {}}
        onReadingReminderEnabledChange={() => {}}
        formatDisplayDateTime={() => "-"}
      />,
    );

    expect(onboarding).toContain("<h1");
    expect(onboarding).toContain('role="status"');
    expect(notifications).toContain("<h1");
    expect(notifications).toContain('role="status"');
  });
});
