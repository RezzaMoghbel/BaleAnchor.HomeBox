import { useState, type ReactNode } from "react";
import type {
  StatementExportHistoryItemResponse,
  StatementPeriodItemResponse,
  StatementSummaryResponse,
} from "../../shared/contracts";

interface StatementsDashboardViewProps {
  shellHeader: ReactNode;
  routeTabs: ReactNode;
  loading: boolean;
  statementMessage: string;
  selectedSnapshotId: string;
  selectedSnapshotIds: string[];
  selectedStatementSummary: StatementSummaryResponse | null;
  statementPeriods: StatementPeriodItemResponse[];
  statementExportHistory: StatementExportHistoryItemResponse[];
  onRecalculateStatements: () => Promise<boolean>;
  onReloadStatements: () => Promise<void>;
  onLoadSelectedStatementSummary: (snapshotId?: string) => Promise<boolean>;
  onExportSelectedStatementPdf: () => Promise<void>;
  onToggleSnapshotSelection: (snapshotId: string) => void;
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
  selectedSnapshotIds,
  selectedStatementSummary,
  statementPeriods,
  statementExportHistory,
  onRecalculateStatements,
  onReloadStatements,
  onLoadSelectedStatementSummary,
  onExportSelectedStatementPdf,
  onToggleSnapshotSelection,
  formatDateRange,
  formatCurrencyGbp,
  formatDisplayDateTime,
}: StatementsDashboardViewProps) {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRecalculateConfirmOpen, setIsRecalculateConfirmOpen] =
    useState(false);
  const [hasRecalculateAcknowledgement, setHasRecalculateAcknowledgement] =
    useState(false);

  const openStatementDetails = async (snapshotId: string) => {
    const loaded = await onLoadSelectedStatementSummary(snapshotId);
    if (loaded) {
      setIsDetailsModalOpen(true);
    }
  };

  const confirmRecalculate = async () => {
    if (!hasRecalculateAcknowledgement) {
      return;
    }

    await onRecalculateStatements();
    setIsRecalculateConfirmOpen(false);
    setHasRecalculateAcknowledgement(false);
  };

  return (
    <div className="wrapper">
      {shellHeader}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Statements and PDF exports</h1>
              <p className="hero-copy mb-0">
                Select one or more periods, review details in a modal, and
                export selected periods in an A4 PDF pack.
              </p>
            </div>
          </section>

          {routeTabs}

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Actions</h5>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setHasRecalculateAcknowledgement(false);
                    setIsRecalculateConfirmOpen(true);
                  }}
                  disabled={loading}
                >
                  Recalculate
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void onReloadStatements()}
                  disabled={loading}
                >
                  Refresh / Reload
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={() => void onExportSelectedStatementPdf()}
                  disabled={loading || selectedSnapshotIds.length === 0}
                >
                  Export selected
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
                {selectedSnapshotIds.length > 0 && (
                  <div className="mt-1 text-secondary small">
                    Selected periods: {selectedSnapshotIds.length}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Statement periods</h5>
              <div className="table-responsive">
                <table className="table table-striped table-bordered align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: "48px" }}>Select</th>
                      <th>Period</th>
                      <th>Total</th>
                      <th>Difference</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementPeriods.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center text-secondary py-4"
                        >
                          No statement periods loaded yet.
                        </td>
                      </tr>
                    ) : (
                      statementPeriods.map((item) => {
                        const isSelected = selectedSnapshotIds.includes(
                          item.snapshotId,
                        );

                        return (
                          <tr key={item.snapshotId}>
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={isSelected}
                                onChange={() =>
                                  onToggleSnapshotSelection(item.snapshotId)
                                }
                                aria-label={`Select statement period ${formatDateRange(
                                  item.periodStartDate,
                                  item.periodEndDateExclusive,
                                )}`}
                              />
                            </td>
                            <td>
                              {formatDateRange(
                                item.periodStartDate,
                                item.periodEndDateExclusive,
                              )}
                            </td>
                            <td>{formatCurrencyGbp(item.periodTotal)}</td>
                            <td>{formatCurrencyGbp(item.periodDifference)}</td>
                            <td>{item.periodBalanceStatus}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  void openStatementDetails(item.snapshotId)
                                }
                                disabled={loading}
                              >
                                Load
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {isRecalculateConfirmOpen && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                aria-modal="true"
                role="dialog"
              >
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content border-0 shadow">
                    <div className="modal-header bg-warning-subtle">
                      <h5 className="modal-title">Confirm recalculation</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => {
                          setIsRecalculateConfirmOpen(false);
                          setHasRecalculateAcknowledgement(false);
                        }}
                        aria-label="Close"
                        disabled={loading}
                      />
                    </div>
                    <div className="modal-body">
                      <p className="mb-2">
                        Recalculate will regenerate all statement cards using
                        the latest rates and calculation logic.
                      </p>
                      <p className="mb-0 text-secondary small">
                        Existing snapshots are kept for audit history, and new
                        snapshot versions will be added for each period.
                      </p>
                      <div className="form-check mt-3">
                        <input
                          id="recalculateAcknowledgement"
                          className="form-check-input"
                          type="checkbox"
                          checked={hasRecalculateAcknowledgement}
                          onChange={(event) =>
                            setHasRecalculateAcknowledgement(
                              event.target.checked,
                            )
                          }
                          disabled={loading}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="recalculateAcknowledgement"
                        >
                          I understand this will create new snapshot versions
                          for all statement periods.
                        </label>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setIsRecalculateConfirmOpen(false);
                          setHasRecalculateAcknowledgement(false);
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => void confirmRecalculate()}
                        disabled={loading || !hasRecalculateAcknowledgement}
                      >
                        Confirm and recalculate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show" />
            </>
          )}

          {isDetailsModalOpen && selectedStatementSummary && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                aria-modal="true"
                role="dialog"
              >
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                  <div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white">
                      <h5 className="modal-title">Statement details</h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={() => setIsDetailsModalOpen(false)}
                        aria-label="Close"
                      />
                    </div>
                    <div className="modal-body">
                      <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                          <div className="border rounded p-3 h-100">
                            <div className="text-uppercase small text-secondary">
                              Period
                            </div>
                            <div className="fw-semibold">
                              {formatDateRange(
                                selectedStatementSummary.periodStartDate,
                                selectedStatementSummary.periodEndDateExclusive,
                              )}
                            </div>
                            <div className="text-secondary small mt-2">
                              Total{" "}
                              {formatCurrencyGbp(
                                selectedStatementSummary.periodTotal,
                              )}
                            </div>
                            <div className="text-secondary small">
                              Payment{" "}
                              {formatCurrencyGbp(
                                selectedStatementSummary.paymentAmount ??
                                  "0.00",
                              )}
                            </div>
                            <div className="text-secondary small">
                              Difference{" "}
                              {formatCurrencyGbp(
                                selectedStatementSummary.periodDifference,
                              )}
                            </div>
                            <div className="text-secondary small">
                              Status{" "}
                              {selectedStatementSummary.periodBalanceStatus}
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="border rounded p-3 h-100">
                            <div className="text-uppercase small text-secondary">
                              Integrity
                            </div>
                            <div className="text-secondary small mt-1">
                              Estimated segments{" "}
                              {selectedStatementSummary.containsEstimatedSegments
                                ? "Yes"
                                : "No"}
                            </div>
                            <div className="text-secondary small">
                              Engine {selectedStatementSummary.engineVersion}
                            </div>
                            <div className="text-secondary small">
                              Rounding{" "}
                              {selectedStatementSummary.roundingPolicyVersion}
                            </div>
                            <div className="text-secondary small">
                              Input hash {selectedStatementSummary.inputHash}
                            </div>
                            <div className="text-secondary small">
                              Integrity{" "}
                              {selectedStatementSummary.integrityChecksPassed
                                ? "Passed"
                                : "Failed"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="table-responsive mb-4">
                        <table className="table table-striped table-bordered align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Component</th>
                              <th>Usage</th>
                              <th>Usage subtotal</th>
                              <th>Standing subtotal</th>
                              <th>VAT</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedStatementSummary.componentLines.map(
                              (line) => (
                                <tr key={line.component}>
                                  <td>{line.component}</td>
                                  <td>{line.usage}</td>
                                  <td>
                                    {formatCurrencyGbp(line.usageSubtotal)}
                                  </td>
                                  <td>
                                    {formatCurrencyGbp(line.standingSubtotal)}
                                  </td>
                                  <td>{formatCurrencyGbp(line.vatAmount)}</td>
                                  <td>{formatCurrencyGbp(line.total)}</td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="table-responsive">
                        <table className="table table-striped table-bordered align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Segment</th>
                              <th>Days</th>
                              <th>Estimated</th>
                              <th>Usage allocation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedStatementSummary.tariffSegments.map(
                              (segment) => (
                                <tr
                                  key={`${segment.startDate}-${segment.endDateExclusive}`}
                                >
                                  <td>
                                    {formatDateRange(
                                      segment.startDate,
                                      segment.endDateExclusive,
                                    )}
                                  </td>
                                  <td>{segment.days}</td>
                                  <td>
                                    {segment.isEstimatedAllocation
                                      ? "Yes"
                                      : "No"}
                                  </td>
                                  <td>
                                    Cold {segment.coldWaterUsage}, hot{" "}
                                    {segment.hotWaterUsage}, apartment{" "}
                                    {segment.apartmentElectricityUsage}, boiler{" "}
                                    {segment.boilerElectricityUsage}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setIsDetailsModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show" />
            </>
          )}

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
                        <th>SHA-256</th>
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
                          <td>{item.contentSha256}</td>
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
