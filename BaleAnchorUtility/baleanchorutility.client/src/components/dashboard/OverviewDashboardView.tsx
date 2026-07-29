import type { ReactNode } from "react";
import type { SessionStatusResponse } from "../../shared/contracts";

interface OverviewDashboardViewProps {
  shellHeader: ReactNode;
  routeTabs: ReactNode;
  session: SessionStatusResponse | null;
  statusMessage: string;
  formatDisplayDateTime: (value?: string) => string;
}

export function OverviewDashboardView({
  shellHeader,
  routeTabs,
  session,
  statusMessage,
  formatDisplayDateTime,
}: OverviewDashboardViewProps) {
  return (
    <div className="wrapper">
      {shellHeader}

      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Resident dashboard overview</h1>
              <p className="hero-copy mb-0">
                Your secure utility workspace is now route-based. Use the tabs
                below to manage onboarding, readings, payments, and statements.
              </p>
            </div>
          </section>

          {routeTabs}

          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-4">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-secondary">Session state</p>
                      <h4 className="mb-0">
                        {session?.isAuthenticated ? "Active" : "Inactive"}
                      </h4>
                    </div>
                    <div className="widget-icon bg-light-primary text-primary">
                      <i className="bi bi-shield-lock"></i>
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
                      <p className="mb-1 text-secondary">User status</p>
                      <h4 className="mb-0">
                        {session?.userStatus ?? "Unknown"}
                      </h4>
                    </div>
                    <div className="widget-icon bg-light-success text-success">
                      <i className="bi bi-person-check"></i>
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
                      <p className="mb-1 text-secondary">Role</p>
                      <h4 className="mb-0">
                        {session?.userRole ?? "Resident"}
                      </h4>
                    </div>
                    <div className="widget-icon bg-light-danger text-danger">
                      <i className="bi bi-person-badge"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Live status</h5>
              <div className="alert alert-light border mb-3" role="status">
                <div className="fw-semibold mb-1">Status</div>
                <div>{statusMessage}</div>
                {session?.expiresAtUtc && (
                  <div className="mt-2 text-secondary small">
                    Session expiry:{" "}
                    {formatDisplayDateTime(session.expiresAtUtc)}
                  </div>
                )}
              </div>

              <p className="text-secondary mb-3">
                Continue through the dedicated route pages to keep each utility
                workflow isolated, testable, and ready for production hardening.
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
                <span className="badge rounded-pill bg-light text-dark border">
                  Push subscriptions
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
