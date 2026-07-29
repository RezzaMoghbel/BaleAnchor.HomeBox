import type { ReactNode } from "react";
import type {
  AllTimeBalanceResponse,
  FieldErrors,
  LatestPeriodPaymentSummaryResponse,
  PaymentHistoryItemResponse,
} from "../../shared/contracts";

interface PaymentsDashboardViewProps {
  shellHeader: ReactNode;
  routeTabs: ReactNode;
  loading: boolean;
  paymentAmount: string;
  paymentDate: string;
  paymentMethod: string;
  paymentReference: string;
  paymentNotes: string;
  paymentFieldErrors: FieldErrors;
  paymentMessage: string;
  latestPaymentSummary: LatestPeriodPaymentSummaryResponse | null;
  balanceSummary: AllTimeBalanceResponse | null;
  paymentHistory: PaymentHistoryItemResponse[];
  editingPaymentId: string | null;
  getFieldErrors: (errors: FieldErrors, fieldName: string) => string[];
  onPaymentAmountChange: (value: string) => void;
  onPaymentDateChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onPaymentReferenceChange: (value: string) => void;
  onPaymentNotesChange: (value: string) => void;
  onRecordLatestPeriodPayment: () => Promise<void>;
  onBeginPaymentEdit: (item: PaymentHistoryItemResponse) => void;
  onCancelPaymentEdit: () => void;
  onDeletePayment: (paymentId: string) => Promise<void>;
  onLoadLatestPeriodPaymentSummary: () => Promise<void>;
  onLoadPaymentHistory: () => Promise<void>;
  onLoadAllTimeBalance: () => Promise<void>;
  formatDateRange: (startDate: string, endDateExclusive: string) => string;
  formatDisplayDate: (value?: string) => string;
  formatCurrencyGbp: (value?: string) => string;
}

export function PaymentsDashboardView({
  shellHeader,
  routeTabs,
  loading,
  paymentAmount,
  paymentDate,
  paymentMethod,
  paymentReference,
  paymentNotes,
  paymentFieldErrors,
  paymentMessage,
  latestPaymentSummary,
  balanceSummary,
  paymentHistory,
  editingPaymentId,
  getFieldErrors,
  onPaymentAmountChange,
  onPaymentDateChange,
  onPaymentMethodChange,
  onPaymentReferenceChange,
  onPaymentNotesChange,
  onRecordLatestPeriodPayment,
  onBeginPaymentEdit,
  onCancelPaymentEdit,
  onDeletePayment,
  onLoadLatestPeriodPaymentSummary,
  onLoadPaymentHistory,
  onLoadAllTimeBalance,
  formatDateRange,
  formatDisplayDate,
  formatCurrencyGbp,
}: PaymentsDashboardViewProps) {
  return (
    <div className="wrapper">
      {shellHeader}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Payments and balance tracking</h1>
              <p className="hero-copy mb-0">
                Record one payment for the latest period, review payment
                history, and track the all-time balance state.
              </p>
            </div>
          </section>

          {routeTabs}

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Record latest-period payment</h5>

              {editingPaymentId && (
                <div className="alert alert-warning border mb-3" role="status">
                  <div className="fw-semibold">
                    Editing payment {editingPaymentId}
                  </div>
                  <div className="small">
                    Save will update this payment instead of creating a new one.
                  </div>
                </div>
              )}

              <div className="row g-3 align-items-end">
                <div className="col-12 col-lg-2">
                  <label htmlFor="paymentAmount" className="form-label">
                    Amount
                  </label>
                  <input
                    id="paymentAmount"
                    type="text"
                    className={`form-control ${getFieldErrors(paymentFieldErrors, "amount").length > 0 ? "is-invalid" : ""}`}
                    placeholder="120.50"
                    value={paymentAmount}
                    onChange={(event) =>
                      onPaymentAmountChange(event.target.value)
                    }
                  />
                  {getFieldErrors(paymentFieldErrors, "amount").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(paymentFieldErrors, "amount").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="paymentDate" className="form-label">
                    Payment date
                  </label>
                  <input
                    id="paymentDate"
                    type="date"
                    className={`form-control ${getFieldErrors(paymentFieldErrors, "paymentDate").length > 0 ? "is-invalid" : ""}`}
                    value={paymentDate}
                    onChange={(event) =>
                      onPaymentDateChange(event.target.value)
                    }
                  />
                  {getFieldErrors(paymentFieldErrors, "paymentDate").length >
                    0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(paymentFieldErrors, "paymentDate").join(
                        " ",
                      )}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="paymentMethod" className="form-label">
                    Method
                  </label>
                  <input
                    id="paymentMethod"
                    type="text"
                    className={`form-control ${getFieldErrors(paymentFieldErrors, "method").length > 0 ? "is-invalid" : ""}`}
                    value={paymentMethod}
                    onChange={(event) =>
                      onPaymentMethodChange(event.target.value)
                    }
                  />
                  {getFieldErrors(paymentFieldErrors, "method").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(paymentFieldErrors, "method").join(" ")}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-2">
                  <label htmlFor="paymentReference" className="form-label">
                    Reference
                  </label>
                  <input
                    id="paymentReference"
                    type="text"
                    className={`form-control ${getFieldErrors(paymentFieldErrors, "reference").length > 0 ? "is-invalid" : ""}`}
                    placeholder="Optional"
                    value={paymentReference}
                    onChange={(event) =>
                      onPaymentReferenceChange(event.target.value)
                    }
                  />
                  {getFieldErrors(paymentFieldErrors, "reference").length >
                    0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(paymentFieldErrors, "reference").join(
                        " ",
                      )}
                    </div>
                  )}
                </div>
                <div className="col-12 col-lg-3">
                  <label htmlFor="paymentNotes" className="form-label">
                    Notes
                  </label>
                  <input
                    id="paymentNotes"
                    type="text"
                    className={`form-control ${getFieldErrors(paymentFieldErrors, "notes").length > 0 ? "is-invalid" : ""}`}
                    placeholder="Optional"
                    value={paymentNotes}
                    onChange={(event) =>
                      onPaymentNotesChange(event.target.value)
                    }
                  />
                  {getFieldErrors(paymentFieldErrors, "notes").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(paymentFieldErrors, "notes").join(" ")}
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => void onRecordLatestPeriodPayment()}
                  disabled={loading}
                >
                  {editingPaymentId ? "Update payment" : "Save payment"}
                </button>
                {editingPaymentId && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onCancelPaymentEdit}
                    disabled={loading}
                  >
                    Cancel edit
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void onLoadLatestPeriodPaymentSummary()}
                  disabled={loading}
                >
                  Load latest summary
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => void onLoadPaymentHistory()}
                  disabled={loading}
                >
                  Load payment history
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => void onLoadAllTimeBalance()}
                  disabled={loading}
                >
                  Load all-time balance
                </button>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">Payment status</div>
                <div>{paymentMessage}</div>
                {latestPaymentSummary && (
                  <div className="mt-2 text-secondary small">
                    Latest period:{" "}
                    {formatDateRange(
                      latestPaymentSummary.periodStartDate,
                      latestPaymentSummary.periodEndDateExclusive,
                    )}
                    {` | Total: ${formatCurrencyGbp(latestPaymentSummary.periodTotal)}`}
                    {` | Paid: ${formatCurrencyGbp(latestPaymentSummary.paymentAmount ?? "0.00")}`}
                    {` | Difference: ${formatCurrencyGbp(latestPaymentSummary.periodDifference)}`}
                    {` | Status: ${latestPaymentSummary.periodBalanceStatus}`}
                  </div>
                )}
                {balanceSummary && (
                  <div className="mt-2 text-secondary small">
                    All-time charges:{" "}
                    {formatCurrencyGbp(balanceSummary.totalCalculatedCharges)}
                    {` | Payments: ${formatCurrencyGbp(balanceSummary.totalRecordedPayments)}`}
                    {` | Balance: ${formatCurrencyGbp(balanceSummary.balance)}`}
                    {` | ${balanceSummary.balanceStatus}`}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card radius-10 border-0 shadow-sm mt-4">
            <div className="card-body">
              <h5 className="mb-3">Recent payment history</h5>
              {paymentHistory.length === 0 ? (
                <p className="text-secondary mb-0">
                  No payment history loaded yet.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Verification</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.slice(0, 10).map((item) => (
                        <tr key={item.paymentId}>
                          <td>
                            {formatDateRange(
                              item.periodStartDate,
                              item.periodEndDateExclusive,
                            )}
                          </td>
                          <td>{formatDisplayDate(item.paymentDate)}</td>
                          <td>{formatCurrencyGbp(item.amount)}</td>
                          <td>{item.method}</td>
                          <td>{item.verificationStatus}</td>
                          <td className="text-end">
                            <div
                              className="btn-group btn-group-sm"
                              role="group"
                            >
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={() => onBeginPaymentEdit(item)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Delete this payment record? This cannot be undone.",
                                    )
                                  ) {
                                    void onDeletePayment(item.paymentId);
                                  }
                                }}
                                disabled={loading}
                              >
                                Delete
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
        </div>
      </main>
    </div>
  );
}
