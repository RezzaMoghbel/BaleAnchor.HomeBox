import { useMemo, useState, type ReactNode } from "react";
import type {
  ActiveBoilerAssumptionResponse,
  BoilerAssumptionManagementItemResponse,
  FieldErrors,
} from "../../shared/contracts";

interface BoilerDashboardViewProps {
  shellHeader: ReactNode;
  routeTabs: ReactNode;
  loading: boolean;
  boilerEffectiveFromDate: string;
  hotWaterTemperatureCelsius: string;
  hotWaterHeatCapacity: string;
  hotWaterDensity: string;
  kiloJouleToKiloWattHourFactor: string;
  boilerKwhPerCubicMeter: string;
  boilerEfficiencyPercent: string;
  boilerFieldErrors: FieldErrors;
  billingMessage: string;
  activeBoilerAssumption: ActiveBoilerAssumptionResponse | null;
  boilerManagementItems: BoilerAssumptionManagementItemResponse[];
  getFieldErrors: (errors: FieldErrors, fieldName: string) => string[];
  onBoilerEffectiveFromDateChange: (value: string) => void;
  onHotWaterTemperatureCelsiusChange: (value: string) => void;
  onHotWaterHeatCapacityChange: (value: string) => void;
  onHotWaterDensityChange: (value: string) => void;
  onKiloJouleToKiloWattHourFactorChange: (value: string) => void;
  onBoilerKwhPerCubicMeterChange: (value: string) => void;
  onBoilerEfficiencyPercentChange: (value: string) => void;
  onSubmitBoilerAssumptionVersion: () => Promise<boolean>;
  onUpdateBoilerAssumptionVersion: (
    effectiveFromDate: string,
  ) => Promise<boolean>;
  onDeleteBoilerAssumptionVersion: (
    effectiveFromDate: string,
  ) => Promise<boolean>;
  onLoadBoilerAssumptionManagement: () => Promise<void>;
  onLoadActiveBoilerAssumption: () => Promise<void>;
}

const pageSize = 10;

export function BoilerDashboardView({
  shellHeader,
  routeTabs,
  loading,
  boilerEffectiveFromDate,
  hotWaterTemperatureCelsius,
  hotWaterHeatCapacity,
  hotWaterDensity,
  kiloJouleToKiloWattHourFactor,
  boilerKwhPerCubicMeter,
  boilerEfficiencyPercent,
  boilerFieldErrors,
  billingMessage,
  activeBoilerAssumption,
  boilerManagementItems,
  getFieldErrors,
  onBoilerEffectiveFromDateChange,
  onHotWaterTemperatureCelsiusChange,
  onHotWaterHeatCapacityChange,
  onHotWaterDensityChange,
  onKiloJouleToKiloWattHourFactorChange,
  onBoilerKwhPerCubicMeterChange,
  onBoilerEfficiencyPercentChange,
  onSubmitBoilerAssumptionVersion,
  onUpdateBoilerAssumptionVersion,
  onDeleteBoilerAssumptionVersion,
  onLoadBoilerAssumptionManagement,
  onLoadActiveBoilerAssumption,
}: BoilerDashboardViewProps) {
  const [editingEffectiveFromDate, setEditingEffectiveFromDate] = useState<
    string | null
  >(null);
  const [deleteTarget, setDeleteTarget] =
    useState<BoilerAssumptionManagementItemResponse | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
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
      return boilerManagementItems;
    }

    return boilerManagementItems.filter((item) => {
      return (
        item.effectiveFromDate.toLowerCase().includes(query) ||
        item.boilerKwhPerCubicMeter.toLowerCase().includes(query) ||
        item.boilerEfficiencyPercent.toLowerCase().includes(query) ||
        item.hotWaterTemperatureCelsius.toLowerCase().includes(query)
      );
    });
  }, [boilerManagementItems, searchTerm]);

  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const setFormFromRow = (item: BoilerAssumptionManagementItemResponse) => {
    onBoilerEffectiveFromDateChange(item.effectiveFromDate);
    onHotWaterTemperatureCelsiusChange(item.hotWaterTemperatureCelsius);
    onHotWaterHeatCapacityChange(item.hotWaterHeatCapacity);
    onHotWaterDensityChange(item.hotWaterDensity);
    onKiloJouleToKiloWattHourFactorChange(item.kiloJouleToKiloWattHourFactor);
    onBoilerKwhPerCubicMeterChange(item.boilerKwhPerCubicMeter);
    onBoilerEfficiencyPercentChange(item.boilerEfficiencyPercent);
  };

  const clearForm = () => {
    setEditingEffectiveFromDate(null);
    onBoilerEffectiveFromDateChange("");
    onHotWaterTemperatureCelsiusChange("");
    onHotWaterHeatCapacityChange("");
    onHotWaterDensityChange("");
    onKiloJouleToKiloWattHourFactorChange("");
    onBoilerKwhPerCubicMeterChange("");
    onBoilerEfficiencyPercentChange("");
  };

  const openCreateModal = () => {
    clearForm();
    setIsEditorOpen(true);
  };

  const openEditModal = (item: BoilerAssumptionManagementItemResponse) => {
    setEditingEffectiveFromDate(item.effectiveFromDate);
    setFormFromRow(item);
    setIsEditorOpen(true);
  };

  const closeEditorModal = () => {
    setIsEditorOpen(false);
    setEditingEffectiveFromDate(null);
  };

  const submitForm = async () => {
    if (!editingEffectiveFromDate) {
      const created = await onSubmitBoilerAssumptionVersion();
      if (created) {
        setIsEditorOpen(false);
        showSuccessToast("Boiler assumptions version created.");
        await onLoadBoilerAssumptionManagement();
      }
      return;
    }

    const saved = await onUpdateBoilerAssumptionVersion(
      editingEffectiveFromDate,
    );
    if (saved) {
      setIsEditorOpen(false);
      setEditingEffectiveFromDate(null);
      showSuccessToast("Boiler assumptions version updated.");
      await onLoadBoilerAssumptionManagement();
    }
  };

  const openDeleteModal = (item: BoilerAssumptionManagementItemResponse) => {
    setDeleteTarget(item);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const removed = await onDeleteBoilerAssumptionVersion(
      deleteTarget.effectiveFromDate,
    );
    if (removed) {
      if (editingEffectiveFromDate === deleteTarget.effectiveFromDate) {
        clearForm();
      }
      setDeleteTarget(null);
      showSuccessToast("Boiler assumptions version deleted.");
      await onLoadBoilerAssumptionManagement();
    }
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
              <h1 className="hero-title mb-3">Boiler assumptions management</h1>
              <p className="hero-copy mb-0">
                Manage dated boiler assumptions with edit/delete protections for
                active and linked usage.
              </p>
            </div>
          </section>

          {routeTabs}

          <div className="card radius-10 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <h6 className="mb-0 text-uppercase">
                  Boiler assumptions table
                </h6>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={openCreateModal}
                    disabled={loading}
                  >
                    Create boiler assumptions version
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => void onLoadActiveBoilerAssumption()}
                    disabled={loading}
                  >
                    Load active
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => void onLoadBoilerAssumptionManagement()}
                    disabled={loading}
                  >
                    Refresh
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
                    htmlFor="boilerTableSearch"
                    className="form-label mb-0"
                  >
                    Search:
                  </label>
                  <input
                    id="boilerTableSearch"
                    type="search"
                    className="form-control"
                    value={searchTerm}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search assumptions"
                    style={{ minWidth: "220px" }}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-striped table-bordered align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Effective from</th>
                      <th>Temp</th>
                      <th>Heat cap</th>
                      <th>Density</th>
                      <th>kJ to kWh</th>
                      <th>kWh/m3</th>
                      <th>Efficiency %</th>
                      <th>Status</th>
                      <th>Linked</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="text-center text-secondary py-4"
                        >
                          No boiler assumptions found.
                        </td>
                      </tr>
                    ) : (
                      pagedRows.map((item) => (
                        <tr key={item.effectiveFromDate}>
                          <td>{item.effectiveFromDate}</td>
                          <td>{item.hotWaterTemperatureCelsius}</td>
                          <td>{item.hotWaterHeatCapacity}</td>
                          <td>{item.hotWaterDensity}</td>
                          <td>{item.kiloJouleToKiloWattHourFactor}</td>
                          <td>{item.boilerKwhPerCubicMeter}</td>
                          <td>{item.boilerEfficiencyPercent}</td>
                          <td>
                            <span
                              className={`badge rounded-pill ${item.isActive ? "bg-success" : "bg-secondary"}`}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge rounded-pill ${item.isLinked ? "bg-warning text-dark" : "bg-light text-dark border"}`}
                            >
                              {item.isLinked
                                ? `${item.linkedReadingsCount} reading(s)`
                                : "No links"}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-outline-dark btn-sm"
                                disabled={loading || !item.canEdit}
                                onClick={() => openEditModal(item)}
                                title={
                                  item.canEdit
                                    ? "Edit these assumptions"
                                    : "Inactive assumptions cannot be edited"
                                }
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                disabled={loading || !item.canDelete}
                                onClick={() => openDeleteModal(item)}
                                title={
                                  item.canDelete
                                    ? "Delete these assumptions"
                                    : "Linked assumptions cannot be deleted"
                                }
                              >
                                Delete
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
                <nav aria-label="Boiler table pagination">
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
                <div className="fw-semibold mb-1">
                  Boiler assumptions status
                </div>
                <div>{billingMessage}</div>
                {activeBoilerAssumption && (
                  <div className="mt-2 text-secondary small">
                    Active assumptions from{" "}
                    {activeBoilerAssumption.effectiveFromDate}
                  </div>
                )}
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
                <div className="modal-dialog modal-xl modal-dialog-centered">
                  <div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white">
                      <h5 className="modal-title">
                        {editingEffectiveFromDate
                          ? "Edit boiler assumptions version"
                          : "Create boiler assumptions version"}
                      </h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={closeEditorModal}
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      <div className="row g-3 align-items-end">
                        <div className="col-12 col-lg-2">
                          <label
                            htmlFor="modalBoilerEffectiveFromDate"
                            className="form-label"
                          >
                            Effective from
                          </label>
                          <input
                            id="modalBoilerEffectiveFromDate"
                            type="date"
                            className={`form-control ${getFieldErrors(boilerFieldErrors, "effectiveFromDate").length > 0 ? "is-invalid" : ""}`}
                            value={boilerEffectiveFromDate}
                            disabled={editingEffectiveFromDate !== null}
                            onChange={(event) =>
                              onBoilerEffectiveFromDateChange(
                                event.target.value,
                              )
                            }
                          />
                          {getFieldErrors(
                            boilerFieldErrors,
                            "effectiveFromDate",
                          ).length > 0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(
                                boilerFieldErrors,
                                "effectiveFromDate",
                              ).join(" ")}
                            </div>
                          )}
                        </div>
                        <div className="col-12 col-lg-2">
                          <label
                            htmlFor="modalHotWaterTemperatureCelsius"
                            className="form-label"
                          >
                            Temp (C)
                          </label>
                          <input
                            id="modalHotWaterTemperatureCelsius"
                            type="text"
                            className="form-control"
                            value={hotWaterTemperatureCelsius}
                            onChange={(event) =>
                              onHotWaterTemperatureCelsiusChange(
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="col-12 col-lg-2">
                          <label
                            htmlFor="modalHotWaterHeatCapacity"
                            className="form-label"
                          >
                            Heat cap
                          </label>
                          <input
                            id="modalHotWaterHeatCapacity"
                            type="text"
                            className="form-control"
                            value={hotWaterHeatCapacity}
                            onChange={(event) =>
                              onHotWaterHeatCapacityChange(event.target.value)
                            }
                          />
                        </div>
                        <div className="col-12 col-lg-2">
                          <label
                            htmlFor="modalHotWaterDensity"
                            className="form-label"
                          >
                            Density
                          </label>
                          <input
                            id="modalHotWaterDensity"
                            type="text"
                            className="form-control"
                            value={hotWaterDensity}
                            onChange={(event) =>
                              onHotWaterDensityChange(event.target.value)
                            }
                          />
                        </div>
                        <div className="col-12 col-lg-2">
                          <label
                            htmlFor="modalKiloJouleToKiloWattHourFactor"
                            className="form-label"
                          >
                            kJ to kWh
                          </label>
                          <input
                            id="modalKiloJouleToKiloWattHourFactor"
                            type="text"
                            className="form-control"
                            value={kiloJouleToKiloWattHourFactor}
                            onChange={(event) =>
                              onKiloJouleToKiloWattHourFactorChange(
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="col-12 col-lg-2">
                          <label
                            htmlFor="modalBoilerKwhPerCubicMeter"
                            className="form-label"
                          >
                            Boiler kWh/m3
                          </label>
                          <input
                            id="modalBoilerKwhPerCubicMeter"
                            type="text"
                            className="form-control"
                            value={boilerKwhPerCubicMeter}
                            onChange={(event) =>
                              onBoilerKwhPerCubicMeterChange(event.target.value)
                            }
                          />
                        </div>
                        <div className="col-12 col-lg-2">
                          <label
                            htmlFor="modalBoilerEfficiencyPercent"
                            className="form-label"
                          >
                            Efficiency %
                          </label>
                          <input
                            id="modalBoilerEfficiencyPercent"
                            type="text"
                            className="form-control"
                            value={boilerEfficiencyPercent}
                            onChange={(event) =>
                              onBoilerEfficiencyPercentChange(
                                event.target.value,
                              )
                            }
                          />
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
                        onClick={() => void submitForm()}
                        disabled={loading}
                      >
                        {editingEffectiveFromDate
                          ? "Save changes"
                          : "Create version"}
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
                      <h5 className="modal-title">
                        Delete boiler assumptions version
                      </h5>
                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={closeDeleteModal}
                        aria-label="Close"
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p className="mb-0">
                        Are you sure you want to delete boiler assumptions dated{" "}
                        <strong>{deleteTarget.effectiveFromDate}</strong>?
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
        </div>
      </main>
    </div>
  );
}
