import type {
  AdminUserSummaryItem,
  PendingApprovalUserItem,
} from "../../../shared/contracts";

interface AdminAccountStatusCardProps {
  loading: boolean;
  pendingApprovals: PendingApprovalUserItem[];
  adminUsers: AdminUserSummaryItem[];
  onLoadPendingApprovals: () => Promise<void>;
  onAdminSearchStatusChange: (value: string) => void;
  onSearchAdminUsers: () => Promise<void>;
}

export function AdminAccountStatusCard({
  loading,
  pendingApprovals,
  adminUsers,
  onLoadPendingApprovals,
  onAdminSearchStatusChange,
  onSearchAdminUsers,
}: AdminAccountStatusCardProps) {
  const rejectedUsers = adminUsers.filter(
    (item) => item.status.trim().toLowerCase() === "rejected",
  );
  const suspendedUsers = adminUsers.filter(
    (item) => item.status.trim().toLowerCase() === "suspended",
  );

  const loadUsersByStatus = async (status?: string) => {
    onAdminSearchStatusChange(status ?? "");
    await onSearchAdminUsers();
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
            className="btn btn-outline-dark"
            onClick={() => void onLoadPendingApprovals()}
            disabled={loading}
          >
            Load pending approvals ({pendingApprovals.length})
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => void loadUsersByStatus("Rejected")}
            disabled={loading}
          >
            Load rejected accounts
          </button>
          <button
            type="button"
            className="btn btn-outline-warning"
            onClick={() => void loadUsersByStatus("Suspended")}
            disabled={loading}
          >
            Load suspended accounts
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => void loadUsersByStatus()}
            disabled={loading}
          >
            Load all accounts
          </button>
        </div>

        <div className="row g-3">
          <div className="col-12 col-xl-6">
            <div className="alert alert-light border mb-0" role="status">
              <div className="fw-semibold mb-2">Rejected accounts</div>
              {rejectedUsers.length === 0 ? (
                <div className="small text-secondary">
                  No rejected accounts in current loaded result.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Email</th>
                        <th>Flat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rejectedUsers.slice(0, 10).map((item) => (
                        <tr key={item.userId}>
                          <td>{item.userId}</td>
                          <td>{item.email}</td>
                          <td>{item.flatNumber ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="col-12 col-xl-6">
            <div className="alert alert-light border mb-0" role="status">
              <div className="fw-semibold mb-2">Suspended accounts</div>
              {suspendedUsers.length === 0 ? (
                <div className="small text-secondary">
                  No suspended accounts in current loaded result.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Email</th>
                        <th>Flat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspendedUsers.slice(0, 10).map((item) => (
                        <tr key={item.userId}>
                          <td>{item.userId}</td>
                          <td>{item.email}</td>
                          <td>{item.flatNumber ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
