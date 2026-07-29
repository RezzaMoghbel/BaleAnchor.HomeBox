export interface RequestCodeResponse {
  message: string;
  resendAfterSeconds: number;
  expiresInSeconds: number;
  developmentCode?: string;
}

export interface VerifyCodeResponse {
  authenticated: boolean;
  userStatus: string;
  message: string;
}

export interface SessionStatusResponse {
  isAuthenticated: boolean;
  userId?: string;
  emailMasked?: string;
  userStatus?: string;
  userRole?: string;
  expiresAtUtc?: string;
}

export interface ActiveTermsResponse {
  versionId: string;
  versionLabel: string;
  title: string;
  contentMarkdown: string;
  effectiveFromUtc: string;
  publishedAtUtc: string;
}

export interface AcceptTermsResponse {
  termsVersionId: string;
  acceptedAtUtc: string;
  message: string;
}

export interface CompleteUtilitySetupResponse {
  userId: string;
  status: string;
  message: string;
}

export interface CompleteProfileResponse {
  userId: string;
  status: string;
  message: string;
}

export interface OnboardingProgressResponse {
  userId: string;
  accountStatus: string;
  termsAccepted: boolean;
  profileComplete: boolean;
  utilitySetupComplete: boolean;
  nextStep: string;
}

export interface PendingApprovalUserItem {
  userId: string;
  emailMasked: string;
  submittedState: string;
  updatedAtUtc: string;
}

export interface PendingApprovalListResponse {
  items: PendingApprovalUserItem[];
  count: number;
}

export interface AdminDecisionResponse {
  userId: string;
  newStatus: string;
  message: string;
}

export interface AdminRoleChangeResponse {
  userId: string;
  previousRole: string;
  newRole: string;
  message: string;
}

export interface SubmitReadingsResponse {
  userId: string;
  readingDate: string;
  message: string;
}

export interface LatestReadingsResponse {
  userId: string;
  readingDate: string;
  coldWaterReading: string;
  hotWaterReading: string;
  electricityReading: string;
}

export interface UpsertTariffResponse {
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

export interface ActiveTariffResponse {
  userId: string;
  effectiveFromDate: string;
  waterTariffPerUnit: string;
  waterStandingChargePerDay: string;
  waterVatPercent: string;
  electricityTariffPerUnit: string;
  electricityStandingChargePerDay: string;
  electricityVatPercent: string;
}

export interface CalculateLatestPeriodResponse {
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

export interface RecordLatestPeriodPaymentResponse {
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

export interface LatestPeriodPaymentSummaryResponse {
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

export interface PaymentHistoryItemResponse {
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

export interface PaymentHistoryResponse {
  userId: string;
  count: number;
  items: PaymentHistoryItemResponse[];
}

export interface AllTimeBalanceResponse {
  userId: string;
  totalCalculatedCharges: string;
  totalRecordedPayments: string;
  balance: string;
  balanceStatus: string;
}

export interface StatementSummaryResponse {
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

export interface StatementPeriodItemResponse {
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

export interface StatementPeriodListResponse {
  userId: string;
  count: number;
  items: StatementPeriodItemResponse[];
}

export interface StatementExportHistoryItemResponse {
  exportId: string;
  snapshotId: string;
  periodStartDate: string;
  periodEndDateExclusive: string;
  templateVersion: string;
  rendererVersion: string;
  createdAtUtc: string;
}

export interface StatementExportHistoryResponse {
  userId: string;
  count: number;
  items: StatementExportHistoryItemResponse[];
}

export interface FieldErrors {
  [fieldName: string]: string[];
}
