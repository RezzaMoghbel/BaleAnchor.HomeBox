import type { ReactNode } from "react";
import { AdminAccountStatusCard } from "./admin/AdminAccountStatusCard";
import { AdminApprovalActionsCard } from "./admin/AdminApprovalActionsCard";
import { AdminSupportAccessCard } from "./admin/AdminSupportAccessCard";
import type {
  AdminBillingContextResponse,
  AdminUserSummaryItem,
  AuditLogSummaryItem,
  FlatSummaryItem,
  PendingApprovalUserItem,
  TenancySummaryItem,
  TenantGapAllocationSummaryItem,
  TermsAcceptanceSummaryItem,
  TermsVersionSummaryItem,
} from "../../shared/contracts";

interface AdminDashboardViewProps {
  shellHeader: ReactNode;
  routeTabs: ReactNode;
  adminRouteTabs: ReactNode;
  adminSection:
    | "account"
    | "account-access"
    | "settings"
    | "system-auth"
    | "approvals"
    | "search"
    | "flat-register";
  loading: boolean;
  currentUserRole: string;
  adminTargetUserId: string;
  adminReason: string;
  adminRoleTarget: string;
  adminMessage: string;
  adminUsers: AdminUserSummaryItem[];
  adminSearchQuery: string;
  adminSearchStatus: string;
  adminBillingOnDate: string;
  adminBillingContext: AdminBillingContextResponse | null;
  adminTariffEffectiveFromDate: string;
  adminWaterTariffPerUnit: string;
  adminWaterStandingChargePerDay: string;
  adminWaterVatPercent: string;
  adminElectricityTariffPerUnit: string;
  adminElectricityStandingChargePerDay: string;
  adminElectricityVatPercent: string;
  adminBoilerKwhPerCubicMeter: string;
  adminBoilerEfficiencyPercent: string;
  termsVersionLabel: string;
  termsVersionTitle: string;
  termsContentMarkdown: string;
  termsEffectiveFromUtc: string;
  termsFilterUserId: string;
  termsFilterVersionId: string;
  termsVersions: TermsVersionSummaryItem[];
  termsAcceptances: TermsAcceptanceSummaryItem[];
  auditActorUserId: string;
  auditTargetUserId: string;
  auditCategory: string;
  auditAction: string;
  auditEntries: AuditLogSummaryItem[];
  flats: FlatSummaryItem[];
  flatNumberInput: string;
  flatLabelInput: string;
  flatIsActiveInput: boolean;
  tenancies: TenancySummaryItem[];
  tenancyIdInput: string;
  tenancyUserIdInput: string;
  tenancyFlatNumberInput: string;
  tenancyMoveInDateInput: string;
  tenancyMoveOutDateInput: string;
  tenancyStatusInput: string;
  tenancyNotesInput: string;
  tenancyFilterUserId: string;
  tenancyFilterFlatNumber: string;
  tenantGaps: TenantGapAllocationSummaryItem[];
  gapFlatNumberInput: string;
  gapFromDateInput: string;
  gapToDateExclusiveInput: string;
  gapAssignedUserIdInput: string;
  gapAmountInput: string;
  gapStatusInput: string;
  gapFilterFlatNumber: string;
  pendingApprovals: PendingApprovalUserItem[];
  authOtpEnabled: boolean;
  authAllowLocalFixedOtp: boolean;
  authFixedOtpCode: string;
  authLocalDomains: string;
  emailTransportMode: string;
  emailFromName: string;
  emailFromAddress: string;
  emailSmtpHost: string;
  emailSmtpPort: string;
  emailSmtpUseSsl: boolean;
  emailSmtpUsername: string;
  emailSmtpPassword: string;
  emailTestRecipient: string;
  onAdminSearchQueryChange: (value: string) => void;
  onAdminSearchStatusChange: (value: string) => void;
  onAdminTargetUserIdChange: (value: string) => void;
  onAdminReasonChange: (value: string) => void;
  onAdminRoleTargetChange: (value: string) => void;
  onAdminBillingOnDateChange: (value: string) => void;
  onAdminTariffEffectiveFromDateChange: (value: string) => void;
  onAdminWaterTariffPerUnitChange: (value: string) => void;
  onAdminWaterStandingChargePerDayChange: (value: string) => void;
  onAdminWaterVatPercentChange: (value: string) => void;
  onAdminElectricityTariffPerUnitChange: (value: string) => void;
  onAdminElectricityStandingChargePerDayChange: (value: string) => void;
  onAdminElectricityVatPercentChange: (value: string) => void;
  onAdminBoilerKwhPerCubicMeterChange: (value: string) => void;
  onAdminBoilerEfficiencyPercentChange: (value: string) => void;
  onTermsVersionLabelChange: (value: string) => void;
  onTermsVersionTitleChange: (value: string) => void;
  onTermsContentMarkdownChange: (value: string) => void;
  onTermsEffectiveFromUtcChange: (value: string) => void;
  onTermsFilterUserIdChange: (value: string) => void;
  onTermsFilterVersionIdChange: (value: string) => void;
  onAuditActorUserIdChange: (value: string) => void;
  onAuditTargetUserIdChange: (value: string) => void;
  onAuditCategoryChange: (value: string) => void;
  onAuditActionChange: (value: string) => void;
  onFlatNumberInputChange: (value: string) => void;
  onFlatLabelInputChange: (value: string) => void;
  onFlatIsActiveInputChange: (value: boolean) => void;
  onTenancyIdInputChange: (value: string) => void;
  onTenancyUserIdInputChange: (value: string) => void;
  onTenancyFlatNumberInputChange: (value: string) => void;
  onTenancyMoveInDateInputChange: (value: string) => void;
  onTenancyMoveOutDateInputChange: (value: string) => void;
  onTenancyStatusInputChange: (value: string) => void;
  onTenancyNotesInputChange: (value: string) => void;
  onTenancyFilterUserIdChange: (value: string) => void;
  onTenancyFilterFlatNumberChange: (value: string) => void;
  onGapFlatNumberInputChange: (value: string) => void;
  onGapFromDateInputChange: (value: string) => void;
  onGapToDateExclusiveInputChange: (value: string) => void;
  onGapAssignedUserIdInputChange: (value: string) => void;
  onGapAmountInputChange: (value: string) => void;
  onGapStatusInputChange: (value: string) => void;
  onGapFilterFlatNumberChange: (value: string) => void;
  onAuthOtpEnabledChange: (value: boolean) => void;
  onAuthAllowLocalFixedOtpChange: (value: boolean) => void;
  onAuthFixedOtpCodeChange: (value: string) => void;
  onAuthLocalDomainsChange: (value: string) => void;
  onEmailTransportModeChange: (value: string) => void;
  onEmailFromNameChange: (value: string) => void;
  onEmailFromAddressChange: (value: string) => void;
  onEmailSmtpHostChange: (value: string) => void;
  onEmailSmtpPortChange: (value: string) => void;
  onEmailSmtpUseSslChange: (value: boolean) => void;
  onEmailSmtpUsernameChange: (value: string) => void;
  onEmailSmtpPasswordChange: (value: string) => void;
  onEmailTestRecipientChange: (value: string) => void;
  onLoadPendingApprovals: () => Promise<void>;
  onLoadSystemSettings: () => Promise<void>;
  onSaveAuthAccessSettings: () => Promise<void>;
  onSaveEmailTransportSettings: () => Promise<void>;
  onSendEmailTransportTest: () => Promise<void>;
  onSearchAdminUsers: () => Promise<void>;
  onLoadAdminBillingContext: (targetUserIdOverride?: string) => Promise<void>;
  onOpenAccountFromSearch: (
    targetUserId: string,
    expectedEmail?: string,
  ) => Promise<void>;
  onDeleteAdminLatestReading: () => Promise<void>;
  onUpsertAdminTariff: () => Promise<void>;
  onUpdateAdminBoilerAssumptions: () => Promise<void>;
  onLoadTermsVersions: () => Promise<void>;
  onPublishTermsVersion: () => Promise<void>;
  onLoadTermsAcceptances: () => Promise<void>;
  onLoadAuditLogs: () => Promise<void>;
  onLoadSupportLifecycleAuditLogs: () => Promise<void>;
  onLoadFlats: () => Promise<void>;
  onUpsertFlat: () => Promise<void>;
  onLoadTenancies: () => Promise<void>;
  onUpsertTenancy: () => Promise<void>;
  onBeginTenancyEdit: (item: TenancySummaryItem) => void;
  onClearTenancyForm: () => void;
  onLoadTenantGaps: () => Promise<void>;
  onUpsertTenantGap: () => Promise<void>;
  onBeginTenantGapEdit: (item: TenantGapAllocationSummaryItem) => void;
  onClearTenantGapForm: () => void;
  onSubmitAdminDecision: (action: "approve" | "reject") => Promise<void>;
  onSubmitRoleChange: () => Promise<void>;
  onSubmitAdminLifecycleAction: (
    action: "suspend" | "move-to-onboarding" | "reinstate-approved" | "archive",
  ) => Promise<void>;
  onHardDeleteAdminUser: () => Promise<void>;
  onStartDelegatedSupportSession: (request: {
    targetUserId: string;
    reason: string;
    expectedEmail?: string;
    expectedFlatNumber?: string;
    expectedDateOfBirth?: string;
  }) => Promise<boolean>;
  formatDisplayDateTime: (value?: string) => string;
}

export function AdminDashboardView({
  shellHeader,
  routeTabs,
  adminRouteTabs,
  adminSection,
  loading,
  currentUserRole,
  adminTargetUserId,
  adminReason,
  adminRoleTarget,
  adminMessage,
  adminUsers,
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
  pendingApprovals,
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
  onAdminSearchQueryChange,
  onAdminSearchStatusChange,
  onAdminTargetUserIdChange,
  onAdminReasonChange,
  onAdminRoleTargetChange,
  onAdminBillingOnDateChange,
  onAdminTariffEffectiveFromDateChange,
  onAdminWaterTariffPerUnitChange,
  onAdminWaterStandingChargePerDayChange,
  onAdminWaterVatPercentChange,
  onAdminElectricityTariffPerUnitChange,
  onAdminElectricityStandingChargePerDayChange,
  onAdminElectricityVatPercentChange,
  onAdminBoilerKwhPerCubicMeterChange,
  onAdminBoilerEfficiencyPercentChange,
  onTermsVersionLabelChange,
  onTermsVersionTitleChange,
  onTermsContentMarkdownChange,
  onTermsEffectiveFromUtcChange,
  onTermsFilterUserIdChange,
  onTermsFilterVersionIdChange,
  onAuditActorUserIdChange,
  onAuditTargetUserIdChange,
  onAuditCategoryChange,
  onAuditActionChange,
  onFlatNumberInputChange,
  onFlatLabelInputChange,
  onFlatIsActiveInputChange,
  onTenancyIdInputChange,
  onTenancyUserIdInputChange,
  onTenancyFlatNumberInputChange,
  onTenancyMoveInDateInputChange,
  onTenancyMoveOutDateInputChange,
  onTenancyStatusInputChange,
  onTenancyNotesInputChange,
  onTenancyFilterUserIdChange,
  onTenancyFilterFlatNumberChange,
  onGapFlatNumberInputChange,
  onGapFromDateInputChange,
  onGapToDateExclusiveInputChange,
  onGapAssignedUserIdInputChange,
  onGapAmountInputChange,
  onGapStatusInputChange,
  onGapFilterFlatNumberChange,
  onAuthOtpEnabledChange,
  onAuthAllowLocalFixedOtpChange,
  onAuthFixedOtpCodeChange,
  onAuthLocalDomainsChange,
  onEmailTransportModeChange,
  onEmailFromNameChange,
  onEmailFromAddressChange,
  onEmailSmtpHostChange,
  onEmailSmtpPortChange,
  onEmailSmtpUseSslChange,
  onEmailSmtpUsernameChange,
  onEmailSmtpPasswordChange,
  onEmailTestRecipientChange,
  onLoadPendingApprovals,
  onLoadSystemSettings,
  onSaveAuthAccessSettings,
  onSaveEmailTransportSettings,
  onSendEmailTransportTest,
  onSearchAdminUsers,
  onLoadAdminBillingContext,
  onOpenAccountFromSearch,
  onDeleteAdminLatestReading,
  onUpsertAdminTariff,
  onUpdateAdminBoilerAssumptions,
  onLoadTermsVersions,
  onPublishTermsVersion,
  onLoadTermsAcceptances,
  onLoadAuditLogs,
  onLoadSupportLifecycleAuditLogs,
  onLoadFlats,
  onUpsertFlat,
  onLoadTenancies,
  onUpsertTenancy,
  onBeginTenancyEdit,
  onClearTenancyForm,
  onLoadTenantGaps,
  onUpsertTenantGap,
  onBeginTenantGapEdit,
  onClearTenantGapForm,
  onSubmitAdminDecision,
  onSubmitRoleChange,
  onSubmitAdminLifecycleAction,
  onHardDeleteAdminUser,
  onStartDelegatedSupportSession,
  formatDisplayDateTime,
}: AdminDashboardViewProps) {
  const isSuperAdmin = currentUserRole.trim().toLowerCase() === "superadmin";
  const showAccount = adminSection === "account";
  const showAccountAccess = adminSection === "account-access";
  const showSettings = adminSection === "settings";
  const showSystemAuth = adminSection === "system-auth";
  const showApprovals = adminSection === "approvals";
  const showSearch = adminSection === "search";
  const showFlatRegister = adminSection === "flat-register";

  return (
    <div className="wrapper">
      {shellHeader}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Admin workspace</h1>
              <p className="hero-copy mb-0">
                Role-bound area for approval, tenancy, and audit workflows. This
                route is visible only to Admin and SuperAdmin sessions.
              </p>
            </div>
          </section>

          {routeTabs}
          {adminRouteTabs}

          {showAccountAccess && (
            <AdminSupportAccessCard
              loading={loading}
              isSuperAdmin={isSuperAdmin}
              adminTargetUserId={adminTargetUserId}
              adminReason={adminReason}
              adminUsers={adminUsers}
              onAdminTargetUserIdChange={onAdminTargetUserIdChange}
              onAdminSearchQueryChange={onAdminSearchQueryChange}
              onAdminSearchStatusChange={onAdminSearchStatusChange}
              onSearchAdminUsers={onSearchAdminUsers}
              onStartDelegatedSupportSession={onStartDelegatedSupportSession}
            />
          )}

          {showAccount && (
            <AdminAccountStatusCard
              loading={loading}
              pendingApprovals={pendingApprovals}
              adminUsers={adminUsers}
              onLoadPendingApprovals={onLoadPendingApprovals}
              onAdminSearchStatusChange={onAdminSearchStatusChange}
              onSearchAdminUsers={onSearchAdminUsers}
            />
          )}

          {showSettings && (
            <div className="card radius-10 border-0 shadow-sm">
              <div className="card-body">
                <h5 className="mb-3">System auth and SMTP settings</h5>
                <p className="text-secondary mb-3">
                  SuperAdmin controls for OTP mode and SMTP runtime transport.
                  Changes are persisted in the SystemSettings collection and are
                  audited automatically.
                </p>

                <div className="d-flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => void onLoadSystemSettings()}
                    disabled={loading}
                  >
                    Refresh system settings
                  </button>
                </div>

                <section className="border rounded-3 p-3 mb-3">
                  <h6 className="mb-3">OTP settings</h6>
                  <div className="row g-3 align-items-end">
                    <div className="col-12 col-md-3">
                      <label className="form-label">OTP enabled</label>
                      <select
                        className="form-select"
                        value={authOtpEnabled ? "on" : "off"}
                        onChange={(event) =>
                          onAuthOtpEnabledChange(event.target.value === "on")
                        }
                      >
                        <option value="on">On</option>
                        <option value="off">Off</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label">
                        Allow .local fixed OTP
                      </label>
                      <select
                        className="form-select"
                        value={authAllowLocalFixedOtp ? "on" : "off"}
                        onChange={(event) =>
                          onAuthAllowLocalFixedOtpChange(
                            event.target.value === "on",
                          )
                        }
                      >
                        <option value="on">On</option>
                        <option value="off">Off</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label">Fixed OTP code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={authFixedOtpCode}
                        onChange={(event) =>
                          onAuthFixedOtpCodeChange(event.target.value)
                        }
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label">Local OTP domains</label>
                      <input
                        type="text"
                        className="form-control"
                        value={authLocalDomains}
                        onChange={(event) =>
                          onAuthLocalDomainsChange(event.target.value)
                        }
                        placeholder="baleanchor.local"
                      />
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void onSaveAuthAccessSettings()}
                      disabled={loading}
                    >
                      Save OTP settings
                    </button>
                  </div>
                </section>

                <section className="border rounded-3 p-3 mb-3">
                  <h6 className="mb-3">SMTP settings</h6>
                  <div className="row g-3 align-items-end">
                    <div className="col-12 col-md-2">
                      <label className="form-label">Email mode</label>
                      <select
                        className="form-select"
                        value={emailTransportMode}
                        onChange={(event) =>
                          onEmailTransportModeChange(event.target.value)
                        }
                      >
                        <option value="smtp">smtp</option>
                        <option value="log">log</option>
                        <option value="off">off</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label">From name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={emailFromName}
                        onChange={(event) =>
                          onEmailFromNameChange(event.target.value)
                        }
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label">From address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={emailFromAddress}
                        onChange={(event) =>
                          onEmailFromAddressChange(event.target.value)
                        }
                      />
                    </div>
                    <div className="col-12 col-md-2">
                      <label className="form-label">SMTP host</label>
                      <input
                        type="text"
                        className="form-control"
                        value={emailSmtpHost}
                        onChange={(event) =>
                          onEmailSmtpHostChange(event.target.value)
                        }
                      />
                    </div>
                    <div className="col-12 col-md-2">
                      <label className="form-label">SMTP port</label>
                      <input
                        type="text"
                        className="form-control"
                        value={emailSmtpPort}
                        onChange={(event) =>
                          onEmailSmtpPortChange(event.target.value)
                        }
                      />
                    </div>
                    <div className="col-12 col-md-2">
                      <label className="form-label">Use SSL</label>
                      <select
                        className="form-select"
                        value={emailSmtpUseSsl ? "on" : "off"}
                        onChange={(event) =>
                          onEmailSmtpUseSslChange(event.target.value === "on")
                        }
                      >
                        <option value="on">On</option>
                        <option value="off">Off</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">SMTP username</label>
                      <input
                        type="text"
                        className="form-control"
                        value={emailSmtpUsername}
                        onChange={(event) =>
                          onEmailSmtpUsernameChange(event.target.value)
                        }
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">
                        SMTP password (new value)
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={emailSmtpPassword}
                        onChange={(event) =>
                          onEmailSmtpPasswordChange(event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void onSaveEmailTransportSettings()}
                      disabled={loading}
                    >
                      Save email settings
                    </button>
                  </div>
                </section>

                <section className="border rounded-3 p-3 mb-3">
                  <h6 className="mb-3">SMTP test</h6>
                  <div className="row g-3 align-items-end">
                    <div className="col-12 col-md-6">
                      <label className="form-label">SMTP test recipient</label>
                      <input
                        type="email"
                        className="form-control"
                        value={emailTestRecipient}
                        onChange={(event) =>
                          onEmailTestRecipientChange(event.target.value)
                        }
                        placeholder="recipient@example.com"
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => void onSendEmailTransportTest()}
                        disabled={loading}
                      >
                        Send SMTP test email
                      </button>
                    </div>
                  </div>
                </section>

                <div
                  className="alert alert-light border mt-3 mb-0"
                  role="status"
                >
                  <div className="fw-semibold mb-1">System settings status</div>
                  <div>{adminMessage}</div>
                </div>
              </div>
            </div>
          )}

          {showApprovals && (
            <AdminApprovalActionsCard
              loading={loading}
              currentUserRole={currentUserRole}
              adminTargetUserId={adminTargetUserId}
              adminReason={adminReason}
              adminRoleTarget={adminRoleTarget}
              adminMessage={adminMessage}
              pendingApprovals={pendingApprovals}
              onAdminTargetUserIdChange={onAdminTargetUserIdChange}
              onAdminReasonChange={onAdminReasonChange}
              onAdminRoleTargetChange={onAdminRoleTargetChange}
              onLoadPendingApprovals={onLoadPendingApprovals}
              onSubmitAdminDecision={onSubmitAdminDecision}
              onSubmitRoleChange={onSubmitRoleChange}
              onSubmitAdminLifecycleAction={onSubmitAdminLifecycleAction}
              onHardDeleteAdminUser={onHardDeleteAdminUser}
            />
          )}

          {showSearch && (
            <div className="card radius-10 border-0 shadow-sm mt-4">
              <div className="card-body">
                <h5 className="mb-3">
                  Search users and target account context
                </h5>
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-lg-5">
                    <label htmlFor="adminSearchQuery" className="form-label">
                      Search query
                    </label>
                    <input
                      id="adminSearchQuery"
                      type="text"
                      className="form-control"
                      placeholder="email, user id, flat"
                      value={adminSearchQuery}
                      onChange={(event) =>
                        onAdminSearchQueryChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <label htmlFor="adminSearchStatus" className="form-label">
                      Status filter
                    </label>
                    <input
                      id="adminSearchStatus"
                      type="text"
                      className="form-control"
                      placeholder="Active"
                      value={adminSearchStatus}
                      onChange={(event) =>
                        onAdminSearchStatusChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-4">
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      onClick={() => void onSearchAdminUsers()}
                      disabled={loading}
                    >
                      Search users
                    </button>
                  </div>
                </div>

                {adminUsers.length > 0 && (
                  <div className="table-responsive mt-3">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>User ID</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Flat</th>
                          <th>Updated</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.slice(0, 20).map((item) => (
                          <tr key={item.userId}>
                            <td>{item.userId}</td>
                            <td>{item.email}</td>
                            <td>{item.role}</td>
                            <td>{item.status}</td>
                            <td>{item.flatNumber ?? "-"}</td>
                            <td>{formatDisplayDateTime(item.updatedAtUtc)}</td>
                            <td className="text-end">
                              <div className="d-inline-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() =>
                                    void onLoadAdminBillingContext(item.userId)
                                  }
                                  disabled={loading}
                                >
                                  Select
                                </button>
                                {isSuperAdmin && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-dark btn-sm"
                                    onClick={() =>
                                      void onOpenAccountFromSearch(
                                        item.userId,
                                        item.email,
                                      )
                                    }
                                    disabled={loading}
                                  >
                                    Open account
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="row g-3 align-items-end mt-2">
                  <div className="col-12 col-lg-3">
                    <label htmlFor="adminBillingOnDate" className="form-label">
                      Billing context date
                    </label>
                    <input
                      id="adminBillingOnDate"
                      type="date"
                      className="form-control"
                      value={adminBillingOnDate}
                      onChange={(event) =>
                        onAdminBillingOnDateChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => void onLoadAdminBillingContext()}
                      disabled={loading}
                    >
                      Load billing context
                    </button>
                  </div>
                  <div className="col-12 col-lg-3">
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => void onDeleteAdminLatestReading()}
                      disabled={loading}
                    >
                      Delete latest reading
                    </button>
                  </div>
                </div>

                {adminBillingContext && (
                  <div
                    className="alert alert-light border mt-3 mb-0"
                    role="status"
                  >
                    <div className="fw-semibold mb-1">
                      Target billing context
                    </div>
                    <div className="small text-secondary">
                      Latest reading:{" "}
                      {adminBillingContext.latestReadingDate ?? "N/A"}
                      {` | Latest payment: ${adminBillingContext.latestPaymentAmount ?? "N/A"}`}
                      {` | Tariff from: ${adminBillingContext.activeTariffEffectiveFromDate ?? "N/A"}`}
                      {` | Boiler efficiency: ${adminBillingContext.boilerEfficiencyPercent ?? "N/A"}`}
                    </div>
                  </div>
                )}

                <h6 className="mt-4">Target tariff management</h6>
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-lg-2">
                    <input
                      type="date"
                      className="form-control"
                      value={adminTariffEffectiveFromDate}
                      onChange={(event) =>
                        onAdminTariffEffectiveFromDateChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Water unit"
                      value={adminWaterTariffPerUnit}
                      onChange={(event) =>
                        onAdminWaterTariffPerUnitChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Water standing"
                      value={adminWaterStandingChargePerDay}
                      onChange={(event) =>
                        onAdminWaterStandingChargePerDayChange(
                          event.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Water VAT"
                      value={adminWaterVatPercent}
                      onChange={(event) =>
                        onAdminWaterVatPercentChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Elec unit"
                      value={adminElectricityTariffPerUnit}
                      onChange={(event) =>
                        onAdminElectricityTariffPerUnitChange(
                          event.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Elec standing"
                      value={adminElectricityStandingChargePerDay}
                      onChange={(event) =>
                        onAdminElectricityStandingChargePerDayChange(
                          event.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Elec VAT"
                      value={adminElectricityVatPercent}
                      onChange={(event) =>
                        onAdminElectricityVatPercentChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => void onUpsertAdminTariff()}
                      disabled={loading}
                    >
                      Save target tariff
                    </button>
                  </div>
                </div>

                <h6 className="mt-4">Boiler assumptions management</h6>
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-lg-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="kWh per m3"
                      value={adminBoilerKwhPerCubicMeter}
                      onChange={(event) =>
                        onAdminBoilerKwhPerCubicMeterChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Efficiency %"
                      value={adminBoilerEfficiencyPercent}
                      onChange={(event) =>
                        onAdminBoilerEfficiencyPercentChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => void onUpdateAdminBoilerAssumptions()}
                      disabled={loading}
                    >
                      Update boiler assumptions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showFlatRegister && (
            <div className="card radius-10 border-0 shadow-sm mt-4">
              <div className="card-body">
                <h5 className="mb-3">Flat register management</h5>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => void onLoadFlats()}
                    disabled={loading}
                  >
                    Load flats
                  </button>
                </div>

                <div className="row g-3 align-items-end">
                  <div className="col-12 col-lg-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Flat number"
                      value={flatNumberInput}
                      onChange={(event) =>
                        onFlatNumberInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Flat label"
                      value={flatLabelInput}
                      onChange={(event) =>
                        onFlatLabelInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <div className="form-check mt-2">
                      <input
                        id="flatIsActiveInput"
                        type="checkbox"
                        className="form-check-input"
                        checked={flatIsActiveInput}
                        onChange={(event) =>
                          onFlatIsActiveInputChange(event.target.checked)
                        }
                      />
                      <label
                        htmlFor="flatIsActiveInput"
                        className="form-check-label"
                      >
                        Active
                      </label>
                    </div>
                  </div>
                  <div className="col-12 col-lg-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => void onUpsertFlat()}
                      disabled={loading}
                    >
                      Save flat
                    </button>
                  </div>
                </div>

                {flats.length > 0 && (
                  <div className="table-responsive mt-3">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Flat</th>
                          <th>Label</th>
                          <th>Active</th>
                          <th>Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flats.slice(0, 50).map((item) => (
                          <tr key={item.flatNumber}>
                            <td>{item.flatNumber}</td>
                            <td>{item.label}</td>
                            <td>{item.isActive ? "Yes" : "No"}</td>
                            <td>{formatDisplayDateTime(item.updatedAtUtc)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {showFlatRegister && (
            <div className="card radius-10 border-0 shadow-sm mt-4">
              <div className="card-body">
                <h5 className="mb-3">Tenancy management</h5>
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-lg-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filter user ID"
                      value={tenancyFilterUserId}
                      onChange={(event) =>
                        onTenancyFilterUserIdChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filter flat number"
                      value={tenancyFilterFlatNumber}
                      onChange={(event) =>
                        onTenancyFilterFlatNumberChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      onClick={() => void onLoadTenancies()}
                      disabled={loading}
                    >
                      Load tenancies
                    </button>
                  </div>
                </div>

                <div className="row g-3 align-items-end mt-2">
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tenancy ID (edit)"
                      value={tenancyIdInput}
                      onChange={(event) =>
                        onTenancyIdInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="User ID"
                      value={tenancyUserIdInput}
                      onChange={(event) =>
                        onTenancyUserIdInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Flat number"
                      value={tenancyFlatNumberInput}
                      onChange={(event) =>
                        onTenancyFlatNumberInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="date"
                      className="form-control"
                      value={tenancyMoveInDateInput}
                      onChange={(event) =>
                        onTenancyMoveInDateInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="date"
                      className="form-control"
                      value={tenancyMoveOutDateInput}
                      onChange={(event) =>
                        onTenancyMoveOutDateInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Status"
                      value={tenancyStatusInput}
                      onChange={(event) =>
                        onTenancyStatusInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Notes"
                      value={tenancyNotesInput}
                      onChange={(event) =>
                        onTenancyNotesInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => void onUpsertTenancy()}
                        disabled={loading}
                      >
                        {tenancyIdInput ? "Update tenancy" : "Save tenancy"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={onClearTenancyForm}
                        disabled={loading}
                      >
                        Clear form
                      </button>
                    </div>
                  </div>
                </div>

                {tenancies.length > 0 && (
                  <div className="table-responsive mt-3">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Tenancy ID</th>
                          <th>User</th>
                          <th>Flat</th>
                          <th>Move-in</th>
                          <th>Move-out</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenancies.slice(0, 50).map((item) => (
                          <tr key={item.tenancyId}>
                            <td>{item.tenancyId}</td>
                            <td>{item.userId}</td>
                            <td>{item.flatNumber}</td>
                            <td>{item.moveInDate}</td>
                            <td>{item.moveOutDate ?? "-"}</td>
                            <td>{item.status}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => onBeginTenancyEdit(item)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {showFlatRegister && (
            <div className="card radius-10 border-0 shadow-sm mt-4">
              <div className="card-body">
                <h5 className="mb-3">Tenant-gap allocation management</h5>
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-lg-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filter flat number"
                      value={gapFilterFlatNumber}
                      onChange={(event) =>
                        onGapFilterFlatNumberChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      onClick={() => void onLoadTenantGaps()}
                      disabled={loading}
                    >
                      Load gap allocations
                    </button>
                  </div>
                </div>

                <div className="row g-3 align-items-end mt-2">
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Flat number"
                      value={gapFlatNumberInput}
                      onChange={(event) =>
                        onGapFlatNumberInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="date"
                      className="form-control"
                      value={gapFromDateInput}
                      onChange={(event) =>
                        onGapFromDateInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="date"
                      className="form-control"
                      value={gapToDateExclusiveInput}
                      onChange={(event) =>
                        onGapToDateExclusiveInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Assigned user ID"
                      value={gapAssignedUserIdInput}
                      onChange={(event) =>
                        onGapAssignedUserIdInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Amount"
                      value={gapAmountInput}
                      onChange={(event) =>
                        onGapAmountInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Status"
                      value={gapStatusInput}
                      onChange={(event) =>
                        onGapStatusInputChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => void onUpsertTenantGap()}
                        disabled={loading}
                      >
                        Save gap allocation
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={onClearTenantGapForm}
                        disabled={loading}
                      >
                        Clear form
                      </button>
                    </div>
                  </div>
                </div>

                {tenantGaps.length > 0 && (
                  <div className="table-responsive mt-3">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Allocation ID</th>
                          <th>Flat</th>
                          <th>From</th>
                          <th>To (exclusive)</th>
                          <th>Assigned user</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenantGaps.slice(0, 50).map((item) => (
                          <tr key={item.allocationId}>
                            <td>{item.allocationId}</td>
                            <td>{item.flatNumber}</td>
                            <td>{item.fromDate}</td>
                            <td>{item.toDateExclusive}</td>
                            <td>{item.assignedUserId}</td>
                            <td>{item.amount}</td>
                            <td>{item.status}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => onBeginTenantGapEdit(item)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {showSystemAuth && (
            <div className="card radius-10 border-0 shadow-sm mt-4">
              <div className="card-body">
                <h5 className="mb-3">Terms and declarations management</h5>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => void onLoadTermsVersions()}
                    disabled={loading}
                  >
                    Load terms versions
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => void onLoadTermsAcceptances()}
                    disabled={loading}
                  >
                    Load acceptances
                  </button>
                </div>

                <div className="row g-3 align-items-end">
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Version label"
                      value={termsVersionLabel}
                      onChange={(event) =>
                        onTermsVersionLabelChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Title"
                      value={termsVersionTitle}
                      onChange={(event) =>
                        onTermsVersionTitleChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Effective UTC (ISO)"
                      value={termsEffectiveFromUtc}
                      onChange={(event) =>
                        onTermsEffectiveFromUtcChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-4">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => void onPublishTermsVersion()}
                      disabled={loading}
                    >
                      Publish terms version
                    </button>
                  </div>
                  <div className="col-12">
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Terms markdown"
                      value={termsContentMarkdown}
                      onChange={(event) =>
                        onTermsContentMarkdownChange(event.target.value)
                      }
                    />
                  </div>
                </div>

                {termsVersions.length > 0 && (
                  <div className="table-responsive mt-3">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Version</th>
                          <th>Title</th>
                          <th>Effective</th>
                          <th>Published</th>
                          <th>Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {termsVersions.slice(0, 10).map((item) => (
                          <tr key={item.versionId}>
                            <td>{item.versionLabel}</td>
                            <td>{item.title}</td>
                            <td>
                              {formatDisplayDateTime(item.effectiveFromUtc)}
                            </td>
                            <td>
                              {formatDisplayDateTime(item.publishedAtUtc)}
                            </td>
                            <td>{item.isActive ? "Yes" : "No"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="row g-3 align-items-end mt-2">
                  <div className="col-12 col-lg-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Acceptance userId filter"
                      value={termsFilterUserId}
                      onChange={(event) =>
                        onTermsFilterUserIdChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-4">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Acceptance version filter"
                      value={termsFilterVersionId}
                      onChange={(event) =>
                        onTermsFilterVersionIdChange(event.target.value)
                      }
                    />
                  </div>
                </div>

                {termsAcceptances.length > 0 && (
                  <div className="table-responsive mt-3">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Version ID</th>
                          <th>Accepted</th>
                          <th>IP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {termsAcceptances.slice(0, 20).map((item) => (
                          <tr key={item.acceptanceId}>
                            <td>{item.userId}</td>
                            <td>{item.termsVersionId}</td>
                            <td>{formatDisplayDateTime(item.acceptedAtUtc)}</td>
                            <td>{item.acceptedFromIp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {showSystemAuth && (
            <div className="card radius-10 border-0 shadow-sm mt-4">
              <div className="card-body">
                <h5 className="mb-3">Audit viewer</h5>
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-lg-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Actor user ID"
                      value={auditActorUserId}
                      onChange={(event) =>
                        onAuditActorUserIdChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Target user ID"
                      value={auditTargetUserId}
                      onChange={(event) =>
                        onAuditTargetUserIdChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Category"
                      value={auditCategory}
                      onChange={(event) =>
                        onAuditCategoryChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Action"
                      value={auditAction}
                      onChange={(event) =>
                        onAuditActionChange(event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 col-lg-2">
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      onClick={() => void onLoadAuditLogs()}
                      disabled={loading}
                    >
                      Load audit logs
                    </button>
                  </div>
                  <div className="col-12 col-lg-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => void onLoadSupportLifecycleAuditLogs()}
                      disabled={loading}
                    >
                      Support & lifecycle
                    </button>
                  </div>
                </div>

                {auditEntries.length > 0 && (
                  <div className="table-responsive mt-3">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>UTC</th>
                          <th>Actor</th>
                          <th>Target</th>
                          <th>Category</th>
                          <th>Action</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditEntries.slice(0, 30).map((item) => (
                          <tr key={item.auditId}>
                            <td>{formatDisplayDateTime(item.createdAtUtc)}</td>
                            <td>{item.actorUserId}</td>
                            <td>{item.targetUserId}</td>
                            <td>{item.category}</td>
                            <td>{item.action}</td>
                            <td>{item.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {showApprovals && (
            <div className="card radius-10 border-0 shadow-sm mt-4">
              <div className="card-body">
                <h5 className="mb-3">Pending approvals</h5>
                {pendingApprovals.length === 0 ? (
                  <p className="text-secondary mb-0">
                    No pending approvals loaded yet.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>User ID</th>
                          <th>Email</th>
                          <th>Submitted state</th>
                          <th>Updated UTC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingApprovals.slice(0, 20).map((item) => (
                          <tr key={item.userId}>
                            <td>{item.userId}</td>
                            <td>{item.emailMasked}</td>
                            <td>{item.submittedState}</td>
                            <td>{formatDisplayDateTime(item.updatedAtUtc)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
