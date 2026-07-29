import type {
  AcceptTermsResponse,
  ActiveTariffResponse,
  ActiveTermsResponse,
  AdminDecisionResponse,
  AdminRoleChangeResponse,
  AllTimeBalanceResponse,
  CalculateLatestPeriodResponse,
  CompleteProfileResponse,
  CompleteUtilitySetupResponse,
  DevelopmentSeedOperationResponse,
  DevelopmentSeedStatusResponse,
  FieldErrors,
  LatestPeriodPaymentSummaryResponse,
  LatestReadingsResponse,
  OnboardingProgressResponse,
  PaymentHistoryResponse,
  PendingApprovalListResponse,
  RecordLatestPeriodPaymentResponse,
  RequestCodeResponse,
  SessionStatusResponse,
  StatementExportHistoryResponse,
  StatementPeriodListResponse,
  StatementSummaryResponse,
  SubmitReadingsResponse,
  UpsertTariffResponse,
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
  initialElectricityTariffPerUnit: string;
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

interface SubmitReadingsRequest {
  readingDate: string;
  coldWaterReading: string;
  hotWaterReading: string;
  electricityReading: string;
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

interface RecordLatestPeriodPaymentRequest {
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

  getLatestReadings() {
    return requestJson<LatestReadingsResponse>(
      "/api/v1/billing/readings/latest",
      {
        method: "GET",
        credentials: "include",
      },
    );
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
};
