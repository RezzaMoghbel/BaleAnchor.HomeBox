import { useState } from "react";
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

interface AdminAccountStatusCardProps {
  loading: boolean;
  isSuperAdmin: boolean;
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
}

export function AdminAccountStatusCard({
  loading,
  isSuperAdmin,
  pendingApprovals,
  adminUsers,
  formatDisplayDateTime,
  onLoadPendingApprovals,
  onSearchAdminUsers,
  onOpenAccountFromSearch,
}: AdminAccountStatusCardProps) {
  const [activeFilter, setActiveFilter] = useState<AccountFilter>("all");
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  return (
    <div className="card radius-10 border-0 shadow-sm mt-4">
      <div className="card-body">
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
      </div>
    </div>
  );
}
