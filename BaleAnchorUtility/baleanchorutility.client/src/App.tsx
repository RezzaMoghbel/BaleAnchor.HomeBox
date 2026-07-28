import "./App.css";

function App() {
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
        </div>
      </main>
    </div>
  );
}

export default App;
