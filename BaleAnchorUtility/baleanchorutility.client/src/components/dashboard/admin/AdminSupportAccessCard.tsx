import { useState } from "react";
import type { AdminUserSummaryItem } from "../../../shared/contracts";

interface AdminSupportAccessCardProps {
  loading: boolean;
  isSuperAdmin: boolean;
  adminTargetUserId: string;
  adminReason: string;
  adminUsers: AdminUserSummaryItem[];
  onAdminTargetUserIdChange: (value: string) => void;
  onAdminSearchQueryChange: (value: string) => void;
  onAdminSearchStatusChange: (value: string) => void;
  onSearchAdminUsers: () => Promise<void>;
  onStartDelegatedSupportSession: (request: {
    targetUserId: string;
    reason: string;
    expectedEmail?: string;
    expectedFlatNumber?: string;
    expectedDateOfBirth?: string;
  }) => Promise<boolean>;
}

export function AdminSupportAccessCard({
  loading,
  isSuperAdmin,
  adminTargetUserId,
  adminReason,
  adminUsers,
  onAdminTargetUserIdChange,
  onAdminSearchQueryChange,
  onAdminSearchStatusChange,
  onSearchAdminUsers,
  onStartDelegatedSupportSession,
}: AdminSupportAccessCardProps) {
  const [assistedFlatNumber, setAssistedFlatNumber] = useState("");
  const [assistedEmail, setAssistedEmail] = useState("");
  const [assistedDateOfBirth, setAssistedDateOfBirth] = useState("");

  const runAssistedSearch = async () => {
    const query = assistedEmail.trim() || assistedFlatNumber.trim();
    onAdminSearchQueryChange(query);
    onAdminSearchStatusChange("");
    await onSearchAdminUsers();
  };

  const startDelegatedLogin = async () => {
    const started = await onStartDelegatedSupportSession({
      targetUserId: adminTargetUserId,
      reason: adminReason,
      expectedEmail: assistedEmail.trim() || undefined,
      expectedFlatNumber: assistedFlatNumber.trim() || undefined,
      expectedDateOfBirth: assistedDateOfBirth.trim() || undefined,
    });

    if (started) {
      window.location.assign("/dashboard");
    }
  };

  return (
    <div className="card radius-10 border-0 shadow-sm mt-4">
      <div className="card-body">
        <h5 className="mb-3">SuperAdmin assisted account access</h5>
        <p className="text-secondary mb-3">
          When residents contact support, SuperAdmin can locate and prepare
          account access by flat number, email, and date of birth without
          requesting resident passwords.
        </p>

        {isSuperAdmin && (
          <div className="alert alert-info border mb-3" role="status">
            <div className="fw-semibold mb-1">SuperAdmin rule</div>
            <div>
              SuperAdmin does not use resident self-service readings and tariff
              entry for personal use. Account operations are performed through
              targeted resident and admin records.
            </div>
          </div>
        )}

        <div className="row g-3 align-items-end">
          <div className="col-12 col-lg-3">
            <label className="form-label">Flat number</label>
            <input
              type="text"
              className="form-control"
              placeholder="A12"
              value={assistedFlatNumber}
              onChange={(event) => setAssistedFlatNumber(event.target.value)}
            />
          </div>
          <div className="col-12 col-lg-4">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="resident@example.com"
              value={assistedEmail}
              onChange={(event) => setAssistedEmail(event.target.value)}
            />
          </div>
          <div className="col-12 col-lg-3">
            <label className="form-label">Date of birth</label>
            <input
              type="date"
              className="form-control"
              value={assistedDateOfBirth}
              onChange={(event) => setAssistedDateOfBirth(event.target.value)}
            />
          </div>
          <div className="col-12 col-lg-2">
            <button
              type="button"
              className="btn btn-outline-dark w-100"
              onClick={() => void runAssistedSearch()}
              disabled={loading}
            >
              Find account
            </button>
          </div>
        </div>

        <div className="row g-3 align-items-end mt-1">
          <div className="col-12 col-lg-6">
            <label className="form-label">
              Target user ID for support login
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="user id"
              value={adminTargetUserId}
              onChange={(event) =>
                onAdminTargetUserIdChange(event.target.value)
              }
            />
          </div>
          <div className="col-12 col-lg-6">
            <label className="form-label">Quick pick from current search</label>
            <select
              className="form-select"
              value={adminTargetUserId}
              onChange={(event) =>
                onAdminTargetUserIdChange(event.target.value)
              }
            >
              <option value="">Select user</option>
              {adminUsers.slice(0, 50).map((item) => (
                <option key={item.userId} value={item.userId}>
                  {item.userId} | {item.email} | {item.status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void startDelegatedLogin()}
            disabled={loading}
          >
            Start login on behalf
          </button>
        </div>

        <div className="small text-secondary mt-2">
          Delegated support sessions are short-lived and require a reason plus
          at least one resident verification signal.
        </div>
      </div>
    </div>
  );
}
