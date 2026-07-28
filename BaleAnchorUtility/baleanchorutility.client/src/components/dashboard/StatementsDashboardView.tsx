import type { ReactNode } from "react";

interface StatementSummary {
  periodStartDate: string;
  periodEndDateExclusive: string;
  periodTotal: string;
  paymentAmount?: string;
  periodDifference: string;
  periodBalanceStatus: string;
  currentBalance?: string;
  currentBalanceStatus?: string;
  containsEstimatedSegments?: boolean;
}

interface StatementPeriodItem {
  snapshotId: string;
  periodStartDate: string;
  periodEndDateExclusive: string;
  periodTotal: string;
  periodDifference: string;
  periodBalanceStatus: string;
}

interface StatementExportHistoryItem {
  exportId: string;
  periodStartDate: string;
  periodEndDateExclusive: string;
  templateVersion: string;
  rendererVersion: string;
  createdAtUtc: string;
}

interface StatementsDashboardViewProps {
  shellHeader: ReactNode;
  routeTabs: ReactNode;
  loading: boolean;
  statementMessage: string;
  selectedSnapshotId: string;
  latestStatementSummary: StatementSummary | null;
  selectedStatementSummary: StatementSummary | null;
  statementPeriods: StatementPeriodItem[];
  statementExportHistory: StatementExportHistoryItem[];
  onLoadLatestStatementSummary: () => Promise<void>;
  onLoadStatementPeriods: () => Promise<void>;
  onLoadSelectedStatementSummary: (snapshotId?: string) => Promise<void>;
  onExportSelectedStatementPdf: (snapshotId?: string) => Promise<void>;
  onLoadStatementExportHistory: () => Promise<void>;
  onSelectSnapshotId: (snapshotId: string) => void;
  formatDateRange: (startDate: string, endDateExclusive: string) => string;
  formatCurrencyGbp: (value?: string) => string;
  formatDisplayDateTime: (value?: string) => string;
}

export function StatementsDashboardView({
  shellHeader,
  routeTabs,
  loading,
  statementMessage,
  selectedSnapshotId,
  latestStatementSummary,
  selectedStatementSummary,
  statementPeriods,
  statementExportHistory,
  onLoadLatestStatementSummary,
  onLoadStatementPeriods,
  onLoadSelectedStatementSummary,
  onExportSelectedStatementPdf,
  onLoadStatementExportHistory,
  onSelectSnapshotId,
  formatDateRange,
  formatCurrencyGbp,
  formatDisplayDateTime,
}: StatementsDashboardViewProps) {
  return (
    <div className="wrapper">
      {shellHeader}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Statements and PDF exports</h1>
              <p className="hero-copy mb-0">
                Review latest and selected period statements, then export a
                traceable PDF with versioned renderer metadata.
              </p>
            </div>
          </section>

          {routeTabs}

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Statement actions</h5>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => void onLoadLatestStatementSummary()}
                  disabled={loading}
                >
                  Load latest summary
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void onLoadStatementPeriods()}
                  disabled={loading}
                >
                  Load statement periods
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void onLoadSelectedStatementSummary()}
                  disabled={loading || !selectedSnapshotId}
                >
                  Load selected summary
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={() => void onExportSelectedStatementPdf()}
                  disabled={loading || !selectedSnapshotId}
                >
                  Export selected PDF
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => void onLoadStatementExportHistory()}
                  disabled={loading}
                >
                  Load export history
                </button>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">Statement status</div>
                <div>{statementMessage}</div>
                {selectedSnapshotId && (
                  <div className="mt-2 text-secondary small">
                    Selected snapshot: {selectedSnapshotId}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="row g-4 mt-1">
            <div className="col-12 col-xl-6">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="mb-3">Latest statement summary</h5>
                  {latestStatementSummary ? (
                    <div className="text-secondary small">
                      <div>
                        Period:{" "}
                        {formatDateRange(
                          latestStatementSummary.periodStartDate,
                          latestStatementSummary.periodEndDateExclusive,
                        )}
                      </div>
                      <div>
                        Period total:{" "}
                        {formatCurrencyGbp(latestStatementSummary.periodTotal)}
                      </div>
                      <div>
                        Payment:{" "}
                        {formatCurrencyGbp(
                          latestStatementSummary.paymentAmount ?? "0.00",
                        )}
                      </div>
                      <div>
                        Difference:{" "}
                        {formatCurrencyGbp(
                          latestStatementSummary.periodDifference,
                        )}
                      </div>
                      <div>
                        Status: {latestStatementSummary.periodBalanceStatus}
                      </div>
                      <div>
                        Current balance:{" "}
                        {formatCurrencyGbp(latestStatementSummary.currentBalance)}
                      </div>
                      <div>
                        Balance status:{" "}
                        {latestStatementSummary.currentBalanceStatus}
                      </div>
                    </div>
                  ) : (
                    <p className="text-secondary mb-0">
                      No latest summary loaded yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-6">
              <div className="card radius-10 border-0 shadow-sm h-100">
                <div className="card-body">
                  <h5 className="mb-3">Selected statement summary</h5>
                  {selectedStatementSummary ? (
                    <div className="text-secondary small">
                      <div>
                        Period:{" "}
                        {formatDateRange(
                          selectedStatementSummary.periodStartDate,
                          selectedStatementSummary.periodEndDateExclusive,
                        )}
                      </div>
                      <div>
                        Period total:{" "}
                        {formatCurrencyGbp(selectedStatementSummary.periodTotal)}
                      </div>
                      <div>
                        Payment:{" "}
                        {formatCurrencyGbp(
                          selectedStatementSummary.paymentAmount ?? "0.00",
                        )}
                      </div>
                      <div>
                        Difference:{" "}
                        {formatCurrencyGbp(
                          selectedStatementSummary.periodDifference,
                        )}
                      </div>
                      <div>
                        Status: {selectedStatementSummary.periodBalanceStatus}
                      </div>
                      <div>
                        Estimated segments:{" "}
                        {selectedStatementSummary.containsEstimatedSegments
                          ? "Yes"
                          : "No"}
                      </div>
                    </div>
                  ) : (
                    <p className="text-secondary mb-0">
                      No selected summary loaded yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Statement periods</h5>
              {statementPeriods.length === 0 ? (
                <p className="text-secondary mb-0">
                  No statement periods loaded yet.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Total</th>
                        <th>Difference</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementPeriods.slice(0, 12).map((item) => (
                        <tr key={item.snapshotId}>
                          <td>
                            {formatDateRange(
                              item.periodStartDate,
                              item.periodEndDateExclusive,
                            )}
                          </td>
                          <td>{formatCurrencyGbp(item.periodTotal)}</td>
                          <td>{formatCurrencyGbp(item.periodDifference)}</td>
                          <td>{item.periodBalanceStatus}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={`btn btn-sm ${selectedSnapshotId === item.snapshotId ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={() => onSelectSnapshotId(item.snapshotId)}
                              >
                                {selectedSnapshotId === item.snapshotId
                                  ? "Selected"
                                  : "Select"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  void onLoadSelectedStatementSummary(
                                    item.snapshotId,
                                  )
                                }
                                disabled={loading}
                              >
                                Load
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() =>
                                  void onExportSelectedStatementPdf(item.snapshotId)
                                }
                                disabled={loading}
                              >
                                Export
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Export history</h5>
              {statementExportHistory.length === 0 ? (
                <p className="text-secondary mb-0">No exports loaded yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Export ID</th>
                        <th>Period</th>
                        <th>Template</th>
                        <th>Renderer</th>
                        <th>Created UTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementExportHistory.slice(0, 10).map((item) => (
                        <tr key={item.exportId}>
                          <td>{item.exportId}</td>
                          <td>
                            {formatDateRange(
                              item.periodStartDate,
                              item.periodEndDateExclusive,
                            )}
                          </td>
                          <td>{item.templateVersion}</td>
                          <td>{item.rendererVersion}</td>
                          <td>{formatDisplayDateTime(item.createdAtUtc)}</td>
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
