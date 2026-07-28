import type { ReactNode } from "react";

interface PendingApprovalItem {
  userId: string;
  emailMasked: string;
  submittedState: string;
  updatedAtUtc: string;
}

interface AdminDashboardViewProps {
  shellHeader: ReactNode;
  routeTabs: ReactNode;
  loading: boolean;
  adminTargetUserId: string;
  adminReason: string;
  adminRoleTarget: string;
  adminMessage: string;
  pendingApprovals: PendingApprovalItem[];
  onAdminTargetUserIdChange: (value: string) => void;
  onAdminReasonChange: (value: string) => void;
  onAdminRoleTargetChange: (value: string) => void;
  onLoadPendingApprovals: () => Promise<void>;
  onSubmitAdminDecision: (action: "approve" | "reject") => Promise<void>;
  onSubmitRoleChange: () => Promise<void>;
  formatDisplayDateTime: (value?: string) => string;
}

export function AdminDashboardView({
  shellHeader,
  routeTabs,
  loading,
  adminTargetUserId,
  adminReason,
  adminRoleTarget,
  adminMessage,
  pendingApprovals,
  onAdminTargetUserIdChange,
  onAdminReasonChange,
  onAdminRoleTargetChange,
  onLoadPendingApprovals,
  onSubmitAdminDecision,
  onSubmitRoleChange,
  formatDisplayDateTime,
}: AdminDashboardViewProps) {
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

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Approval actions</h5>
              <p className="text-secondary mb-3">
                Review pending account submissions and apply reasoned approve,
                reject, or role update actions.
              </p>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => void onLoadPendingApprovals()}
                  disabled={loading}
                >
                  Load pending approvals
                </button>
              </div>

              <div className="row g-3 align-items-end">
                <div className="col-12 col-lg-4">
                  <label htmlFor="adminTargetUserId" className="form-label">
                    Target user ID
                  </label>
                  <input
                    id="adminTargetUserId"
                    type="text"
                    className="form-control"
                    placeholder="user id"
                    value={adminTargetUserId}
                    onChange={(event) =>
                      onAdminTargetUserIdChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-5">
                  <label htmlFor="adminReason" className="form-label">
                    Decision reason
                  </label>
                  <input
                    id="adminReason"
                    type="text"
                    className="form-control"
                    placeholder="reason"
                    value={adminReason}
                    onChange={(event) =>
                      onAdminReasonChange(event.target.value)
                    }
                  />
                </div>
                <div className="col-12 col-lg-3">
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={() => void onSubmitAdminDecision("approve")}
                      disabled={loading}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => void onSubmitAdminDecision("reject")}
                      disabled={loading}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>

              <div className="row g-3 align-items-end mt-1">
                <div className="col-12 col-lg-3">
                  <label htmlFor="adminRoleTarget" className="form-label">
                    New role
                  </label>
                  <select
                    id="adminRoleTarget"
                    className="form-select"
                    value={adminRoleTarget}
                    onChange={(event) =>
                      onAdminRoleTargetChange(event.target.value)
                    }
                  >
                    <option value="Resident">Resident</option>
                    <option value="Admin">Admin</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </select>
                </div>
                <div className="col-12 col-lg-3">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => void onSubmitRoleChange()}
                    disabled={loading}
                  >
                    Update role
                  </button>
                </div>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">Admin status</div>
                <div>{adminMessage}</div>
                {pendingApprovals.length > 0 && (
                  <div className="mt-2 text-secondary small">
                    Showing {pendingApprovals.length} pending account(s).
                  </div>
                )}
              </div>
            </div>
          </div>

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
        </div>
      </main>
    </div>
  );
}
