import { type Dispatch, type SetStateAction, useState } from "react";
import { PortalApiError, portalClient } from "../api/portalClient";
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
} from "../shared/contracts";

interface UseAdminWorkflowArgs {
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export function useAdminWorkflow({ setLoading }: UseAdminWorkflowArgs) {
  const [pendingApprovals, setPendingApprovals] = useState<
    PendingApprovalUserItem[]
  >([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserSummaryItem[]>([]);
  const [adminTargetUserId, setAdminTargetUserId] = useState("");
  const [adminReason, setAdminReason] = useState("");
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminSearchStatus, setAdminSearchStatus] = useState("");
  const [adminBillingOnDate, setAdminBillingOnDate] = useState("");
  const [adminBillingContext, setAdminBillingContext] =
    useState<AdminBillingContextResponse | null>(null);

  const [adminTariffEffectiveFromDate, setAdminTariffEffectiveFromDate] =
    useState("");
  const [adminWaterTariffPerUnit, setAdminWaterTariffPerUnit] = useState("");
  const [adminWaterStandingChargePerDay, setAdminWaterStandingChargePerDay] =
    useState("");
  const [adminWaterVatPercent, setAdminWaterVatPercent] = useState("");
  const [adminElectricityTariffPerUnit, setAdminElectricityTariffPerUnit] =
    useState("");
  const [
    adminElectricityStandingChargePerDay,
    setAdminElectricityStandingChargePerDay,
  ] = useState("");
  const [adminElectricityVatPercent, setAdminElectricityVatPercent] =
    useState("");
  const [adminBoilerKwhPerCubicMeter, setAdminBoilerKwhPerCubicMeter] =
    useState("");
  const [adminBoilerEfficiencyPercent, setAdminBoilerEfficiencyPercent] =
    useState("");

  const [termsVersionLabel, setTermsVersionLabel] = useState("");
  const [termsVersionTitle, setTermsVersionTitle] = useState("");
  const [termsContentMarkdown, setTermsContentMarkdown] = useState("");
  const [termsEffectiveFromUtc, setTermsEffectiveFromUtc] = useState("");
  const [termsFilterUserId, setTermsFilterUserId] = useState("");
  const [termsFilterVersionId, setTermsFilterVersionId] = useState("");
  const [termsVersions, setTermsVersions] = useState<TermsVersionSummaryItem[]>(
    [],
  );
  const [termsAcceptances, setTermsAcceptances] = useState<
    TermsAcceptanceSummaryItem[]
  >([]);

  const [auditActorUserId, setAuditActorUserId] = useState("");
  const [auditTargetUserId, setAuditTargetUserId] = useState("");
  const [auditCategory, setAuditCategory] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [auditEntries, setAuditEntries] = useState<AuditLogSummaryItem[]>([]);

  const [flats, setFlats] = useState<FlatSummaryItem[]>([]);
  const [flatNumberInput, setFlatNumberInput] = useState("");
  const [flatLabelInput, setFlatLabelInput] = useState("");
  const [flatIsActiveInput, setFlatIsActiveInput] = useState(true);

  const [tenancies, setTenancies] = useState<TenancySummaryItem[]>([]);
  const [tenancyIdInput, setTenancyIdInput] = useState("");
  const [tenancyUserIdInput, setTenancyUserIdInput] = useState("");
  const [tenancyFlatNumberInput, setTenancyFlatNumberInput] = useState("");
  const [tenancyMoveInDateInput, setTenancyMoveInDateInput] = useState("");
  const [tenancyMoveOutDateInput, setTenancyMoveOutDateInput] = useState("");
  const [tenancyStatusInput, setTenancyStatusInput] = useState("");
  const [tenancyNotesInput, setTenancyNotesInput] = useState("");
  const [tenancyFilterUserId, setTenancyFilterUserId] = useState("");
  const [tenancyFilterFlatNumber, setTenancyFilterFlatNumber] = useState("");

  const [tenantGaps, setTenantGaps] = useState<
    TenantGapAllocationSummaryItem[]
  >([]);
  const [gapFlatNumberInput, setGapFlatNumberInput] = useState("");
  const [gapFromDateInput, setGapFromDateInput] = useState("");
  const [gapToDateExclusiveInput, setGapToDateExclusiveInput] = useState("");
  const [gapAssignedUserIdInput, setGapAssignedUserIdInput] = useState("");
  const [gapAmountInput, setGapAmountInput] = useState("");
  const [gapStatusInput, setGapStatusInput] = useState("");
  const [gapFilterFlatNumber, setGapFilterFlatNumber] = useState("");

  const [adminRoleTarget, setAdminRoleTarget] = useState("Admin");
  const [authOtpEnabled, setAuthOtpEnabled] = useState(true);
  const [authAllowLocalFixedOtp, setAuthAllowLocalFixedOtp] = useState(true);
  const [authFixedOtpCode, setAuthFixedOtpCode] = useState("123456");
  const [authLocalDomains, setAuthLocalDomains] = useState("baleanchor.local");
  const [emailTransportMode, setEmailTransportMode] = useState("log");
  const [emailFromName, setEmailFromName] = useState("");
  const [emailFromAddress, setEmailFromAddress] = useState("");
  const [emailSmtpHost, setEmailSmtpHost] = useState("");
  const [emailSmtpPort, setEmailSmtpPort] = useState("587");
  const [emailSmtpUseSsl, setEmailSmtpUseSsl] = useState(true);
  const [emailSmtpUsername, setEmailSmtpUsername] = useState("");
  const [emailSmtpPassword, setEmailSmtpPassword] = useState("");
  const [emailTestRecipient, setEmailTestRecipient] = useState("");
  const [adminMessage, setAdminMessage] = useState(
    "Admin approvals not loaded.",
  );

  const loadSystemSettings = async () => {
    setLoading(true);
    try {
      const [auth, email] = await Promise.all([
        portalClient.getAdminAuthAccessSettings(),
        portalClient.getAdminEmailTransportSettings(),
      ]);

      setAuthOtpEnabled(auth.otpEnabled);
      setAuthAllowLocalFixedOtp(auth.allowLocalDomainFixedOtp);
      setAuthFixedOtpCode(auth.fixedOtpCode);
      setAuthLocalDomains((auth.localFixedOtpDomains ?? []).join(","));

      setEmailTransportMode(email.mode);
      setEmailFromName(email.fromName);
      setEmailFromAddress(email.fromAddress);
      setEmailSmtpHost(email.smtpHost);
      setEmailSmtpPort(String(email.smtpPort));
      setEmailSmtpUseSsl(email.smtpUseSsl);
      setEmailSmtpUsername(email.smtpUsername);
      setEmailSmtpPassword("");
      setEmailTestRecipient("");

      setAdminMessage("System auth and SMTP settings refreshed.");
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Unable to refresh system settings. ${error.message}`);
      } else {
        setAdminMessage("Unable to refresh system settings.");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveAuthAccessSettings = async () => {
    setLoading(true);
    try {
      const domains = authLocalDomains
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x.length > 0);

      await portalClient.updateAdminAuthAccessSettings({
        otpEnabled: authOtpEnabled,
        allowLocalDomainFixedOtp: authAllowLocalFixedOtp,
        fixedOtpCode: authFixedOtpCode,
        localFixedOtpDomains: domains,
      });

      setAdminMessage(
        "OTP settings updated. Audit log recorded automatically.",
      );
      await loadAuditLogs();
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Auth settings update failed. ${error.message}`);
      } else {
        setAdminMessage("Auth settings update failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveEmailTransportSettings = async () => {
    setLoading(true);
    try {
      const parsedPort = Number(emailSmtpPort);
      await portalClient.updateAdminEmailTransportSettings({
        mode: emailTransportMode,
        fromName: emailFromName,
        fromAddress: emailFromAddress,
        smtpHost: emailSmtpHost,
        smtpPort: Number.isFinite(parsedPort) ? parsedPort : 587,
        smtpUseSsl: emailSmtpUseSsl,
        smtpUsername: emailSmtpUsername,
        smtpPassword: emailSmtpPassword || undefined,
      });

      setEmailSmtpPassword("");
      setAdminMessage(
        "SMTP settings updated. Audit log recorded automatically.",
      );
      await loadAuditLogs();
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Email settings update failed. ${error.message}`);
      } else {
        setAdminMessage("Email settings update failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const sendEmailTransportTest = async () => {
    if (!emailTestRecipient.trim()) {
      setAdminMessage("A target email is required for email transport test.");
      return;
    }

    setAdminMessage("Sending SMTP test email...");
    setLoading(true);
    try {
      const body = await portalClient.sendAdminEmailTransportTest({
        email: emailTestRecipient.trim(),
      });

      await loadAuditLogs();
      setAdminMessage(`${body.message} Target: ${body.email}.`);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Email transport test failed. ${error.message}`);
      } else {
        setAdminMessage("Email transport test failed.");
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

  const searchAdminUsers = async (
    queryOverride?: string,
    statusOverride?: string,
  ) => {
    const queryToUse = queryOverride ?? adminSearchQuery;
    const statusToUse = statusOverride ?? adminSearchStatus;

    if (queryOverride !== undefined) {
      setAdminSearchQuery(queryOverride);
    }

    if (statusOverride !== undefined) {
      setAdminSearchStatus(statusOverride);
    }

    setLoading(true);
    try {
      const body = await portalClient.searchAdminUsers(queryToUse, statusToUse);
      setAdminUsers(body.items);
      setAdminMessage(`Loaded ${body.count} user record(s).`);
    } catch (error) {
      setAdminUsers([]);
      if (error instanceof PortalApiError) {
        setAdminMessage(`User search failed. ${error.message}`);
      } else {
        setAdminMessage("User search failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAdminBillingContext = async (targetUserIdOverride?: string) => {
    const targetUserId = (targetUserIdOverride ?? adminTargetUserId).trim();
    if (!targetUserId) {
      setAdminMessage("Target user ID is required.");
      return;
    }

    setAdminTargetUserId(targetUserId);
    setLoading(true);
    try {
      const body = await portalClient.getAdminBillingContext(
        targetUserId,
        adminBillingOnDate || undefined,
      );
      setAdminBillingContext(body);
      setAdminBoilerKwhPerCubicMeter(body.boilerKwhPerCubicMeter ?? "");
      setAdminBoilerEfficiencyPercent(body.boilerEfficiencyPercent ?? "");
      setAdminMessage(`Loaded billing context for ${body.userId}.`);
    } catch (error) {
      setAdminBillingContext(null);
      if (error instanceof PortalApiError) {
        setAdminMessage(`Billing context load failed. ${error.message}`);
      } else {
        setAdminMessage("Billing context load failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteAdminLatestReading = async () => {
    if (!adminTargetUserId || !adminReason) {
      setAdminMessage("Target user ID and reason are required.");
      return;
    }

    setLoading(true);
    try {
      const body = await portalClient.deleteAdminLatestReading(
        adminTargetUserId,
        adminReason,
      );
      setAdminMessage(body.message);
      await Promise.all([loadAdminBillingContext(), loadAuditLogs()]);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Delete latest reading failed. ${error.message}`);
      } else {
        setAdminMessage("Delete latest reading failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const upsertAdminTariff = async () => {
    if (!adminTargetUserId || !adminReason) {
      setAdminMessage("Target user ID and reason are required.");
      return;
    }

    setLoading(true);
    try {
      const body = await portalClient.upsertAdminTariff(adminTargetUserId, {
        effectiveFromDate: adminTariffEffectiveFromDate,
        waterTariffPerUnit: adminWaterTariffPerUnit,
        waterStandingChargePerDay: adminWaterStandingChargePerDay,
        waterVatPercent: adminWaterVatPercent,
        electricityTariffPerUnit: adminElectricityTariffPerUnit,
        electricityStandingChargePerDay: adminElectricityStandingChargePerDay,
        electricityVatPercent: adminElectricityVatPercent,
        reason: adminReason,
      });
      setAdminMessage(body.message);
      await Promise.all([loadAdminBillingContext(), loadAuditLogs()]);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Target tariff save failed. ${error.message}`);
      } else {
        setAdminMessage("Target tariff save failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateAdminBoilerAssumptions = async () => {
    if (!adminTargetUserId || !adminReason) {
      setAdminMessage("Target user ID and reason are required.");
      return;
    }

    setLoading(true);
    try {
      const body = await portalClient.updateAdminBoilerAssumptions(
        adminTargetUserId,
        {
          boilerKwhPerCubicMeter: adminBoilerKwhPerCubicMeter,
          boilerEfficiencyPercent: adminBoilerEfficiencyPercent,
          reason: adminReason,
        },
      );
      setAdminMessage(body.message);
      await Promise.all([loadAdminBillingContext(), loadAuditLogs()]);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Boiler assumptions update failed. ${error.message}`);
      } else {
        setAdminMessage("Boiler assumptions update failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTermsVersions = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getTermsVersions();
      setTermsVersions(body.items);
      setAdminMessage(`Loaded ${body.count} terms version(s).`);
    } catch (error) {
      setTermsVersions([]);
      if (error instanceof PortalApiError) {
        setAdminMessage(`Unable to load terms versions. ${error.message}`);
      } else {
        setAdminMessage("Unable to load terms versions.");
      }
    } finally {
      setLoading(false);
    }
  };

  const publishTermsVersion = async () => {
    if (!adminReason) {
      setAdminMessage("Reason is required to publish terms.");
      return;
    }

    setLoading(true);
    try {
      const body = await portalClient.publishTermsVersion({
        versionLabel: termsVersionLabel,
        title: termsVersionTitle,
        contentMarkdown: termsContentMarkdown,
        effectiveFromUtc: termsEffectiveFromUtc,
        reason: adminReason,
      });
      setAdminMessage(body.message);
      await Promise.all([loadTermsVersions(), loadAuditLogs()]);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Terms publish failed. ${error.message}`);
      } else {
        setAdminMessage("Terms publish failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTermsAcceptances = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getTermsAcceptances(
        termsFilterUserId || undefined,
        termsFilterVersionId || undefined,
      );
      setTermsAcceptances(body.items);
      setAdminMessage(`Loaded ${body.count} terms acceptance record(s).`);
    } catch (error) {
      setTermsAcceptances([]);
      if (error instanceof PortalApiError) {
        setAdminMessage(`Unable to load terms acceptances. ${error.message}`);
      } else {
        setAdminMessage("Unable to load terms acceptances.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getAuditLogs({
        actorUserId: auditActorUserId || undefined,
        targetUserId: auditTargetUserId || undefined,
        category: auditCategory || undefined,
        action: auditAction || undefined,
      });
      setAuditEntries(body.items);
      setAdminMessage(`Loaded ${body.count} audit record(s).`);
    } catch (error) {
      setAuditEntries([]);
      if (error instanceof PortalApiError) {
        setAdminMessage(`Unable to load audit records. ${error.message}`);
      } else {
        setAdminMessage("Unable to load audit records.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSupportLifecycleAuditLogs = async () => {
    setLoading(true);
    try {
      setAuditCategory("");
      setAuditAction("");
      const body = await portalClient.getAuditLogs({
        actorUserId: auditActorUserId || undefined,
        targetUserId: auditTargetUserId || undefined,
        scope: "support-lifecycle",
      });
      setAuditEntries(body.items);
      setAdminMessage(
        `Loaded ${body.count} support and lifecycle audit record(s).`,
      );
    } catch (error) {
      setAuditEntries([]);
      if (error instanceof PortalApiError) {
        setAdminMessage(
          `Unable to load support and lifecycle audit records. ${error.message}`,
        );
      } else {
        setAdminMessage("Unable to load support and lifecycle audit records.");
      }
    } finally {
      setLoading(false);
    }
  };

  const hardDeleteAdminUser = async () => {
    if (!adminTargetUserId || !adminReason) {
      setAdminMessage(
        "Target user ID and reason are required for hard delete.",
      );
      return;
    }

    const confirmationText = `DELETE ${adminTargetUserId}`;

    setLoading(true);
    try {
      const body = await portalClient.hardDeleteAdminUser(adminTargetUserId, {
        reason: adminReason,
        confirmationText,
      });

      setAdminMessage(
        `${body.message} Deleted records: ${body.deletedRecordCount}.`,
      );
      await Promise.all([searchAdminUsers(), loadAuditLogs()]);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Hard delete failed. ${error.message}`);
      } else {
        setAdminMessage("Hard delete failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFlats = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getFlats();
      setFlats(body.items);
      setAdminMessage(`Loaded ${body.count} flat record(s).`);
    } catch (error) {
      setFlats([]);
      if (error instanceof PortalApiError) {
        setAdminMessage(`Unable to load flats. ${error.message}`);
      } else {
        setAdminMessage("Unable to load flats.");
      }
    } finally {
      setLoading(false);
    }
  };

  const upsertFlat = async () => {
    if (!adminReason) {
      setAdminMessage("Reason is required for flat updates.");
      return;
    }

    setLoading(true);
    try {
      const body = await portalClient.upsertFlat({
        flatNumber: flatNumberInput,
        label: flatLabelInput,
        isActive: flatIsActiveInput,
        reason: adminReason,
      });

      setAdminMessage(body.message);
      await Promise.all([loadFlats(), loadAuditLogs()]);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Flat update failed. ${error.message}`);
      } else {
        setAdminMessage("Flat update failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTenancies = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getTenancies({
        userId: tenancyFilterUserId || undefined,
        flatNumber: tenancyFilterFlatNumber || undefined,
      });
      setTenancies(body.items);
      setAdminMessage(`Loaded ${body.count} tenancy record(s).`);
    } catch (error) {
      setTenancies([]);
      if (error instanceof PortalApiError) {
        setAdminMessage(`Unable to load tenancies. ${error.message}`);
      } else {
        setAdminMessage("Unable to load tenancies.");
      }
    } finally {
      setLoading(false);
    }
  };

  const upsertTenancy = async () => {
    if (!adminReason) {
      setAdminMessage("Reason is required for tenancy updates.");
      return;
    }

    setLoading(true);
    try {
      const body = await portalClient.upsertTenancy({
        tenancyId: tenancyIdInput || undefined,
        userId: tenancyUserIdInput,
        flatNumber: tenancyFlatNumberInput,
        moveInDate: tenancyMoveInDateInput,
        moveOutDate: tenancyMoveOutDateInput || undefined,
        status: tenancyStatusInput || undefined,
        notes: tenancyNotesInput || undefined,
        reason: adminReason,
      });
      setAdminMessage(body.message);
      await Promise.all([loadTenancies(), loadAuditLogs()]);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Tenancy update failed. ${error.message}`);
      } else {
        setAdminMessage("Tenancy update failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const beginTenancyEdit = (item: TenancySummaryItem) => {
    setTenancyIdInput(item.tenancyId);
    setTenancyUserIdInput(item.userId);
    setTenancyFlatNumberInput(item.flatNumber);
    setTenancyMoveInDateInput(item.moveInDate);
    setTenancyMoveOutDateInput(item.moveOutDate ?? "");
    setTenancyStatusInput(item.status);
    setTenancyNotesInput(item.notes ?? "");
    setAdminMessage(`Loaded tenancy ${item.tenancyId} into edit form.`);
  };

  const clearTenancyForm = () => {
    setTenancyIdInput("");
    setTenancyUserIdInput("");
    setTenancyFlatNumberInput("");
    setTenancyMoveInDateInput("");
    setTenancyMoveOutDateInput("");
    setTenancyStatusInput("");
    setTenancyNotesInput("");
    setAdminMessage("Tenancy form reset.");
  };

  const loadTenantGaps = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getTenantGaps(
        gapFilterFlatNumber || undefined,
      );
      setTenantGaps(body.items);
      setAdminMessage(`Loaded ${body.count} tenant-gap allocation record(s).`);
    } catch (error) {
      setTenantGaps([]);
      if (error instanceof PortalApiError) {
        setAdminMessage(
          `Unable to load tenant-gap allocations. ${error.message}`,
        );
      } else {
        setAdminMessage("Unable to load tenant-gap allocations.");
      }
    } finally {
      setLoading(false);
    }
  };

  const upsertTenantGap = async () => {
    if (!adminReason) {
      setAdminMessage("Reason is required for tenant-gap allocation updates.");
      return;
    }

    setLoading(true);
    try {
      const body = await portalClient.upsertTenantGap({
        flatNumber: gapFlatNumberInput,
        fromDate: gapFromDateInput,
        toDateExclusive: gapToDateExclusiveInput,
        assignedUserId: gapAssignedUserIdInput,
        amount: gapAmountInput,
        reason: adminReason,
        status: gapStatusInput || undefined,
      });
      setAdminMessage(body.message);
      await Promise.all([loadTenantGaps(), loadAuditLogs()]);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(
          `Tenant-gap allocation update failed. ${error.message}`,
        );
      } else {
        setAdminMessage("Tenant-gap allocation update failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const beginTenantGapEdit = (item: TenantGapAllocationSummaryItem) => {
    setGapFlatNumberInput(item.flatNumber);
    setGapFromDateInput(item.fromDate);
    setGapToDateExclusiveInput(item.toDateExclusive);
    setGapAssignedUserIdInput(item.assignedUserId);
    setGapAmountInput(item.amount);
    setGapStatusInput(item.status);
    setAdminMessage(
      `Loaded gap allocation ${item.allocationId} into edit form.`,
    );
  };

  const clearTenantGapForm = () => {
    setGapFlatNumberInput("");
    setGapFromDateInput("");
    setGapToDateExclusiveInput("");
    setGapAssignedUserIdInput("");
    setGapAmountInput("");
    setGapStatusInput("");
    setAdminMessage("Tenant-gap allocation form reset.");
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

  const submitAdminLifecycleAction = async (
    action: "suspend" | "move-to-onboarding" | "reinstate-approved" | "archive",
  ) => {
    if (!adminTargetUserId || !adminReason) {
      setAdminMessage("Target user ID and reason are required.");
      return;
    }

    setLoading(true);
    try {
      const body = await portalClient.submitAdminLifecycleAction(
        adminTargetUserId,
        action,
        { reason: adminReason },
      );

      setAdminMessage(
        `${body.message} User ${body.userId} now in state ${body.newStatus}.`,
      );
      await Promise.all([loadPendingApprovals(), loadAuditLogs()]);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Lifecycle action failed. ${error.message}`);
      } else {
        setAdminMessage("Lifecycle action failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const startDelegatedSupportSession = async (request: {
    targetUserId: string;
    reason: string;
    expectedEmail?: string;
    expectedFlatNumber?: string;
    expectedDateOfBirth?: string;
  }): Promise<boolean> => {
    if (!request.targetUserId || !request.reason) {
      setAdminMessage(
        "Target user ID and reason are required for support login.",
      );
      return false;
    }

    setLoading(true);
    try {
      const body = await portalClient.startDelegatedSupportSession(request);
      setAdminMessage(
        `${body.message} Switched to ${body.switchedUserEmailMasked}. Session expires at ${body.expiresAtUtc}.`,
      );
      await loadAuditLogs();
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Support login failed. ${error.message}`);
      } else {
        setAdminMessage("Support login failed.");
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
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
    startDelegatedSupportSession,
    hardDeleteAdminUser,
  };
}
