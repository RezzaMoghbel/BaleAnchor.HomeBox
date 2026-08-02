import { useMemo, useState, type ReactNode } from "react";
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
  onRecordLatestPeriodPayment: () => Promise<boolean>;
  onBeginPaymentEdit: (item: PaymentHistoryItemResponse) => void;
  onCancelPaymentEdit: () => void;
  onDeletePayment: (paymentId: string) => Promise<boolean>;
  onUnlinkPayment: (paymentId: string) => Promise<boolean>;
  onLoadLatestPeriodPaymentSummary: () => Promise<void>;
  onLoadPaymentHistory: () => Promise<void>;
  onLoadAllTimeBalance: () => Promise<void>;
  formatDateRange: (startDate: string, endDateExclusive: string) => string;
  formatDisplayDate: (value?: string) => string;
  formatCurrencyGbp: (value?: string) => string;
}

const pageSize = 10;

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
  onUnlinkPayment,
  onLoadLatestPeriodPaymentSummary,
  onLoadPaymentHistory,
  onLoadAllTimeBalance,
  formatDateRange,
  formatDisplayDate,
  formatCurrencyGbp,
}: PaymentsDashboardViewProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<PaymentHistoryItemResponse | null>(null);
  const [unlinkTarget, setUnlinkTarget] =
    useState<PaymentHistoryItemResponse | null>(null);
  const [isLatestSummaryModalOpen, setIsLatestSummaryModalOpen] =
    useState(false);
  const [isAllTimeBalanceModalOpen, setIsAllTimeBalanceModalOpen] =
    useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const showSuccessToast = (message: string) => {
    setSuccessToast(message);
    window.setTimeout(() => {
      setSuccessToast((current) => (current === message ? "" : current));
    }, 2600);
  };

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return paymentHistory;
    }

    return paymentHistory.filter((item) => {
      return (
        item.paymentId.toLowerCase().includes(query) ||
        item.method.toLowerCase().includes(query) ||
        (item.reference ?? "").toLowerCase().includes(query) ||
        (item.notes ?? "").toLowerCase().includes(query) ||
        (item.periodStartDate ?? "").toLowerCase().includes(query) ||
        (item.periodEndDateExclusive ?? "").toLowerCase().includes(query) ||
        item.verificationStatus.toLowerCase().includes(query)
      );
    });
  }, [paymentHistory, searchTerm]);

  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const openCreateModal = () => {
    if (editingPaymentId) {
      onCancelPaymentEdit();
    }

    onPaymentAmountChange("");
    onPaymentDateChange("");
    onPaymentMethodChange("");
    onPaymentReferenceChange("");
    onPaymentNotesChange("");
    setIsEditorOpen(true);
  };

  const openEditModal = (item: PaymentHistoryItemResponse) => {
    onBeginPaymentEdit(item);
    setIsEditorOpen(true);
  };

  const closeEditorModal = () => {
    if (editingPaymentId) {
      onCancelPaymentEdit();
    }

    setIsEditorOpen(false);
  };

  const submitPayment = async () => {
    const success = await onRecordLatestPeriodPayment();
    if (!success) {
      return;
    }

    await onLoadPaymentHistory();
    setIsEditorOpen(false);
    showSuccessToast(
      editingPaymentId ? "Payment updated." : "Payment created.",
    );
  };

  const openDeleteModal = (item: PaymentHistoryItemResponse) => {
    setDeleteTarget(item);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const success = await onDeletePayment(deleteTarget.paymentId);
    if (!success) {
      return;
    }

    setDeleteTarget(null);
    await onLoadPaymentHistory();
    showSuccessToast("Payment deleted.");
  };

  const openUnlinkModal = (item: PaymentHistoryItemResponse) => {
    setUnlinkTarget(item);
  };

  const closeUnlinkModal = () => {
    setUnlinkTarget(null);
  };

  const confirmUnlink = async () => {
    if (!unlinkTarget) {
      return;
    }

    const success = await onUnlinkPayment(unlinkTarget.paymentId);
    if (!success) {
      return;
    }

    setUnlinkTarget(null);
    await onLoadPaymentHistory();
    showSuccessToast("Payment unlinked.");
  };

  const openLatestSummaryModal = async () => {
    await onLoadLatestPeriodPaymentSummary();
    setIsLatestSummaryModalOpen(true);
  };

  const openAllTimeBalanceModal = async () => {
    await onLoadAllTimeBalance();
    setIsAllTimeBalanceModalOpen(true);
  };

  const canGoPrev = safePage > 1;
  const canGoNext = safePage < totalPages;
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  return (
    <div className="wrapper">
      {shellHeader}
      <main className="page-content p-4">
        <div className="container-fluid">
          <section className="hero-shell card border-0 shadow-sm mb-4">
            <div className="card-body p-4 p-xl-5">
              <h1 className="hero-title mb-3">Payments management</h1>
              <p className="hero-copy mb-0">
                Record payments, update entries, and track latest and all-time
                balances from one management table.
              </p>
            </div>
          </section>

          {routeTabs}

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <h6 className="mb-0 text-uppercase">Payment history table</h6>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={openCreateModal}
                    disabled={loading}
                  >
                    Create payment
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => void openLatestSummaryModal()}
                    disabled={loading}
                  >
                    View latest summary
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
                    onClick={() => void openAllTimeBalanceModal()}
                    disabled={loading}
                  >
                    View all-time balance
                  </button>
                </div>
              </div>

              {successToast.length > 0 && (
                <div className="alert alert-success border mb-3" role="status">
                  {successToast}
                </div>
              )}

              <div className="d-flex align-items-center justify-content-end mb-3">
                <div className="d-flex align-items-center gap-2">
                  <label
                    htmlFor="paymentsTableSearch"
                    className="form-label mb-0"
                  >
                    Search:
                  </label>
                  <input
                    id="paymentsTableSearch"
                    type="search"
                    className="form-control"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search payments"
                    style={{ minWidth: "220px" }}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-striped table-bordered align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Linked reading</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center text-secondary py-4"
                        >
                          No payment records found.
                        </td>
                      </tr>
                    ) : (
                      pagedRows.map((item) => (
                        <tr key={item.paymentId}>
                          <td>
                            {item.periodStartDate && item.periodEndDateExclusive
                              ? formatDateRange(
                                  item.periodStartDate,
                                  item.periodEndDateExclusive,
                                )
                              : "Unlinked"}
                          </td>
                          <td>
                            {item.periodStartDate && item.periodEndDateExclusive
                              ? `Card ${formatDateRange(item.periodStartDate, item.periodEndDateExclusive)}`
                              : "Not linked to a reading card"}
                          </td>
                          <td>{formatDisplayDate(item.paymentDate)}</td>
                          <td>{formatCurrencyGbp(item.amount)}</td>
                          <td>{item.method}</td>
                          <td>{item.reference || "-"}</td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-dark btn-sm"
                                onClick={() => openEditModal(item)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={`btn btn-sm ${item.isLinked ? "btn-outline-warning" : "btn-outline-danger"}`}
                                onClick={() =>
                                  item.isLinked
                                    ? openUnlinkModal(item)
                                    : openDeleteModal(item)
                                }
                                disabled={loading}
                              >
                                {item.isLinked ? "Unlink" : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
                <div className="small text-secondary">
                  Showing {totalEntries === 0 ? 0 : startIndex + 1} to{" "}
                  {Math.min(startIndex + pagedRows.length, totalEntries)} of{" "}
                  {totalEntries} entries
                </div>
                <nav aria-label="Payments table pagination">
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item${canGoPrev ? "" : " disabled"}`}>
                      <button
                        type="button"
                        className="page-link"
                        disabled={!canGoPrev}
                        onClick={() => setCurrentPage(safePage - 1)}
                      >
                        Prev
                      </button>
                    </li>
                    {pageNumbers.map((pageNumber) => (
                      <li
                        key={pageNumber}
                        className={`page-item${pageNumber === safePage ? " active" : ""}`}
                      >
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item${canGoNext ? "" : " disabled"}`}>
                      <button
                        type="button"
                        className="page-link"
                        disabled={!canGoNext}
                        onClick={() => setCurrentPage(safePage + 1)}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>

              <div className="alert alert-light border mt-3 mb-0" role="status">
                <div className="fw-semibold mb-1">Payment status</div>
                <div>{paymentMessage}</div>
                <div className="mt-2 text-secondary small">
                  Linked payments cannot be deleted. Unlink first, then delete.
                </div>
              </div>
            </div>
          </div>

          {isEditorOpen && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                aria-modal="true"
                role="dialog"
              >
                <div className="modal-dialog modal-lg modal-dialog-centered">
                  <div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white">
                      <h5 className="modal-title">
                        {editingPaymentId ? "Edit payment" : "Create payment"}
                      </h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={closeEditorModal}
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      {editingPaymentId && (
                        <div
                          className="alert alert-warning border mb-3"
                          role="status"
                        >
                          <div className="fw-semibold">
                            Editing payment {editingPaymentId}
                          </div>
                          <div className="small">
                            Save will update this payment instead of creating a
                            new one.
                          </div>
                        </div>
                      )}

                      <div className="row g-3 align-items-end">
                        <div className="col-12 col-lg-4">
                          <label
                            htmlFor="modalPaymentAmount"
                            className="form-label"
                          >
                            Amount
                          </label>
                          <input
                            id="modalPaymentAmount"
                            type="text"
                            className={`form-control ${getFieldErrors(paymentFieldErrors, "amount").length > 0 ? "is-invalid" : ""}`}
                            value={paymentAmount}
                            onChange={(event) =>
                              onPaymentAmountChange(event.target.value)
                            }
                          />
                          {getFieldErrors(paymentFieldErrors, "amount").length >
                            0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(
                                paymentFieldErrors,
                                "amount",
                              ).join(" ")}
                            </div>
                          )}
                        </div>
                        <div className="col-12 col-lg-4">
                          <label
                            htmlFor="modalPaymentDate"
                            className="form-label"
                          >
                            Payment date
                          </label>
                          <input
                            id="modalPaymentDate"
                            type="date"
                            className={`form-control ${getFieldErrors(paymentFieldErrors, "paymentDate").length > 0 ? "is-invalid" : ""}`}
                            value={paymentDate}
                            onChange={(event) =>
                              onPaymentDateChange(event.target.value)
                            }
                          />
                          {getFieldErrors(paymentFieldErrors, "paymentDate")
                            .length > 0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(
                                paymentFieldErrors,
                                "paymentDate",
                              ).join(" ")}
                            </div>
                          )}
                        </div>
                        <div className="col-12 col-lg-4">
                          <label
                            htmlFor="modalPaymentMethod"
                            className="form-label"
                          >
                            Method
                          </label>
                          <input
                            id="modalPaymentMethod"
                            type="text"
                            className={`form-control ${getFieldErrors(paymentFieldErrors, "method").length > 0 ? "is-invalid" : ""}`}
                            value={paymentMethod}
                            onChange={(event) =>
                              onPaymentMethodChange(event.target.value)
                            }
                          />
                          {getFieldErrors(paymentFieldErrors, "method").length >
                            0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(
                                paymentFieldErrors,
                                "method",
                              ).join(" ")}
                            </div>
                          )}
                        </div>
                        <div className="col-12 col-lg-6">
                          <label
                            htmlFor="modalPaymentReference"
                            className="form-label"
                          >
                            Reference
                          </label>
                          <input
                            id="modalPaymentReference"
                            type="text"
                            className={`form-control ${getFieldErrors(paymentFieldErrors, "reference").length > 0 ? "is-invalid" : ""}`}
                            value={paymentReference}
                            onChange={(event) =>
                              onPaymentReferenceChange(event.target.value)
                            }
                          />
                          {getFieldErrors(paymentFieldErrors, "reference")
                            .length > 0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(
                                paymentFieldErrors,
                                "reference",
                              ).join(" ")}
                            </div>
                          )}
                        </div>
                        <div className="col-12 col-lg-6">
                          <label
                            htmlFor="modalPaymentNotes"
                            className="form-label"
                          >
                            Notes
                          </label>
                          <input
                            id="modalPaymentNotes"
                            type="text"
                            className={`form-control ${getFieldErrors(paymentFieldErrors, "notes").length > 0 ? "is-invalid" : ""}`}
                            value={paymentNotes}
                            onChange={(event) =>
                              onPaymentNotesChange(event.target.value)
                            }
                          />
                          {getFieldErrors(paymentFieldErrors, "notes").length >
                            0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(paymentFieldErrors, "notes").join(
                                " ",
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeEditorModal}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => void submitPayment()}
                        disabled={loading}
                      >
                        {editingPaymentId ? "Save changes" : "Create payment"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}

          {deleteTarget && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                aria-modal="true"
                role="dialog"
              >
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content border-0 shadow">
                    <div className="modal-header bg-danger text-white">
                      <h5 className="modal-title">Delete payment</h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={closeDeleteModal}
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p className="mb-2">
                        Delete payment dated{" "}
                        <strong>
                          {formatDisplayDate(deleteTarget.paymentDate)}
                        </strong>
                        {` (${formatCurrencyGbp(deleteTarget.amount)})`}
                      </p>
                      <p className="mb-0 text-secondary small">
                        This action cannot be undone.
                      </p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeDeleteModal}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => void confirmDelete()}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}

          {unlinkTarget && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                aria-modal="true"
                role="dialog"
              >
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content border-0 shadow">
                    <div className="modal-header bg-warning">
                      <h5 className="modal-title">Unlink payment</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={closeUnlinkModal}
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p className="mb-2">
                        Unlink payment dated{" "}
                        <strong>
                          {formatDisplayDate(unlinkTarget.paymentDate)}
                        </strong>
                        {` (${formatCurrencyGbp(unlinkTarget.amount)})`}
                      </p>
                      <p className="mb-0 text-secondary small">
                        The payment will remain in your unlinked pool and can be
                        linked to another reading card later.
                      </p>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeUnlinkModal}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() => void confirmUnlink()}
                        disabled={loading}
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}

          {isLatestSummaryModalOpen && latestPaymentSummary && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                aria-modal="true"
                role="dialog"
              >
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content border-0 shadow">
                    <div className="modal-header bg-light">
                      <h5 className="modal-title">Latest summary</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setIsLatestSummaryModalOpen(false)}
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      <div className="small text-secondary mb-2">
                        {formatDateRange(
                          latestPaymentSummary.periodStartDate,
                          latestPaymentSummary.periodEndDateExclusive,
                        )}
                      </div>
                      <div>
                        Total charges:{" "}
                        {formatCurrencyGbp(latestPaymentSummary.periodTotal)}
                      </div>
                      <div>
                        Total linked payments:{" "}
                        {formatCurrencyGbp(
                          latestPaymentSummary.paymentAmount ?? "0.00",
                        )}
                      </div>
                      <div>
                        Difference:{" "}
                        {formatCurrencyGbp(
                          latestPaymentSummary.periodDifference,
                        )}
                      </div>
                      <div>
                        Status: {latestPaymentSummary.periodBalanceStatus}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}

          {isAllTimeBalanceModalOpen && balanceSummary && (
            <>
              <div
                className="modal fade show d-block"
                tabIndex={-1}
                aria-modal="true"
                role="dialog"
              >
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content border-0 shadow">
                    <div className="modal-header bg-light">
                      <h5 className="modal-title">All-time balance</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setIsAllTimeBalanceModalOpen(false)}
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      <div>
                        Total charges:{" "}
                        {formatCurrencyGbp(
                          balanceSummary.totalCalculatedCharges,
                        )}
                      </div>
                      <div>
                        Total payments:{" "}
                        {formatCurrencyGbp(
                          balanceSummary.totalRecordedPayments,
                        )}
                      </div>
                      <div>
                        Balance: {formatCurrencyGbp(balanceSummary.balance)}
                      </div>
                      <div>Status: {balanceSummary.balanceStatus}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-backdrop fade show"></div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
