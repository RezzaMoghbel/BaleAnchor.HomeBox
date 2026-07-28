import { useState } from "react";
import "./App.css";

interface RequestCodeResponse {
  message: string;
  resendAfterSeconds: number;
  expiresInSeconds: number;
}

interface VerifyCodeResponse {
  authenticated: boolean;
  userStatus: string;
  message: string;
}

interface SessionStatusResponse {
  isAuthenticated: boolean;
  userId?: string;
  emailMasked?: string;
  userStatus?: string;
  expiresAtUtc?: string;
}

function App() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [session, setSession] = useState<SessionStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const requestCode = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/request-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const body = (await response.json()) as RequestCodeResponse;
      setStatusMessage(
        `${body.message} Expires in ${body.expiresInSeconds}s. Resend after ${body.resendAfterSeconds}s.`
      );
    } catch {
      setStatusMessage("Failed to request OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
        credentials: "include",
      });

      const body = (await response.json()) as VerifyCodeResponse;
      setStatusMessage(`${body.message} Current user status: ${body.userStatus}.`);
    } catch {
      setStatusMessage("Failed to verify OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/session", {
        method: "GET",
        credentials: "include",
      });

      const body = (await response.json()) as SessionStatusResponse;
      setSession(body);
      setStatusMessage(body.isAuthenticated ? "Session is active." : "No active session.");
    } catch {
      setStatusMessage("Failed to retrieve session status.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setSession(null);
      setStatusMessage("Signed out successfully.");
    } catch {
      setStatusMessage("Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <header className="top-header">
        <nav className="navbar navbar-expand align-items-center justify-content-between px-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-buildings fs-4 text-primary"></i>
            <div>
              <h5 className="mb-0 fw-bold">BaleAnchor Utility</h5>
              <small className="text-secondary">Resident Portal</small>
            </div>
          </div>
          <span className="badge bg-light text-dark border">
            Prototype Shell
          </span>
        </nav>
      </header>

      <main className="page-content p-4">
        <div className="container-fluid">
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-4">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-secondary">
                        Current Period Estimate
                      </p>
                      <h4 className="mb-0">£0.00</h4>
                    </div>
                    <div className="widget-icon bg-light-primary text-primary">
                      <i className="bi bi-cash-stack"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-secondary">Last Reading Date</p>
                      <h4 className="mb-0">Not submitted</h4>
                    </div>
                    <div className="widget-icon bg-light-success text-success">
                      <i className="bi bi-droplet-half"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-secondary">Balance</p>
                      <h4 className="mb-0">£0.00</h4>
                    </div>
                    <div className="widget-icon bg-light-danger text-danger">
                      <i className="bi bi-receipt"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Build Scope (from CLAUDE.md)</h5>
              <p className="text-secondary mb-3">
                This shell now uses the project template style and will be
                iteratively filled with the full resident onboarding, readings,
                tariffs, calculations, payments, statements, notifications, and
                admin flows specified in CLAUDE.md.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge rounded-pill bg-light text-dark border">
                  Email OTP onboarding
                </span>
                <span className="badge rounded-pill bg-light text-dark border">
                  Combined readings
                </span>
                <span className="badge rounded-pill bg-light text-dark border">
                  Independent tariffs
                </span>
                <span className="badge rounded-pill bg-light text-dark border">
                  Transparent equations
                </span>
                <span className="badge rounded-pill bg-light text-dark border">
                  PDF statements
                </span>
                <span className="badge rounded-pill bg-light text-dark border">
                  PWA reminders
                </span>
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Authentication Prototype (OTP)</h5>
              <p className="text-secondary mb-3">
                This slice validates the CLAUDE auth direction: request code, verify code, server-side session, and
                secure cookie flow.
              </p>

              <div className="row g-3 align-items-end">
                <div className="col-12 col-lg-4">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    placeholder="resident@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="code" className="form-label">
                    OTP code
                  </label>
                  <input
                    id="code"
                    type="text"
                    className="form-control"
                    placeholder="123456"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    maxLength={6}
                  />
                </div>
                <div className="col-12 col-lg-6">
                  <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-primary" onClick={requestCode} disabled={loading || !email}>
                      Request code
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={verifyCode}
                      disabled={loading || !email || code.length !== 6}
                    >
                      Verify code
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={refreshSession} disabled={loading}>
                      Check session
                    </button>
                    <button type="button" className="btn btn-outline-danger" onClick={logout} disabled={loading}>
                      Sign out
                    </button>
                  </div>
                </div>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">Status</div>
                <div>{statusMessage}</div>
                {session && (
                  <div className="mt-2 text-secondary small">
                    Session: {session.isAuthenticated ? "Active" : "Inactive"}
                    {session.emailMasked ? ` | User: ${session.emailMasked}` : ""}
                    {session.userStatus ? ` | Account state: ${session.userStatus}` : ""}
                    {session.expiresAtUtc ? ` | Expires: ${session.expiresAtUtc}` : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
