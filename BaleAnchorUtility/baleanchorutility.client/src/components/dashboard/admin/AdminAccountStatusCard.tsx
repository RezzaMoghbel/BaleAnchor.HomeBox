import { useEffect, useState } from "react";
import type {
  AdminUserSummaryItem,
  PendingApprovalUserItem,
} from "../../../shared/contracts";

type AccountFilter = "all" | "pending" | "rejected" | "suspended";
type AccountTableRow = {
  userId: string;
  email: string;
  role: string;
  status: string;
  flatNumber: string;
  updatedAtUtc: string;
  expectedEmail?: string;
  canViewAsUser: boolean;
};

type AccountStatusOption =
  | "EmailUnverified"
  | "EmailVerified"
  | "TermsPending"
  | "ProfileIncomplete"
  | "UtilitySetupIncomplete"
  | "PendingApproval"
  | "Active"
  | "Rejected"
  | "Suspended"
  | "MovedOut"
  | "Archived";

type AccountActionOption =
  | "move-to-onboarding"
  | "reinstate-approved"
  | "archive"
  | "hard-delete";

type AccountUpdateIntent =
  | `status:${AccountStatusOption}`
  | `action:${AccountActionOption}`;

interface AdminAccountStatusCardProps {
  loading: boolean;
  isSuperAdmin: boolean;
  canRunAdminActions: boolean;
  pendingApprovals: PendingApprovalUserItem[];
  adminUsers: AdminUserSummaryItem[];
  formatDisplayDateTime: (value?: string) => string;
  onLoadPendingApprovals: () => Promise<void>;
  onSearchAdminUsers: (
    queryOverride?: string,
    statusOverride?: string,
  ) => Promise<void>;
  onOpenAccountFromSearch: (
    targetUserId: string,
    expectedEmail?: string,
  ) => Promise<void>;
  onApplyAccountStatusRoleChange: (request: {
    targetUserId: string;
    reason: string;
    statusAction?:
      | "approve"
      | "reject"
      | "suspend"
      | "move-to-onboarding"
      | "reinstate-approved"
      | "archive"
      | "hard-delete";
    roleTarget: "Resident" | "Admin" | "SuperAdmin";
    currentStatus?: string;
    currentRole?: string;
  }) => Promise<{
    success: boolean;
    message: string;
    userId?: string;
    newStatus?: string;
    newRole?: string;
  }>;
}

export function AdminAccountStatusCard({
  loading,
  isSuperAdmin,
  canRunAdminActions,
  pendingApprovals,
  adminUsers,
  formatDisplayDateTime,
  onLoadPendingApprovals,
  onSearchAdminUsers,
  onOpenAccountFromSearch,
  onApplyAccountStatusRoleChange,
}: AdminAccountStatusCardProps) {
  const [activeFilter, setActiveFilter] = useState<AccountFilter>("all");
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [changeModalTarget, setChangeModalTarget] =
    useState<AccountTableRow | null>(null);
  const [changeModalIntent, setChangeModalIntent] =
    useState<AccountUpdateIntent>("status:Active");
  const [changeModalRole, setChangeModalRole] = useState<
    "Resident" | "Admin" | "SuperAdmin"
  >("Resident");
  const [changeModalReason, setChangeModalReason] = useState("");
  const [changeModalConfirmText, setChangeModalConfirmText] = useState("");
  const [changeModalChecked, setChangeModalChecked] = useState(false);
  const [updateToast, setUpdateToast] = useState<{
    tone: "default" | "danger";
    title: string;
    message: string;
  } | null>(null);
  const pageSize = 10;

  const allStatusOptions: Array<{
    value: AccountStatusOption;
    label: string;
    userSelectable: boolean;
  }> = [
    {
      value: "EmailUnverified",
      label: "Email unverified (system-managed)",
      userSelectable: false,
    },
    {
      value: "EmailVerified",
      label: "Email verified (system-managed)",
      userSelectable: false,
    },
    {
      value: "TermsPending",
      label: "Terms pending (Onboarding)",
      userSelectable: true,
    },
    {
      value: "ProfileIncomplete",
      label: "Profile incomplete (system-managed)",
      userSelectable: false,
    },
    {
      value: "UtilitySetupIncomplete",
      label: "Utility setup incomplete (system-managed)",
      userSelectable: false,
    },
    {
      value: "PendingApproval",
      label: "Pending approval (system-managed)",
      userSelectable: false,
    },
    {
      value: "Active",
      label: "Active",
      userSelectable: true,
    },
    {
      value: "Rejected",
      label: "Rejected",
      userSelectable: true,
    },
    {
      value: "Suspended",
      label: "Suspended",
      userSelectable: true,
    },
    {
      value: "MovedOut",
      label: "Moved out (system-managed)",
      userSelectable: false,
    },
    {
      value: "Archived",
      label: "Archived",
      userSelectable: true,
    },
  ];

  useEffect(() => {
    if (!updateToast) {
      return;
    }

    const timer = window.setTimeout(() => setUpdateToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [updateToast]);

  const runAllAccounts = async () => {
    setActiveFilter("all");
    setCurrentPage(1);
    await onSearchAdminUsers(undefined, "");
  };

  const runRejectedAccounts = async () => {
    setActiveFilter("rejected");
    setCurrentPage(1);
    await onSearchAdminUsers(undefined, "Rejected");
  };

  const runSuspendedAccounts = async () => {
    setActiveFilter("suspended");
    setCurrentPage(1);
    await onSearchAdminUsers(undefined, "Suspended");
  };

  const runPendingAccounts = async () => {
    setActiveFilter("pending");
    setCurrentPage(1);
    await onLoadPendingApprovals();
  };

  const rows: AccountTableRow[] =
    activeFilter === "pending"
      ? pendingApprovals.map((item) => ({
          userId: item.userId,
          email: item.emailMasked,
          role: "Resident",
          status: item.submittedState || "PendingApproval",
          flatNumber: "-",
          updatedAtUtc: item.updatedAtUtc,
          expectedEmail: undefined,
          canViewAsUser: false,
        }))
      : adminUsers.map((item) => ({
          userId: item.userId,
          email: item.email,
          role: item.role,
          status: item.status,
          flatNumber: item.flatNumber ?? "-",
          updatedAtUtc: item.updatedAtUtc,
          expectedEmail: item.email,
          canViewAsUser:
            item.role.trim().toLowerCase() !== "superadmin" &&
            item.status.trim().toLowerCase() !== "archived" &&
            item.status.trim().toLowerCase() !== "movedout",
        }));

  const filteredRows = rows.filter((item) => {
    const query = tableSearchTerm.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      item.userId.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.role.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query) ||
      item.flatNumber.toLowerCase().includes(query)
    );
  });

  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedRows = filteredRows.slice(startIndex, startIndex + pageSize);
  const showingFrom = totalEntries === 0 ? 0 : startIndex + 1;
  const showingTo = totalEntries === 0 ? 0 : startIndex + pagedRows.length;

  const badgeClassForStatus = (statusValue: string) => {
    const normalized = statusValue.trim().toLowerCase();
    if (normalized === "active") {
      return "badge rounded-pill bg-success";
    }

    if (normalized === "pendingapproval" || normalized === "pending") {
      return "badge rounded-pill bg-warning text-dark";
    }

    if (normalized === "rejected") {
      return "badge rounded-pill bg-danger";
    }

    if (normalized === "suspended") {
      return "badge rounded-pill bg-dark";
    }

    if (normalized === "onboarding") {
      return "badge rounded-pill bg-info text-dark";
    }

    if (normalized === "archived") {
      return "badge rounded-pill bg-secondary";
    }

    return "badge rounded-pill bg-light text-dark";
  };

  const badgeClassForRole = (roleValue: string) => {
    const normalized = roleValue.trim().toLowerCase();
    if (normalized === "superadmin") {
      return "badge rounded-pill bg-dark";
    }

    if (normalized === "admin") {
      return "badge rounded-pill bg-primary";
    }

    return "badge rounded-pill bg-secondary";
  };

  const activeFilterLabel =
    activeFilter === "pending"
      ? "pending approvals"
      : activeFilter === "rejected"
        ? "rejected accounts"
        : activeFilter === "suspended"
          ? "suspended accounts"
          : "all accounts";

  const pendingCount = pendingApprovals.length;
  const rejectedCount = adminUsers.filter(
    (item) => item.status.trim().toLowerCase() === "rejected",
  ).length;
  const suspendedCount = adminUsers.filter(
    (item) => item.status.trim().toLowerCase() === "suspended",
  ).length;

  const canShowLoadRejectedCount = rejectedCount > 0;
  const canShowLoadSuspendedCount = suspendedCount > 0;

  const showAllCount = activeFilter === "all" ? rows.length : adminUsers.length;

  const renderCount =
    activeFilter === "pending"
      ? pendingCount
      : activeFilter === "rejected"
        ? rejectedCount
        : activeFilter === "suspended"
          ? suspendedCount
          : showAllCount;

  const toDisplayStatus = (statusValue: string) => {
    if (statusValue.trim().toLowerCase() === "pendingapproval") {
      return "Pending approval";
    }

    return statusValue;
  };

  const tableHeaders = [
    "User ID",
    "Email",
    "Role",
    "Status",
    "Flat",
    "Updated",
  ];

  const exportRows = filteredRows.map((item) => [
    item.userId,
    item.email,
    item.role,
    toDisplayStatus(item.status),
    item.flatNumber,
    formatDisplayDateTime(item.updatedAtUtc),
  ]);

  const escapeCsv = (value: string) => {
    const escaped = value.replaceAll('"', '""');
    return `"${escaped}"`;
  };

  const buildCsv = () => {
    const lines = [
      tableHeaders.map((x) => escapeCsv(x)).join(","),
      ...exportRows.map((row) => row.map((x) => escapeCsv(x)).join(",")),
    ];

    return lines.join("\n");
  };

  const downloadBlob = (
    content: BlobPart,
    fileName: string,
    mimeType: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const lines = [
      tableHeaders.join("\t"),
      ...exportRows.map((row) => row.join("\t")),
    ];

    const tsv = lines.join("\n");
    try {
      await navigator.clipboard.writeText(tsv);
    } catch {
      downloadBlob(
        tsv,
        "account-status.tsv",
        "text/tab-separated-values;charset=utf-8",
      );
    }
  };

  const handleExcel = () => {
    const csv = buildCsv();
    downloadBlob(csv, "account-status.csv", "text/csv;charset=utf-8");
  };

  const buildPrintableTableHtml = () => {
    const tableRows = exportRows
      .map(
        (row) =>
          `<tr>${row
            .map(
              (value) =>
                `<td>${value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</td>`,
            )
            .join("")}</tr>`,
      )
      .join("");

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Account Status Oversight</title>
  <style>
    body { font-family: Roboto, Arial, sans-serif; padding: 20px; color: #13253a; }
    h1 { font-size: 20px; margin: 0 0 10px; }
    p { margin: 0 0 14px; color: #4b5563; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d7dee8; padding: 8px; text-align: left; font-size: 12px; }
    th { background: #f3f6fa; }
  </style>
</head>
<body>
  <h1>Account status oversight</h1>
  <p>Filter: ${activeFilterLabel} | Records: ${totalEntries}</p>
  <table>
    <thead>
      <tr>${tableHeaders.map((header) => `<th>${header}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${tableRows || `<tr><td colspan="6">No records found.</td></tr>`}
    </tbody>
  </table>
</body>
</html>`;
  };

  const openPrintWindow = (autoPrint: boolean) => {
    const popup = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=1200,height=800",
    );
    if (!popup) {
      return;
    }

    popup.document.open();
    popup.document.write(buildPrintableTableHtml());
    popup.document.close();

    if (autoPrint) {
      popup.onload = () => {
        popup.print();
      };
    }
  };

  const handlePdf = () => {
    openPrintWindow(true);
  };

  const handlePrint = () => {
    openPrintWindow(true);
  };

  const handleSearchChange = (value: string) => {
    setTableSearchTerm(value);
    setCurrentPage(1);
  };

  const canGoPrev = safePage > 1;
  const canGoNext = safePage < totalPages;
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const normalizeRole = (
    roleValue: string,
  ): "Resident" | "Admin" | "SuperAdmin" => {
    const normalized = roleValue.trim().toLowerCase();
    if (normalized === "superadmin") {
      return "SuperAdmin";
    }

    if (normalized === "admin") {
      return "Admin";
    }

    return "Resident";
  };

  const openChangeModal = (item: AccountTableRow) => {
    const confirmationText = `CONFIRM ${item.userId}`;
    const normalizedStatus = item.status.trim().toLowerCase();
    const defaultStatusTarget: AccountStatusOption =
      normalizedStatus === "emailunverified"
        ? "EmailUnverified"
        : normalizedStatus === "emailverified"
          ? "EmailVerified"
          : normalizedStatus === "termspending"
            ? "TermsPending"
            : normalizedStatus === "profileincomplete"
              ? "ProfileIncomplete"
              : normalizedStatus === "utilitysetupincomplete"
                ? "UtilitySetupIncomplete"
                : normalizedStatus === "pendingapproval" ||
                    normalizedStatus === "pending"
                  ? "PendingApproval"
                  : normalizedStatus === "rejected"
                    ? "Rejected"
                    : normalizedStatus === "suspended"
                      ? "Suspended"
                      : normalizedStatus === "movedout"
                        ? "MovedOut"
                        : normalizedStatus === "archived"
                          ? "Archived"
                          : "Active";

    setChangeModalTarget(item);
    setChangeModalIntent(`status:${defaultStatusTarget}`);
    setChangeModalRole(normalizeRole(item.role));
    setChangeModalReason(`Account status oversight update for ${item.userId}`);
    setChangeModalConfirmText(confirmationText);
    setChangeModalChecked(false);
  };

  const closeChangeModal = () => {
    setChangeModalTarget(null);
    setChangeModalConfirmText("");
    setChangeModalChecked(false);
  };

  const changeModalStatusTheme = (statusValue: string) => {
    const normalized = statusValue.trim().toLowerCase();
    if (normalized === "pendingapproval" || normalized === "pending") {
      return {
        header: "bg-warning text-dark",
        badge: "badge rounded-pill bg-warning text-dark",
      };
    }

    if (normalized === "rejected") {
      return {
        header: "bg-danger text-white",
        badge: "badge rounded-pill bg-danger",
      };
    }

    if (normalized === "suspended") {
      return {
        header: "bg-dark text-white",
        badge: "badge rounded-pill bg-dark",
      };
    }

    return {
      header: "bg-success text-white",
      badge: "badge rounded-pill bg-success",
    };
  };

  const isChangeModalReady = () => {
    if (!changeModalTarget) {
      return false;
    }

    const expected = `CONFIRM ${changeModalTarget.userId}`;
    return (
      changeModalChecked &&
      changeModalReason.trim().length >= 3 &&
      changeModalConfirmText.trim() === expected
    );
  };

  const submitChangeModal = async () => {
    if (!changeModalTarget || !isChangeModalReady()) {
      return;
    }

    if (!canRunAdminActions) {
      setUpdateToast({
        tone: "danger",
        title: "Update blocked",
        message:
          "Admin permission is required to change account statuses. Sign in as Admin or SuperAdmin.",
      });
      return;
    }

    const currentStatus = changeModalTarget.status.trim().toLowerCase();

    if (changeModalIntent === "action:hard-delete" && !isSuperAdmin) {
      setUpdateToast({
        tone: "danger",
        title: "Update blocked",
        message: "Only SuperAdmin can hard delete an account.",
      });
      return;
    }

    const resolveStatusAction = () => {
      if (changeModalIntent.startsWith("action:")) {
        const directAction = changeModalIntent.slice(7) as AccountActionOption;
        return { action: directAction };
      }

      const targetStatus = changeModalIntent.slice(7) as AccountStatusOption;

      if (
        (currentStatus === "pendingapproval" || currentStatus === "pending") &&
        targetStatus === "Active"
      ) {
        return { action: "approve" as const };
      }

      if (
        (currentStatus === "pendingapproval" || currentStatus === "pending") &&
        targetStatus === "Rejected"
      ) {
        return { action: "reject" as const };
      }

      if (targetStatus === "Suspended" && currentStatus !== "suspended") {
        return { action: "suspend" as const };
      }

      if (targetStatus === "TermsPending" && currentStatus === "archived") {
        return {
          validationMessage:
            "Archived accounts cannot be moved back to onboarding (Terms pending).",
        };
      }

      if (targetStatus === "TermsPending" && currentStatus !== "termspending") {
        return { action: "move-to-onboarding" as const };
      }

      if (
        targetStatus === "Active" &&
        (currentStatus === "rejected" || currentStatus === "suspended")
      ) {
        return { action: "reinstate-approved" as const };
      }

      if (targetStatus === "Archived" && currentStatus !== "archived") {
        if (
          changeModalTarget.role.trim().toLowerCase() === "admin" ||
          changeModalTarget.role.trim().toLowerCase() === "superadmin"
        ) {
          return {
            validationMessage:
              "Admin and SuperAdmin accounts cannot be archived with this operation.",
          };
        }

        return { action: "archive" as const };
      }

      if (
        (targetStatus === "EmailUnverified" ||
          targetStatus === "EmailVerified" ||
          targetStatus === "ProfileIncomplete" ||
          targetStatus === "UtilitySetupIncomplete" ||
          targetStatus === "PendingApproval" ||
          targetStatus === "MovedOut") &&
        targetStatus.toLowerCase() !== currentStatus
      ) {
        return {
          validationMessage:
            "Selected status is system-managed and cannot be set from this admin modal.",
        };
      }

      if (
        targetStatus === "Rejected" &&
        currentStatus !== "pendingapproval" &&
        currentStatus !== "pending"
      ) {
        return {
          validationMessage:
            "Reject is only valid for users currently in Pending approval.",
        };
      }

      if (
        targetStatus === "Active" &&
        currentStatus !== "active" &&
        currentStatus !== "pendingapproval" &&
        currentStatus !== "pending" &&
        currentStatus !== "rejected" &&
        currentStatus !== "suspended"
      ) {
        return {
          validationMessage:
            "Active can only be set from Pending approval, Rejected, or Suspended.",
        };
      }

      return { action: undefined };
    };

    const statusPlan = resolveStatusAction();
    if (statusPlan.validationMessage) {
      setUpdateToast({
        tone: "danger",
        title: "Update blocked",
        message: statusPlan.validationMessage,
      });
      return;
    }

    if (
      !isSuperAdmin &&
      normalizeRole(changeModalTarget.role) !== changeModalRole
    ) {
      setUpdateToast({
        tone: "danger",
        title: "Update blocked",
        message: "Only SuperAdmin can change user roles.",
      });
      return;
    }

    const result = await onApplyAccountStatusRoleChange({
      targetUserId: changeModalTarget.userId,
      reason: changeModalReason.trim(),
      statusAction: statusPlan.action,
      roleTarget: changeModalRole,
      currentStatus: changeModalTarget.status,
      currentRole: changeModalTarget.role,
    });

    setUpdateToast({
      tone: result.success ? "default" : "danger",
      title: result.success ? "Update saved" : "Update failed",
      message: result.message,
    });

    if (result.success) {
      closeChangeModal();
    }
  };

  const copyUserId = async (userId: string) => {
    try {
      await navigator.clipboard.writeText(userId);
    } catch {
      downloadBlob(userId, "user-id.txt", "text/plain;charset=utf-8");
    }
  };

  const canOpenAsUser = (item: AccountTableRow) => {
    return isSuperAdmin && item.canViewAsUser && !!item.expectedEmail;
  };

  const canManageAccount = (item: AccountTableRow) => {
    return (
      canRunAdminActions && item.role.trim().toLowerCase() !== "superadmin"
    );
  };

  return (
    <div className="card radius-10 border-0 shadow-sm mt-4">
      <div className="card-body">
        {updateToast && (
          <div
            className="position-fixed top-0 end-0 p-3"
            style={{ zIndex: 1080 }}
          >
            <div
              className={`toast show border-0 shadow-lg ${updateToast.tone === "danger" ? "text-bg-danger" : "bg-white text-dark"}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div
                className={`toast-header ${updateToast.tone === "danger" ? "bg-danger text-white" : "bg-primary text-white"}`}
              >
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-25 me-2"
                  style={{ width: "1.65rem", height: "1.65rem" }}
                >
                  <i
                    className={`bi ${updateToast.tone === "danger" ? "bi-exclamation-triangle-fill" : "bi-bell-fill"} ${updateToast.tone === "danger" ? "text-white" : "text-white"}`}
                  ></i>
                </span>
                <strong className="me-auto">{updateToast.title}</strong>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setUpdateToast(null)}
                ></button>
              </div>
              <div className="toast-body">{updateToast.message}</div>
            </div>
          </div>
        )}

        <h5 className="mb-3">Account status oversight</h5>
        <p className="text-secondary mb-3">
          Separate visibility for pending, rejected, and suspended accounts,
          with quick filters for action queues.
        </p>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            className="btn btn-warning text-dark"
            onClick={() => void runPendingAccounts()}
            disabled={loading}
          >
            Load pending approvals ({pendingCount})
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => void runRejectedAccounts()}
            disabled={loading}
          >
            {canShowLoadRejectedCount
              ? `Load rejected accounts (${rejectedCount})`
              : "Load rejected accounts"}
          </button>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => void runSuspendedAccounts()}
            disabled={loading}
          >
            {canShowLoadSuspendedCount
              ? `Load suspended accounts (${suspendedCount})`
              : "Load suspended accounts"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void runAllAccounts()}
            disabled={loading}
          >
            {showAllCount > 0
              ? `Load all accounts (${showAllCount})`
              : "Load all accounts"}
          </button>
        </div>

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
          <h6 className="mb-0 text-uppercase">Account table</h6>
          <span className="badge rounded-pill bg-info text-dark">
            Showing {renderCount} {activeFilterLabel}
          </span>
        </div>

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div
            className="btn-group"
            role="group"
            aria-label="Table export controls"
          >
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => void handleCopy()}
              disabled={loading}
            >
              Copy
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => handleExcel()}
              disabled={loading}
            >
              Excel
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => handlePdf()}
              disabled={loading}
            >
              PDF
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => handlePrint()}
              disabled={loading}
            >
              Print
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label htmlFor="accountTableSearch" className="form-label mb-0">
              Search:
            </label>
            <input
              id="accountTableSearch"
              type="search"
              className="form-control"
              value={tableSearchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search accounts"
              style={{ minWidth: "220px" }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-striped table-bordered align-middle mb-0">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Flat</th>
                <th>Updated</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-secondary py-4">
                    No records found for {activeFilterLabel}.
                  </td>
                </tr>
              ) : (
                pagedRows.map((item) => (
                  <tr key={`${activeFilter}-${item.userId}`}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="account-user-id"
                          title={item.userId}
                          aria-label={`User id ${item.userId}`}
                        >
                          {item.userId}
                        </span>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => void copyUserId(item.userId)}
                          title="Copy user ID"
                        >
                          Copy
                        </button>
                      </div>
                    </td>
                    <td>{item.email}</td>
                    <td>
                      <span className={badgeClassForRole(item.role)}>
                        {item.role}
                      </span>
                    </td>
                    <td>
                      <span className={badgeClassForStatus(item.status)}>
                        {toDisplayStatus(item.status)}
                      </span>
                    </td>
                    <td>{item.flatNumber || "-"}</td>
                    <td>{formatDisplayDateTime(item.updatedAtUtc)}</td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() =>
                            void onOpenAccountFromSearch(
                              item.userId,
                              item.expectedEmail,
                            )
                          }
                          disabled={loading || !canOpenAsUser(item)}
                          title={
                            canOpenAsUser(item)
                              ? "Open this user's dashboard as delegated support"
                              : "View requires SuperAdmin and an active non-SuperAdmin account"
                          }
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-dark btn-sm"
                          onClick={() => openChangeModal(item)}
                          disabled={loading || !canManageAccount(item)}
                          title={
                            canManageAccount(item)
                              ? "Change account status and role"
                              : "SuperAdmin account updates are blocked"
                          }
                        >
                          Change
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
          <div className="small text-secondary">
            Showing {showingFrom} to {showingTo} of {totalEntries} entries
          </div>

          <nav aria-label="Account table pagination">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item${canGoPrev ? "" : " disabled"}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => goToPage(safePage - 1)}
                  disabled={!canGoPrev}
                >
                  Prev
                </button>
              </li>
              {pageNumbers.map((pageNumber) => (
                <li
                  key={pageNumber}
                  className={`page-item${pageNumber === safePage ? " active" : ""}`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => goToPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                </li>
              ))}
              <li className={`page-item${canGoNext ? "" : " disabled"}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => goToPage(safePage + 1)}
                  disabled={!canGoNext}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="small text-secondary mt-2">
          Use the filter buttons to switch the table between all accounts and
          status-specific queues.
        </div>

        {changeModalTarget && (
          <>
            <div
              className="modal fade show d-block"
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="accountStatusChangeModalTitle"
            >
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow">
                  <div
                    className={`modal-header ${changeModalStatusTheme(changeModalTarget.status).header}`}
                  >
                    <h5
                      className="modal-title"
                      id="accountStatusChangeModalTitle"
                    >
                      Confirm account update
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={closeChangeModal}
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <span className="badge rounded-pill bg-secondary">
                        User: {changeModalTarget.userId}
                      </span>
                      <span className="badge rounded-pill bg-light text-dark border">
                        Email: {changeModalTarget.email}
                      </span>
                      <span
                        className={
                          changeModalStatusTheme(changeModalTarget.status).badge
                        }
                      >
                        Current: {toDisplayStatus(changeModalTarget.status)}
                      </span>
                    </div>

                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">
                          Account update target
                        </label>
                        <select
                          className="form-select"
                          value={changeModalIntent}
                          onChange={(event) =>
                            setChangeModalIntent(
                              event.target.value as AccountUpdateIntent,
                            )
                          }
                        >
                          <optgroup label="Status targets">
                            {allStatusOptions.map((statusOption) => (
                              <option
                                key={statusOption.value}
                                value={`status:${statusOption.value}`}
                                disabled={!statusOption.userSelectable}
                              >
                                {statusOption.label}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Direct account actions">
                            <option value="action:move-to-onboarding">
                              Move to onboarding
                            </option>
                            <option value="action:reinstate-approved">
                              Reinstate approved
                            </option>
                            <option value="action:archive">
                              Archive account
                            </option>
                            <option value="action:hard-delete">
                              Hard delete account
                            </option>
                          </optgroup>
                        </select>
                        <div className="form-text">
                          Choose either a target status or a direct account
                          action from the same control.
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Role assignment</label>
                        <select
                          className="form-select"
                          value={changeModalRole}
                          disabled={!isSuperAdmin}
                          onChange={(event) =>
                            setChangeModalRole(
                              event.target.value as
                                | "Resident"
                                | "Admin"
                                | "SuperAdmin",
                            )
                          }
                        >
                          <option value="Resident">Resident</option>
                          <option value="Admin">Admin</option>
                          {isSuperAdmin && (
                            <option value="SuperAdmin">SuperAdmin</option>
                          )}
                        </select>
                        {!isSuperAdmin && (
                          <div className="form-text">
                            Role change is available to SuperAdmin only.
                          </div>
                        )}
                      </div>
                      <div className="col-12">
                        <label className="form-label">Reason</label>
                        <input
                          type="text"
                          className="form-control"
                          value={changeModalReason}
                          onChange={(event) =>
                            setChangeModalReason(event.target.value)
                          }
                          placeholder="Provide an audit reason"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">
                          Confirmation text (auto-generated)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={changeModalConfirmText}
                          readOnly
                        />
                      </div>
                      <div className="col-12">
                        <div className="form-check">
                          <input
                            id="confirmAccountUpdate"
                            className="form-check-input"
                            type="checkbox"
                            checked={changeModalChecked}
                            onChange={(event) =>
                              setChangeModalChecked(event.target.checked)
                            }
                          />
                          <label
                            className="form-check-label"
                            htmlFor="confirmAccountUpdate"
                          >
                            I confirm this change is approved and should be
                            applied now.
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeChangeModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void submitChangeModal()}
                      disabled={loading || !isChangeModalReady()}
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}
      </div>
    </div>
  );
}
