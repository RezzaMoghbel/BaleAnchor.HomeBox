import type { ReactNode } from "react";
import { DevelopmentSeedAccessCard } from "./DevelopmentSeedAccessCard";
import type {
  FieldErrors,
  SessionStatusResponse,
} from "../../shared/contracts";
import { getFieldErrors } from "../../shared/problemDetails";

interface LoginViewProps {
  shellHeader: ReactNode;
  session: SessionStatusResponse | null;
  email: string;
  code: string;
  loginFieldErrors: FieldErrors;
  loading: boolean;
  statusMessage: string;
  onEmailChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onRequestCode: () => Promise<void>;
  onVerifyCode: () => Promise<void>;
  onRefreshSession: () => Promise<void>;
  onLogout: () => Promise<void>;
  formatDisplayDateTime: (value?: string) => string;
}

export function LoginView({
  shellHeader,
  session,
  email,
  code,
  loginFieldErrors,
  loading,
  statusMessage,
  onEmailChange,
  onCodeChange,
  onRequestCode,
  onVerifyCode,
  onRefreshSession,
  onLogout,
  formatDisplayDateTime,
}: LoginViewProps) {
  return (
    <div className="wrapper">
      {shellHeader}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <div className="row g-4 align-items-center">
                <div className="col-12 col-xl-7">
                  <span className="hero-eyebrow">Resident portal</span>
                  <h1 className="hero-title mb-3">
                    Sign in with your email OTP and continue into your utility
                    workspace.
                  </h1>
                  <p className="hero-copy mb-4">
                    BaleAnchor Utility is moving from prototype screens to a
                    resident-first experience with secure session handling,
                    statements, payments, and transparent calculations.
                  </p>

                  <div className="d-flex flex-wrap gap-2 mb-4">
                    <span className="feature-chip">Email OTP login</span>
                    <span className="feature-chip">Secure session cookie</span>
                    <span className="feature-chip">Resident-specific data</span>
                    <span className="feature-chip">Transparent statements</span>
                  </div>

                  <div className="hero-metrics row g-3">
                    <div className="col-12 col-md-4">
                      <div className="metric-card">
                        <div className="metric-label">Sign-in state</div>
                        <div className="metric-value">
                          {session?.isAuthenticated ? "Active" : "Awaiting OTP"}
                        </div>
                        <div className="metric-note">
                          {session?.emailMasked ?? "No session yet"}
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="metric-card">
                        <div className="metric-label">Current access</div>
                        <div className="metric-value">
                          {session?.userStatus ?? "Not loaded"}
                        </div>
                        <div className="metric-note">
                          Account state returned by the server
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="metric-card">
                        <div className="metric-label">Next step</div>
                        <div className="metric-value">OTP flow</div>
                        <div className="metric-note">
                          Request code, verify, then continue
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-xl-5">
                  <div className="auth-panel card border-0 shadow-sm h-100">
                    <div className="card-body p-4 p-xl-4">
                      <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                        <div>
                          <div className="auth-panel__eyebrow">Login</div>
                          <h2 className="auth-panel__title mb-1">
                            Resume your resident session
                          </h2>
                          <p className="auth-panel__copy mb-0">
                            Use the email OTP flow already wired to the server.
                          </p>
                        </div>
                        <div
                          className={`auth-status-pill ${session?.isAuthenticated ? "auth-status-pill--active" : ""}`}
                        >
                          {session?.isAuthenticated
                            ? "Signed in"
                            : "Not signed in"}
                        </div>
                      </div>

                      <div className="row g-3 align-items-end">
                        <div className="col-12 col-md-7">
                          <label htmlFor="email-login" className="form-label">
                            Email
                          </label>
                          <input
                            id="email-login"
                            type="email"
                            className={`form-control form-control-lg ${getFieldErrors(loginFieldErrors, "email").length > 0 ? "is-invalid" : ""}`}
                            placeholder="resident@example.com"
                            value={email}
                            onChange={(event) =>
                              onEmailChange(event.target.value)
                            }
                          />
                          {getFieldErrors(loginFieldErrors, "email").length >
                            0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(loginFieldErrors, "email").join(
                                " ",
                              )}
                            </div>
                          )}
                        </div>
                        <div className="col-12 col-md-5">
                          <label htmlFor="code-login" className="form-label">
                            OTP code
                          </label>
                          <input
                            id="code-login"
                            type="text"
                            className={`form-control form-control-lg ${getFieldErrors(loginFieldErrors, "code").length > 0 ? "is-invalid" : ""}`}
                            placeholder="123456"
                            value={code}
                            onChange={(event) =>
                              onCodeChange(event.target.value)
                            }
                            maxLength={6}
                          />
                          {getFieldErrors(loginFieldErrors, "code").length >
                            0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(loginFieldErrors, "code").join(
                                " ",
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="d-flex flex-wrap gap-2 mt-3">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => void onRequestCode()}
                          disabled={loading || !email}
                        >
                          Request code
                        </button>
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={() => void onVerifyCode()}
                          disabled={loading || !email || code.length !== 6}
                        >
                          Verify code
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => void onRefreshSession()}
                          disabled={loading}
                        >
                          Check session
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => void onLogout()}
                          disabled={loading}
                        >
                          Sign out
                        </button>
                      </div>

                      <div
                        className="alert alert-light border mt-3 mb-0 auth-status-box"
                        role="status"
                      >
                        <div className="fw-semibold mb-1">Status</div>
                        <div>{statusMessage}</div>
                        {session && (
                          <div className="mt-2 text-secondary small">
                            Session:{" "}
                            {session.isAuthenticated ? "Active" : "Inactive"}
                            {session.emailMasked
                              ? ` | User: ${session.emailMasked}`
                              : ""}
                            {session.userStatus
                              ? ` | Account state: ${session.userStatus}`
                              : ""}
                            {session.expiresAtUtc
                              ? ` | Expires: ${formatDisplayDateTime(session.expiresAtUtc)}`
                              : ""}
                          </div>
                        )}
                      </div>

                      <DevelopmentSeedAccessCard
                        loading={loading}
                        onUseSeedEmail={onEmailChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
