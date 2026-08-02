import type {
  AcceptTermsResponse,
  ActiveTariffResponse,
  BoilerAssumptionManagementResponse,
  ActiveBoilerAssumptionResponse,
  ActiveTermsResponse,
  AdminAuthAccessSettingsResponse,
  AdminEmailTransportSettingsResponse,
  AdminEmailTransportTestResponse,
  AdminActionResultResponse,
  AdminBillingContextResponse,
  AdminDecisionResponse,
  HardDeleteUserRequest,
  HardDeleteUserResponse,
  StartDelegatedSupportSessionRequest,
  StartDelegatedSupportSessionResponse,
  AdminRoleChangeResponse,
  AdminUserSearchResponse,
  AuthModeResponse,
  AllTimeBalanceResponse,
  AuditLogListResponse,
  CalculateLatestPeriodResponse,
  BoilerAssumptionOptionsResponse,
  CompleteProfileResponse,
  CompleteUtilitySetupResponse,
  DevelopmentSeedOperationResponse,
  DevelopmentSeedStatusResponse,
  DeletePaymentResponse,
  FlatListResponse,
  FieldErrors,
  LatestPeriodPaymentSummaryResponse,
  LatestReadingsResponse,
  LinkPaymentRequest,
  NotificationPreferencesResponse,
  OnboardingProgressResponse,
  OnboardingStateResponse,
  PaymentHistoryResponse,
  PendingApprovalListResponse,
  PushPublicConfigResponse,
  PushSubscriptionListResponse,
  PushSubscriptionResponse,
  ReminderJobListResponse,
  RecordLatestPeriodPaymentResponse,
  RequestCodeResponse,
  SendTestNotificationResponse,
  SessionStatusResponse,
  StatementExportHistoryResponse,
  StatementPeriodListResponse,
  StatementSummaryResponse,
  TariffManagementResponse,
  TariffOptionsResponse,
  SignupRequestCodeRequest,
  SubmitReadingsResponse,
  TenancyListResponse,
  TenantGapAllocationListResponse,
  TermsAcceptanceListResponse,
  TermsVersionListResponse,
  PublishTermsVersionResponse,
  UpdateAdminAuthAccessSettingsRequest,
  UpdateAdminEmailTransportSettingsRequest,
  SendAdminEmailTransportTestRequest,
  UpdateNotificationPreferencesRequest,
  UpdatePaymentResponse,
  UpsertPushSubscriptionRequest,
  UpsertTariffResponse,
  UpsertBoilerAssumptionVersionResponse,
  VerifyCodeResponse,
} from "../shared/contracts";
import { readProblemDetails } from "../shared/problemDetails";

export class PortalApiError extends Error {
  readonly errors: FieldErrors;

  constructor(message: string, errors: FieldErrors = {}) {
    super(message);
    this.name = "PortalApiError";
    this.errors = errors;
  }
}

interface RequestCodeRequest {
  email: string;
}

interface VerifyCodeRequest {
  email: string;
  code: string;
  purpose?: "login" | "signup";
}

interface PasswordLoginRequest {
  email: string;
  password: string;
}

interface CompleteProfileRequest {
  surname: string;
  dateOfBirth: string;
  flatNumber: string;
  mobileNumber: string;
}

interface CompleteUtilitySetupRequest {
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
  boilerKwhPerCubicMeter: string;
  boilerEfficiencyPercent: string;
}

interface AdminDecisionRequest {
  reason: string;
}

interface RoleChangeRequest {
  role: string;
  reason: string;
}

interface AdminTargetedTariffRequest {
  effectiveFromDate: string;
  waterTariffPerUnit: string;
  waterStandingChargePerDay: string;
  waterVatPercent: string;
  electricityTariffPerUnit: string;
  electricityStandingChargePerDay: string;
  electricityVatPercent: string;
  reason: string;
}

interface AdminTargetedBoilerAssumptionsRequest {
  boilerKwhPerCubicMeter: string;
  boilerEfficiencyPercent: string;
  reason: string;
}

interface PublishTermsVersionRequest {
  versionLabel: string;
  title: string;
  contentMarkdown: string;
  effectiveFromUtc: string;
  reason: string;
}

interface UpsertFlatRequest {
  flatNumber: string;
  label: string;
  isActive: boolean;
  reason: string;
}

interface UpsertTenancyRequest {
  tenancyId?: string;
  userId: string;
  flatNumber: string;
  moveInDate: string;
  moveOutDate?: string;
  status?: string;
  notes?: string;
  reason: string;
}

interface UpsertTenantGapAllocationRequest {
  flatNumber: string;
  fromDate: string;
  toDateExclusive: string;
  assignedUserId: string;
  amount: string;
  reason: string;
  status?: string;
}

type UpdateReminderPreferencesRequest = UpdateNotificationPreferencesRequest;

type SavePushSubscriptionRequest = UpsertPushSubscriptionRequest;

interface SubmitReadingsRequest {
  readingDate: string;
  coldWaterReading: string;
  hotWaterReading: string;
  electricityReading: string;
  tariffEffectiveFromDate?: string;
  boilerEffectiveFromDate?: string;
}

interface UpsertTariffRequest {
  effectiveFromDate: string;
  waterTariffPerUnit: string;
  waterStandingChargePerDay: string;
  waterVatPercent: string;
  electricityTariffPerUnit: string;
  electricityStandingChargePerDay: string;
  electricityVatPercent: string;
}

interface UpsertBoilerAssumptionVersionRequest {
  effectiveFromDate: string;
  hotWaterTemperatureCelsius: string;
  hotWaterHeatCapacity: string;
  hotWaterDensity: string;
  kiloJouleToKiloWattHourFactor: string;
  boilerKwhPerCubicMeter: string;
  boilerEfficiencyPercent: string;
}

interface RecordLatestPeriodPaymentRequest {
  amount: string;
  paymentDate: string;
  method: string;
  reference?: string;
  notes?: string;
}

interface RecordPeriodPaymentRequest {
  periodStartDate: string;
  periodEndDateExclusive: string;
  amount: string;
  paymentDate: string;
  method: string;
  reference?: string;
  notes?: string;
}

interface UpdatePaymentRequest {
  amount: string;
  paymentDate: string;
  method: string;
  reference?: string;
  notes?: string;
}

export interface StatementPdfExportResult {
  blob: Blob;
  exportId: string;
  suggestedName: string;
}

async function requestJson<TResponse>(
  input: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(input, init);

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new PortalApiError(problem.message, problem.errors);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

async function requestResponse(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new PortalApiError(problem.message, problem.errors);
  }

  return response;
}

export const portalClient = {
  signupRequestCode(request: SignupRequestCodeRequest) {
    return requestJson<RequestCodeResponse>(
      "/api/v1/auth/signup-request-code",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );
  },

  requestCode(request: RequestCodeRequest) {
    return requestJson<RequestCodeResponse>("/api/v1/auth/request-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  },

  verifyCode(request: VerifyCodeRequest) {
    return requestJson<VerifyCodeResponse>("/api/v1/auth/verify-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });
  },

  passwordLogin(request: PasswordLoginRequest) {
    return requestJson<VerifyCodeResponse>("/api/v1/auth/password-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });
  },

  getAuthMode() {
    return requestJson<AuthModeResponse>("/api/v1/auth/mode", {
      method: "GET",
    });
  },

  getSession() {
    return requestJson<SessionStatusResponse>("/api/v1/auth/session", {
      method: "GET",
      credentials: "include",
    });
  },

  getDevelopmentSeedStatus() {
    return requestJson<DevelopmentSeedStatusResponse>("/api/system/dev-seed", {
      method: "GET",
    });
  },

  reseedDevelopmentData() {
    return requestJson<DevelopmentSeedOperationResponse>(
      "/api/system/dev-seed",
      {
        method: "POST",
      },
    );
  },

  deleteDevelopmentSeedData() {
    return requestJson<DevelopmentSeedOperationResponse>(
      "/api/system/dev-seed",
      {
        method: "DELETE",
      },
    );
  },

  logout() {
    return requestJson<void>("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  },

  getActiveTerms() {
    return requestJson<ActiveTermsResponse>("/api/v1/terms/active", {
      method: "GET",
      credentials: "include",
    });
  },

  acceptTerms(versionId: string) {
    return requestJson<AcceptTermsResponse>(
      `/api/v1/terms/${encodeURIComponent(versionId)}/accept`,
      {
        method: "POST",
        credentials: "include",
      },
    );
  },

  submitUtilitySetup(request: CompleteUtilitySetupRequest) {
    return requestJson<CompleteUtilitySetupResponse>(
      "/api/v1/onboarding/utility-setup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  submitProfile(request: CompleteProfileRequest) {
    return requestJson<CompleteProfileResponse>("/api/v1/onboarding/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });
  },

  getOnboardingProgress() {
    return requestJson<OnboardingProgressResponse>(
      "/api/v1/onboarding/progress",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  getOnboardingState() {
    return requestJson<OnboardingStateResponse>("/api/v1/onboarding/state", {
      method: "GET",
      credentials: "include",
    });
  },

  getPendingApprovals() {
    return requestJson<PendingApprovalListResponse>(
      "/api/v1/admin/approvals/pending",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  submitAdminDecision(
    targetUserId: string,
    action: "approve" | "reject",
    request: AdminDecisionRequest,
  ) {
    return requestJson<AdminDecisionResponse>(
      `/api/v1/admin/approvals/${encodeURIComponent(targetUserId)}/${action}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  submitAdminLifecycleAction(
    targetUserId: string,
    action: "suspend" | "move-to-onboarding" | "reinstate-approved" | "archive",
    request: AdminDecisionRequest,
  ) {
    return requestJson<AdminDecisionResponse>(
      `/api/v1/admin/approvals/${encodeURIComponent(targetUserId)}/${action}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  startDelegatedSupportSession(request: StartDelegatedSupportSessionRequest) {
    return requestJson<StartDelegatedSupportSessionResponse>(
      "/api/v1/admin/approvals/support/login-on-behalf",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  submitRoleChange(targetUserId: string, request: RoleChangeRequest) {
    return requestJson<AdminRoleChangeResponse>(
      `/api/v1/admin/roles/${encodeURIComponent(targetUserId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  getAdminAuthAccessSettings() {
    return requestJson<AdminAuthAccessSettingsResponse>(
      "/api/v1/admin/system-settings/auth-access",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  updateAdminAuthAccessSettings(request: UpdateAdminAuthAccessSettingsRequest) {
    return requestJson<AdminAuthAccessSettingsResponse>(
      "/api/v1/admin/system-settings/auth-access",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  getAdminEmailTransportSettings() {
    return requestJson<AdminEmailTransportSettingsResponse>(
      "/api/v1/admin/system-settings/email-transport",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  updateAdminEmailTransportSettings(
    request: UpdateAdminEmailTransportSettingsRequest,
  ) {
    return requestJson<AdminEmailTransportSettingsResponse>(
      "/api/v1/admin/system-settings/email-transport",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  sendAdminEmailTransportTest(request: SendAdminEmailTransportTestRequest) {
    return requestJson<AdminEmailTransportTestResponse>(
      "/api/v1/admin/system-settings/email-transport/test",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  searchAdminUsers(query?: string, status?: string) {
    const params = new URLSearchParams();
    if (query && query.trim().length > 0) {
      params.set("query", query.trim());
    }

    if (status && status.trim().length > 0) {
      params.set("status", status.trim());
    }

    const suffix = params.toString().length > 0 ? `?${params.toString()}` : "";
    return requestJson<AdminUserSearchResponse>(
      `/api/v1/admin/cms/users${suffix}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  getAdminBillingContext(targetUserId: string, onDate?: string) {
    const params = new URLSearchParams();
    if (onDate && onDate.trim().length > 0) {
      params.set("onDate", onDate.trim());
    }

    const suffix = params.toString().length > 0 ? `?${params.toString()}` : "";
    return requestJson<AdminBillingContextResponse>(
      `/api/v1/admin/cms/users/${encodeURIComponent(targetUserId)}/billing-context${suffix}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  deleteAdminLatestReading(targetUserId: string, reason: string) {
    const params = new URLSearchParams({ reason });
    return requestJson<AdminActionResultResponse>(
      `/api/v1/admin/cms/users/${encodeURIComponent(targetUserId)}/readings/latest?${params.toString()}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
  },

  upsertAdminTariff(targetUserId: string, request: AdminTargetedTariffRequest) {
    return requestJson<AdminActionResultResponse>(
      `/api/v1/admin/cms/users/${encodeURIComponent(targetUserId)}/tariffs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  updateAdminBoilerAssumptions(
    targetUserId: string,
    request: AdminTargetedBoilerAssumptionsRequest,
  ) {
    return requestJson<AdminActionResultResponse>(
      `/api/v1/admin/cms/users/${encodeURIComponent(targetUserId)}/boiler-assumptions`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  getTermsVersions() {
    return requestJson<TermsVersionListResponse>(
      "/api/v1/admin/cms/terms/versions",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  publishTermsVersion(request: PublishTermsVersionRequest) {
    return requestJson<PublishTermsVersionResponse>(
      "/api/v1/admin/cms/terms/versions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  getTermsAcceptances(userId?: string, termsVersionId?: string) {
    const params = new URLSearchParams();
    if (userId && userId.trim().length > 0) {
      params.set("userId", userId.trim());
    }

    if (termsVersionId && termsVersionId.trim().length > 0) {
      params.set("termsVersionId", termsVersionId.trim());
    }

    const suffix = params.toString().length > 0 ? `?${params.toString()}` : "";
    return requestJson<TermsAcceptanceListResponse>(
      `/api/v1/admin/cms/terms/acceptances${suffix}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  getAuditLogs(filters?: {
    actorUserId?: string;
    targetUserId?: string;
    scope?: "support-lifecycle";
    category?: string;
    action?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.actorUserId && filters.actorUserId.trim().length > 0) {
      params.set("actorUserId", filters.actorUserId.trim());
    }

    if (filters?.targetUserId && filters.targetUserId.trim().length > 0) {
      params.set("targetUserId", filters.targetUserId.trim());
    }

    if (filters?.scope) {
      params.set("scope", filters.scope);
    }

    if (filters?.category && filters.category.trim().length > 0) {
      params.set("category", filters.category.trim());
    }

    if (filters?.action && filters.action.trim().length > 0) {
      params.set("action", filters.action.trim());
    }

    const suffix = params.toString().length > 0 ? `?${params.toString()}` : "";
    return requestJson<AuditLogListResponse>(
      `/api/v1/admin/cms/audit${suffix}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  hardDeleteAdminUser(targetUserId: string, request: HardDeleteUserRequest) {
    return requestJson<HardDeleteUserResponse>(
      `/api/v1/admin/cms/users/${encodeURIComponent(targetUserId)}/hard-delete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  getFlats() {
    return requestJson<FlatListResponse>("/api/v1/admin/cms/flats", {
      method: "GET",
      credentials: "include",
    });
  },

  upsertFlat(request: UpsertFlatRequest) {
    return requestJson<AdminActionResultResponse>("/api/v1/admin/cms/flats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });
  },

  getTenancies(filters?: { userId?: string; flatNumber?: string }) {
    const params = new URLSearchParams();
    if (filters?.userId && filters.userId.trim().length > 0) {
      params.set("userId", filters.userId.trim());
    }

    if (filters?.flatNumber && filters.flatNumber.trim().length > 0) {
      params.set("flatNumber", filters.flatNumber.trim());
    }

    const suffix = params.toString().length > 0 ? `?${params.toString()}` : "";
    return requestJson<TenancyListResponse>(
      `/api/v1/admin/cms/tenancies${suffix}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  upsertTenancy(request: UpsertTenancyRequest) {
    return requestJson<AdminActionResultResponse>(
      "/api/v1/admin/cms/tenancies",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  getTenantGaps(flatNumber?: string) {
    const params = new URLSearchParams();
    if (flatNumber && flatNumber.trim().length > 0) {
      params.set("flatNumber", flatNumber.trim());
    }

    const suffix = params.toString().length > 0 ? `?${params.toString()}` : "";
    return requestJson<TenantGapAllocationListResponse>(
      `/api/v1/admin/cms/tenant-gaps${suffix}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  upsertTenantGap(request: UpsertTenantGapAllocationRequest) {
    return requestJson<AdminActionResultResponse>(
      "/api/v1/admin/cms/tenant-gaps",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  submitReadings(request: SubmitReadingsRequest) {
    return requestJson<SubmitReadingsResponse>("/api/v1/billing/readings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });
  },

  updateLatestReadings(request: SubmitReadingsRequest) {
    return requestJson<SubmitReadingsResponse>(
      "/api/v1/billing/readings/latest",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  async getLatestReadings() {
    const response = await requestJson<LatestReadingsResponse | undefined>(
      "/api/v1/billing/readings/latest",
      {
        method: "GET",
        credentials: "include",
      },
    );

    return response ?? null;
  },

  submitTariffVersion(request: UpsertTariffRequest) {
    return requestJson<UpsertTariffResponse>("/api/v1/billing/tariffs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });
  },

  getActiveTariff() {
    return requestJson<ActiveTariffResponse>("/api/v1/billing/tariffs/active", {
      method: "GET",
      credentials: "include",
    });
  },

  getTariffOptions(onDate?: string) {
    const params = new URLSearchParams();
    if (onDate && onDate.trim().length > 0) {
      params.set("onDate", onDate.trim());
    }

    const suffix = params.toString().length > 0 ? `?${params.toString()}` : "";
    return requestJson<TariffOptionsResponse>(
      `/api/v1/billing/tariffs/options${suffix}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  getTariffManagement() {
    return requestJson<TariffManagementResponse>(
      "/api/v1/billing/tariffs/manage",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  updateTariffVersion(effectiveFromDate: string, request: UpsertTariffRequest) {
    return requestJson<UpsertTariffResponse>(
      `/api/v1/billing/tariffs/${encodeURIComponent(effectiveFromDate)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  deleteTariffVersion(effectiveFromDate: string) {
    return requestJson<UpsertTariffResponse>(
      `/api/v1/billing/tariffs/${encodeURIComponent(effectiveFromDate)}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
  },

  submitBoilerAssumptionVersion(request: UpsertBoilerAssumptionVersionRequest) {
    return requestJson<UpsertBoilerAssumptionVersionResponse>(
      "/api/v1/billing/boiler-assumptions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  getActiveBoilerAssumption(onDate?: string) {
    const params = new URLSearchParams();
    if (onDate && onDate.trim().length > 0) {
      params.set("onDate", onDate.trim());
    }

    const suffix = params.toString().length > 0 ? `?${params.toString()}` : "";
    return requestJson<ActiveBoilerAssumptionResponse>(
      `/api/v1/billing/boiler-assumptions/active${suffix}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  getBoilerAssumptionOptions(onDate?: string) {
    const params = new URLSearchParams();
    if (onDate && onDate.trim().length > 0) {
      params.set("onDate", onDate.trim());
    }

    const suffix = params.toString().length > 0 ? `?${params.toString()}` : "";
    return requestJson<BoilerAssumptionOptionsResponse>(
      `/api/v1/billing/boiler-assumptions/options${suffix}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  getBoilerAssumptionManagement() {
    return requestJson<BoilerAssumptionManagementResponse>(
      "/api/v1/billing/boiler-assumptions/manage",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  updateBoilerAssumptionVersion(
    effectiveFromDate: string,
    request: UpsertBoilerAssumptionVersionRequest,
  ) {
    return requestJson<UpsertBoilerAssumptionVersionResponse>(
      `/api/v1/billing/boiler-assumptions/${encodeURIComponent(effectiveFromDate)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  deleteBoilerAssumptionVersion(effectiveFromDate: string) {
    return requestJson<UpsertBoilerAssumptionVersionResponse>(
      `/api/v1/billing/boiler-assumptions/${encodeURIComponent(effectiveFromDate)}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
  },

  runLatestCalculation() {
    return requestJson<CalculateLatestPeriodResponse>(
      "/api/v1/billing/calculations/latest",
      {
        method: "POST",
        credentials: "include",
      },
    );
  },

  getLatestCalculation() {
    return requestJson<CalculateLatestPeriodResponse>(
      "/api/v1/billing/calculations/latest",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  recordLatestPeriodPayment(request: RecordLatestPeriodPaymentRequest) {
    return requestJson<RecordLatestPeriodPaymentResponse>(
      "/api/v1/billing/calculations/latest/payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  recordPeriodPayment(request: RecordPeriodPaymentRequest) {
    return requestJson<RecordLatestPeriodPaymentResponse>(
      "/api/v1/billing/payments/period",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  createPayment(request: RecordLatestPeriodPaymentRequest) {
    return requestJson<RecordLatestPeriodPaymentResponse>(
      "/api/v1/billing/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  getLatestPeriodPaymentSummary() {
    return requestJson<LatestPeriodPaymentSummaryResponse>(
      "/api/v1/billing/calculations/latest/payment",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  getPaymentHistory() {
    return requestJson<PaymentHistoryResponse>(
      "/api/v1/billing/payments/history",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  getUnlinkedPayments() {
    return requestJson<PaymentHistoryResponse>(
      "/api/v1/billing/payments/unlinked",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  updatePayment(paymentId: string, request: UpdatePaymentRequest) {
    return requestJson<UpdatePaymentResponse>(
      `/api/v1/billing/payments/${encodeURIComponent(paymentId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  deletePayment(paymentId: string) {
    return requestJson<DeletePaymentResponse>(
      `/api/v1/billing/payments/${encodeURIComponent(paymentId)}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
  },

  linkPayment(paymentId: string, request: LinkPaymentRequest) {
    return requestJson<UpdatePaymentResponse>(
      `/api/v1/billing/payments/${encodeURIComponent(paymentId)}/link`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  unlinkPayment(paymentId: string) {
    return requestJson<UpdatePaymentResponse>(
      `/api/v1/billing/payments/${encodeURIComponent(paymentId)}/unlink`,
      {
        method: "POST",
        credentials: "include",
      },
    );
  },

  getAllTimeBalance() {
    return requestJson<AllTimeBalanceResponse>(
      "/api/v1/billing/payments/balance",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  getLatestStatementSummary() {
    return requestJson<StatementSummaryResponse>(
      "/api/v1/billing/statements/latest-summary",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  getStatementPeriods() {
    return requestJson<StatementPeriodListResponse>(
      "/api/v1/billing/statements/periods",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  getStatementSummary(snapshotId: string) {
    const query = new URLSearchParams({ snapshotId });
    return requestJson<StatementSummaryResponse>(
      `/api/v1/billing/statements/summary?${query.toString()}`,
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  async exportStatementPdf(snapshotId: string) {
    const query = new URLSearchParams({ snapshotId });
    const response = await requestResponse(
      `/api/v1/billing/statements/export-pdf?${query.toString()}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    const blob = await response.blob();
    const exportId = response.headers.get("X-Statement-Export-Id") ?? "n/a";
    const suggestedName =
      response.headers
        .get("Content-Disposition")
        ?.split("filename=")
        .at(1)
        ?.replaceAll('"', "")
        ?.trim() || `statement-${snapshotId}.pdf`;

    return {
      blob,
      exportId,
      suggestedName,
    } satisfies StatementPdfExportResult;
  },

  getStatementExportHistory() {
    return requestJson<StatementExportHistoryResponse>(
      "/api/v1/billing/statements/exports",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  getPushPublicConfig() {
    return requestJson<PushPublicConfigResponse>("/api/v1/push/config", {
      method: "GET",
      credentials: "include",
    });
  },

  getReminderPreferences() {
    return requestJson<NotificationPreferencesResponse>(
      "/api/v1/reminders/preferences",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  updateReminderPreferences(request: UpdateReminderPreferencesRequest) {
    return requestJson<NotificationPreferencesResponse>(
      "/api/v1/reminders/preferences",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
      },
    );
  },

  getReminderJobs() {
    return requestJson<ReminderJobListResponse>("/api/v1/reminders/jobs", {
      method: "GET",
      credentials: "include",
    });
  },

  getPushSubscriptions() {
    return requestJson<PushSubscriptionListResponse>(
      "/api/v1/push/subscriptions",
      {
        method: "GET",
        credentials: "include",
      },
    );
  },

  upsertPushSubscription(request: SavePushSubscriptionRequest) {
    return requestJson<PushSubscriptionResponse>("/api/v1/push/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });
  },

  deletePushSubscription(subscriptionId: string) {
    return requestJson<void>(
      `/api/v1/push/subscriptions/${encodeURIComponent(subscriptionId)}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
  },

  sendPushTestNotification() {
    return requestJson<SendTestNotificationResponse>("/api/v1/push/test", {
      method: "POST",
      credentials: "include",
    });
  },
};
