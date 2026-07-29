import type {
  AcceptTermsResponse,
  ActiveTermsResponse,
  CompleteProfileResponse,
  CompleteUtilitySetupResponse,
  FieldErrors,
  OnboardingProgressResponse,
  RequestCodeResponse,
  SessionStatusResponse,
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
};