export interface RequestCodeResponse {
  message: string;
  resendAfterSeconds: number;
  expiresInSeconds: number;
  developmentCode?: string;
}

export interface SignupRequestCodeRequest {
  email: string;
  password: string;
}

export interface VerifyCodeResponse {
  authenticated: boolean;
  userStatus: string;
  message: string;
}

export interface AuthModeResponse {
  otpEnabled: boolean;
}

export interface SessionStatusResponse {
  isAuthenticated: boolean;
  userId?: string;
  emailMasked?: string;
  userStatus?: string;
  userRole?: string;
  expiresAtUtc?: string;
}

export interface DevelopmentSeedStatusResponse {
  enabled: boolean;
  environment: string;
  fixedOtpCode: string;
  seedEmails: string[];
}

export interface DevelopmentSeedOperationResponse {
  message: string;
  usersChanged: number;
  sessionsChanged: number;
  otpChallengesChanged: number;
  termsAcceptancesChanged: number;
  utilitySetupsChanged: number;
  tariffsChanged: number;
  readingsChanged: number;
  calculationSnapshotsChanged: number;
  paymentsChanged: number;
  statementExportsChanged: number;
  auditLogsChanged: number;
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

export interface AdminUserSummaryItem {
  userId: string;
  email: string;
  role: string;
  status: string;
  flatNumber?: string;
  updatedAtUtc: string;
}

export interface AdminUserSearchResponse {
  count: number;
  items: AdminUserSummaryItem[];
}

export interface AdminBillingContextResponse {
  userId: string;
  latestReadingDate?: string;
  latestColdWaterReading?: string;
  latestHotWaterReading?: string;
  latestElectricityReading?: string;
  activeTariffEffectiveFromDate?: string;
  waterTariffPerUnit?: string;
  waterStandingChargePerDay?: string;
  waterVatPercent?: string;
  electricityTariffPerUnit?: string;
  electricityStandingChargePerDay?: string;
  electricityVatPercent?: string;
  latestPaymentId?: string;
  latestPaymentAmount?: string;
  latestPaymentDate?: string;
  latestPaymentMethod?: string;
  moveInDate?: string;
  boilerKwhPerCubicMeter?: string;
  boilerEfficiencyPercent?: string;
}

export interface AdminActionResultResponse {
  userId: string;
  message: string;
}

export interface AdminEmailTransportSettingsResponse {
  mode: string;
  fromName: string;
  fromAddress: string;
  smtpHost: string;
  smtpPort: number;
  smtpUseSsl: boolean;
  smtpUsername: string;
  hasSmtpPassword: boolean;
  updatedByUserId?: string;
  updatedAtUtc?: string;
}

export interface UpdateAdminEmailTransportSettingsRequest {
  mode: string;
  fromName: string;
  fromAddress: string;
  smtpHost: string;
  smtpPort: number;
  smtpUseSsl: boolean;
  smtpUsername: string;
  smtpPassword?: string;
  reason: string;
}

export interface SendAdminEmailTransportTestRequest {
  email: string;
  reason: string;
}

export interface AdminEmailTransportTestResponse {
  email: string;
  message: string;
  mode: string;
}

export interface AdminAuthAccessSettingsResponse {
  otpEnabled: boolean;
  allowLocalDomainFixedOtp: boolean;
  fixedOtpCode: string;
  localFixedOtpDomains: string[];
  updatedByUserId?: string;
  updatedAtUtc?: string;
}

export interface UpdateAdminAuthAccessSettingsRequest {
  otpEnabled: boolean;
  allowLocalDomainFixedOtp: boolean;
  fixedOtpCode: string;
  localFixedOtpDomains: string[];
  reason: string;
}

export interface TermsVersionSummaryItem {
  versionId: string;
  versionLabel: string;
  title: string;
  effectiveFromUtc: string;
  publishedAtUtc: string;
  isActive: boolean;
}

export interface TermsVersionListResponse {
  count: number;
  items: TermsVersionSummaryItem[];
}

export interface PublishTermsVersionResponse {
  versionId: string;
  versionLabel: string;
  message: string;
}

export interface TermsAcceptanceSummaryItem {
  acceptanceId: string;
  userId: string;
  termsVersionId: string;
  acceptedAtUtc: string;
  acceptedFromIp: string;
}

export interface TermsAcceptanceListResponse {
  count: number;
  items: TermsAcceptanceSummaryItem[];
}

export interface AuditLogSummaryItem {
  auditId: string;
  actorUserId: string;
  targetUserId: string;
  category: string;
  action: string;
  reason: string;
  metadata: string;
  createdAtUtc: string;
}

export interface AuditLogListResponse {
  count: number;
  items: AuditLogSummaryItem[];
}

export interface FlatSummaryItem {
  flatNumber: string;
  label: string;
  isActive: boolean;
  updatedAtUtc: string;
}

export interface FlatListResponse {
  count: number;
  items: FlatSummaryItem[];
}

export interface TenancySummaryItem {
  tenancyId: string;
  userId: string;
  flatNumber: string;
  moveInDate: string;
  moveOutDate?: string;
  status: string;
  notes?: string;
  updatedAtUtc: string;
}

export interface TenancyListResponse {
  count: number;
  items: TenancySummaryItem[];
}

export interface TenantGapAllocationSummaryItem {
  allocationId: string;
  flatNumber: string;
  fromDate: string;
  toDateExclusive: string;
  assignedUserId: string;
  amount: string;
  reason: string;
  status: string;
  updatedAtUtc: string;
}

export interface TenantGapAllocationListResponse {
  count: number;
  items: TenantGapAllocationSummaryItem[];
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
  estimatedAllocationLabel?: string;
  engineVersion: string;
  roundingPolicyVersion: string;
  inputHash: string;
  equationSummary: string;
  boilerAssumptions: BoilerAssumptionSummaryResponse;
  tariffSegments: CalculationTariffSegmentResponse[];
  componentLines: CalculationComponentLineResponse[];
  integrityChecksPassed: boolean;
  integrityDigest: string;
}

export interface BoilerAssumptionSummaryResponse {
  boilerKwhPerCubicMeter: string;
  boilerEfficiencyPercent: string;
}

export interface CalculationTariffSegmentResponse {
  startDate: string;
  endDateExclusive: string;
  days: number;
  isEstimatedAllocation: boolean;
  waterTariffPerUnit: string;
  waterStandingChargePerDay: string;
  waterVatPercent: string;
  electricityTariffPerUnit: string;
  electricityStandingChargePerDay: string;
  electricityVatPercent: string;
  coldWaterUsage: string;
  hotWaterUsage: string;
  apartmentElectricityUsage: string;
  boilerElectricityUsage: string;
}

export interface CalculationComponentLineResponse {
  component: string;
  usage: string;
  usageSubtotal: string;
  standingSubtotal: string;
  vatAmount: string;
  total: string;
  equation: string;
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

export interface UpdatePaymentResponse {
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

export interface DeletePaymentResponse {
  paymentId: string;
  userId: string;
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
  estimatedAllocationLabel?: string;
  engineVersion: string;
  roundingPolicyVersion: string;
  inputHash: string;
  equationSummary: string;
  boilerAssumptions: BoilerAssumptionSummaryResponse;
  tariffSegments: CalculationTariffSegmentResponse[];
  componentLines: CalculationComponentLineResponse[];
  integrityChecksPassed: boolean;
  integrityDigest: string;
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
  contentSha256: string;
  templateVersion: string;
  rendererVersion: string;
  createdAtUtc: string;
}

export interface StatementExportHistoryResponse {
  userId: string;
  count: number;
  items: StatementExportHistoryItemResponse[];
}

export interface NotificationPreferencesResponse {
  userId: string;
  emailRemindersEnabled: boolean;
  pushRemindersEnabled: boolean;
  readingReminderEnabled: boolean;
  timeZoneId: string;
  updatedAtUtc: string;
}

export interface UpdateNotificationPreferencesRequest {
  emailRemindersEnabled: boolean;
  pushRemindersEnabled: boolean;
  readingReminderEnabled: boolean;
  timeZoneId: string;
}

export interface PushPublicConfigResponse {
  pushEnabled: boolean;
  vapidPublicKey?: string;
  deepLinkPath: string;
}

export interface UpsertPushSubscriptionRequest {
  endpoint: string;
  p256dh: string;
  auth: string;
  clientUserAgent?: string;
}

export interface PushSubscriptionResponse {
  subscriptionId: string;
  endpoint: string;
  isActive: boolean;
  expiresAtUtc?: string;
  updatedAtUtc: string;
}

export interface PushSubscriptionListResponse {
  userId: string;
  count: number;
  items: PushSubscriptionResponse[];
}

export interface SendTestNotificationResponse {
  userId: string;
  deliveredSubscriptions: number;
  message: string;
}

export interface ReminderJobItemResponse {
  jobId: string;
  kind: string;
  channel: string;
  recommendedReadingDate: string;
  scheduledForUtc: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  lastErrorCode?: string;
  lastErrorMessage?: string;
}

export interface ReminderJobListResponse {
  userId: string;
  count: number;
  items: ReminderJobItemResponse[];
}

export interface FieldErrors {
  [fieldName: string]: string[];
}
