import type { PendingApprovalUserItem } from "../../../shared/contracts";

type LifecycleAction =
  | "suspend"
  | "move-to-onboarding"
  | "reinstate-approved"
  | "archive";

interface AdminApprovalActionsCardProps {
  loading: boolean;
  currentUserRole: string;
  adminTargetUserId: string;
  adminReason: string;
  adminRoleTarget: string;
  adminMessage: string;
  pendingApprovals: PendingApprovalUserItem[];
  onAdminTargetUserIdChange: (value: string) => void;
  onAdminReasonChange: (value: string) => void;
  onAdminRoleTargetChange: (value: string) => void;
  onLoadPendingApprovals: () => Promise<void>;
  onSubmitAdminDecision: (action: "approve" | "reject") => Promise<void>;
  onSubmitRoleChange: () => Promise<void>;
  onSubmitAdminLifecycleAction: (action: LifecycleAction) => Promise<void>;
  onHardDeleteAdminUser: () => Promise<void>;
}

export function AdminApprovalActionsCard({
  loading,
  currentUserRole,
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
  onSubmitAdminLifecycleAction,
  onHardDeleteAdminUser,
}: AdminApprovalActionsCardProps) {
  const isSuperAdmin = currentUserRole.trim().toLowerCase() === "superadmin";

  return (
    <div className="card radius-10 border-0 shadow-sm mt-4">
      <div className="card-body">
        <h5 className="mb-3">Approval and account lifecycle actions</h5>
        <p className="text-secondary mb-3">
          Review pending account submissions and run auditable lifecycle
          transitions with a required reason.
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
              onChange={(event) => onAdminReasonChange(event.target.value)}
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
              onChange={(event) => onAdminRoleTargetChange(event.target.value)}
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
          <div className="col-12 col-lg-6">
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-outline-warning"
                onClick={() => void onSubmitAdminLifecycleAction("suspend")}
                disabled={loading}
              >
                Suspend account
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  void onSubmitAdminLifecycleAction("move-to-onboarding")
                }
                disabled={loading}
              >
                Move to onboarding
              </button>
              <button
                type="button"
                className="btn btn-outline-success"
                onClick={() =>
                  void onSubmitAdminLifecycleAction("reinstate-approved")
                }
                disabled={loading}
              >
                Reinstate approved
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => void onSubmitAdminLifecycleAction("archive")}
                disabled={loading}
              >
                Archive account
              </button>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="row g-3 align-items-end mt-1">
            <div className="col-12 col-lg-9">
              <div className="small text-secondary">
                Permanent delete requires account already archived and uses
                confirmation text DELETE {adminTargetUserId || "{targetUserId}"}
                .
              </div>
            </div>
            <div className="col-12 col-lg-3">
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => void onHardDeleteAdminUser()}
                disabled={loading}
              >
                Hard delete account
              </button>
            </div>
          </div>
        )}

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
  );
}
