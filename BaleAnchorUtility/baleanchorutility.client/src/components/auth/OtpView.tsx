import type { ReactNode } from "react";
import type { FieldErrors } from "../../shared/contracts";
import { getFieldErrors } from "../../shared/problemDetails";

interface OtpViewProps {
  shellHeader: ReactNode;
  code: string;
  loading: boolean;
  loginFieldErrors: FieldErrors;
  statusMessage: string;
  onCodeChange: (value: string) => void;
  onVerifyOtp: () => Promise<void>;
  onCancel: () => void;
}

export function OtpView({
  shellHeader,
  code,
  loading,
  loginFieldErrors,
  statusMessage,
  onCodeChange,
  onVerifyOtp,
  onCancel,
}: OtpViewProps) {
  return (
    <div className="wrapper">
      {shellHeader}
      <main className="page-content p-4">
        <div className="container-fluid">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h1 className="mb-3">Enter OTP</h1>

              <form
                className="row g-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void onVerifyOtp();
                }}
              >
                <div className="col-12">
                  <label htmlFor="otp-code" className="form-label">
                    Code
                  </label>
                  <input
                    id="otp-code"
                    type="text"
                    maxLength={6}
                    className={`form-control ${getFieldErrors(loginFieldErrors, "code").length > 0 ? "is-invalid" : ""}`}
                    value={code}
                    onChange={(event) => onCodeChange(event.target.value)}
                  />
                  {getFieldErrors(loginFieldErrors, "code").length > 0 && (
                    <div className="invalid-feedback d-block">
                      {getFieldErrors(loginFieldErrors, "code").join(" ")}
                    </div>
                  )}
                </div>

                {statusMessage && (
                  <div className="col-12">
                    <div className="alert alert-danger py-2 mb-0" role="alert">
                      {statusMessage}
                    </div>
                  </div>
                )}

                <div className="col-12 d-flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || code.length !== 6}
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning"
                    disabled={loading}
                    onClick={onCancel}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
