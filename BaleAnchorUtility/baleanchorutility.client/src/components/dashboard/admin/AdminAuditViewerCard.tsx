import { useState } from "react";
import type { AuditLogSummaryItem } from "../../../shared/contracts";

interface AdminAuditViewerCardProps {
  loading: boolean;
  adminMessage: string;
  auditActorUserId: string;
  auditTargetUserId: string;
  auditCategory: string;
  auditAction: string;
  auditEntries: AuditLogSummaryItem[];
  formatDisplayDateTime: (value?: string) => string;
  onAuditActorUserIdChange: (value: string) => void;
  onAuditTargetUserIdChange: (value: string) => void;
  onAuditCategoryChange: (value: string) => void;
  onAuditActionChange: (value: string) => void;
  onLoadAllAuditLogs: () => Promise<void>;
  onLoadAuditLogs: () => Promise<void>;
  onLoadSupportLifecycleAuditLogs: () => Promise<void>;
}

export function AdminAuditViewerCard({
  loading,
  adminMessage,
  auditActorUserId,
  auditTargetUserId,
  auditCategory,
  auditAction,
  auditEntries,
  formatDisplayDateTime,
  onAuditActorUserIdChange,
  onAuditTargetUserIdChange,
  onAuditCategoryChange,
  onAuditActionChange,
  onLoadAllAuditLogs,
  onLoadAuditLogs,
  onLoadSupportLifecycleAuditLogs,
}: AdminAuditViewerCardProps) {
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredEntries = auditEntries.filter((item) => {
    const query = tableSearchTerm.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      item.auditId.toLowerCase().includes(query) ||
      item.actorUserId.toLowerCase().includes(query) ||
      item.targetUserId.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.action.toLowerCase().includes(query) ||
      item.reason.toLowerCase().includes(query) ||
      item.metadata.toLowerCase().includes(query) ||
      item.createdAtUtc.toLowerCase().includes(query)
    );
  });

  const totalEntries = filteredEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedEntries = filteredEntries.slice(startIndex, startIndex + pageSize);
  const showingFrom = totalEntries === 0 ? 0 : startIndex + 1;
  const showingTo = totalEntries === 0 ? 0 : startIndex + pagedEntries.length;
  const canGoPrev = safePage > 1;
  const canGoNext = safePage < totalPages;
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  const handleSearchChange = (value: string) => {
    setTableSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="card radius-10 border-0 shadow-sm mt-4">
      <div className="card-body">
        <h5 className="mb-3">Audit viewer</h5>
        <p className="text-secondary mb-3">
          Review audit activity across account support, lifecycle, and admin
          changes. This page loads all audit records by default.
        </p>

        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-lg-3">
            <label htmlFor="auditActorUserId" className="form-label">
              Actor user ID
            </label>
            <input
              id="auditActorUserId"
              type="text"
              className="form-control"
              placeholder="Actor user ID"
              value={auditActorUserId}
              onChange={(event) => onAuditActorUserIdChange(event.target.value)}
            />
          </div>
          <div className="col-12 col-lg-3">
            <label htmlFor="auditTargetUserId" className="form-label">
              Target user ID
            </label>
            <input
              id="auditTargetUserId"
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
            <label htmlFor="auditCategory" className="form-label">
              Category
            </label>
            <input
              id="auditCategory"
              type="text"
              className="form-control"
              placeholder="Category"
              value={auditCategory}
              onChange={(event) => onAuditCategoryChange(event.target.value)}
            />
          </div>
          <div className="col-12 col-lg-2">
            <label htmlFor="auditAction" className="form-label">
              Action
            </label>
            <input
              id="auditAction"
              type="text"
              className="form-control"
              placeholder="Action"
              value={auditAction}
              onChange={(event) => onAuditActionChange(event.target.value)}
            />
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => void onLoadAllAuditLogs()}
            disabled={loading}
          >
            Load all logs
          </button>
          <button
            type="button"
            className="btn btn-outline-dark"
            onClick={() => void onLoadAuditLogs()}
            disabled={loading}
          >
            Load filtered logs
          </button>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => void onLoadSupportLifecycleAuditLogs()}
            disabled={loading}
          >
            Support & lifecycle
          </button>
        </div>

        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <span className="badge rounded-pill bg-info text-dark">
            Showing {totalEntries} audit record{totalEntries === 1 ? "" : "s"}
          </span>

          <div className="d-flex align-items-center gap-2">
            <label htmlFor="auditTableSearch" className="form-label mb-0">
              Search:
            </label>
            <input
              id="auditTableSearch"
              type="search"
              className="form-control"
              value={tableSearchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search loaded logs"
              style={{ minWidth: "220px" }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-striped table-bordered align-middle mb-0">
            <thead>
              <tr>
                <th>UTC</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Category</th>
                <th>Action</th>
                <th>Reason</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {pagedEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-secondary py-4">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                pagedEntries.map((item) => (
                  <tr key={item.auditId}>
                    <td>{formatDisplayDateTime(item.createdAtUtc)}</td>
                    <td>{item.actorUserId}</td>
                    <td>{item.targetUserId}</td>
                    <td>{item.category}</td>
                    <td>{item.action}</td>
                    <td>{item.reason}</td>
                    <td>{item.metadata || "-"}</td>
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

          <nav aria-label="Audit table pagination">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item${canGoPrev ? "" : " disabled"}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => setCurrentPage(safePage - 1)}
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
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                </li>
              ))}
              <li className={`page-item${canGoNext ? "" : " disabled"}`}>
                <button
                  type="button"
                  className="page-link"
                  onClick={() => setCurrentPage(safePage + 1)}
                  disabled={!canGoNext}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="alert alert-light border mt-3 mb-0" role="status">
          <div className="fw-semibold mb-1">Audit status</div>
          <div>{adminMessage}</div>
        </div>
      </div>
    </div>
  );
}
