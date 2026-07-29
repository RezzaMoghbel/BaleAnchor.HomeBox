import type { ReactNode } from "react";
import { DevelopmentSeedAccessCard } from "./DevelopmentSeedAccessCard";
import type { FieldErrors } from "../../shared/contracts";
import { getFieldErrors } from "../../shared/problemDetails";

interface LoginViewProps {
  shellHeader: ReactNode;
  authRoute: "signin" | "signup";
  otpEnabled: boolean;
  email: string;
  signupPassword: string;
  loginFieldErrors: FieldErrors;
  loading: boolean;
  statusMessage: string;
  onEmailChange: (value: string) => void;
  onSignupPasswordChange: (value: string) => void;
  onSignupRequestCode: () => Promise<void>;
  onPasswordLogin: () => Promise<void>;
  onContinueToOtp: () => Promise<void>;
}

export function LoginView({
  shellHeader,
  authRoute,
  otpEnabled,
  email,
  signupPassword,
  loginFieldErrors,
  loading,
  statusMessage,
  onEmailChange,
  onSignupPasswordChange,
  onSignupRequestCode,
  onPasswordLogin,
  onContinueToOtp,
}: LoginViewProps) {
  const isSignIn = authRoute === "signin";
  const authImage = isSignIn
    ? "/assets/images/error/auth-img-7.png"
    : "/assets/images/error/auth-img-register3.png";

  return (
    <div className="wrapper">
      {shellHeader}
      <main className="page-content p-4 authentication-content">
        <div className="container-fluid">
          <div className="card rounded-0 overflow-hidden shadow-none border auth-form-card">
            <div className="row g-0">
              <div className="col-12 order-1 col-xl-8 d-flex align-items-center justify-content-center border-end auth-illustration-pane">
                <img
                  src={authImage}
                  className="img-fluid"
                  alt="Authentication"
                />
              </div>
              <div className="col-12 col-xl-4 order-xl-2">
                <div className="card-body p-4 p-sm-5">
                  <h5 className="card-title">
                    {isSignIn ? "Sign In" : "Sign Up"}
                  </h5>
                  <p className="card-text mb-4">
                    {isSignIn && otpEnabled
                      ? "Enter your email to sign in with OTP."
                      : "Enter your email and password to continue."}
                  </p>

                  <form
                    className="form-body"
                    onSubmit={(event) => event.preventDefault()}
                  >
                    <div className="row g-3">
                      <div className="col-12">
                        <label htmlFor="email-login" className="form-label">
                          Email Address
                        </label>
                        <div className="ms-auto position-relative">
                          <div className="position-absolute top-50 translate-middle-y search-icon px-3">
                            <i className="bi bi-envelope-fill"></i>
                          </div>
                          <input
                            id="email-login"
                            type="email"
                            className={`form-control radius-30 ps-5 ${getFieldErrors(loginFieldErrors, "email").length > 0 ? "is-invalid" : ""}`}
                            placeholder="resident@example.com"
                            value={email}
                            onChange={(event) =>
                              onEmailChange(event.target.value)
                            }
                          />
                        </div>
                        {getFieldErrors(loginFieldErrors, "email").length >
                          0 && (
                          <div className="invalid-feedback d-block">
                            {getFieldErrors(loginFieldErrors, "email").join(
                              " ",
                            )}
                          </div>
                        )}
                      </div>

                      {(!isSignIn || !otpEnabled) && (
                        <div className="col-12">
                          <label
                            htmlFor="password-signup"
                            className="form-label"
                          >
                            Password
                          </label>
                          <div className="ms-auto position-relative">
                            <div className="position-absolute top-50 translate-middle-y search-icon px-3">
                              <i className="bi bi-lock-fill"></i>
                            </div>
                            <input
                              id="password-signup"
                              type="password"
                              className={`form-control radius-30 ps-5 ${getFieldErrors(loginFieldErrors, "password").length > 0 ? "is-invalid" : ""}`}
                              placeholder="Password"
                              value={signupPassword}
                              onChange={(event) =>
                                onSignupPasswordChange(event.target.value)
                              }
                            />
                          </div>
                          {getFieldErrors(loginFieldErrors, "password").length >
                            0 && (
                            <div className="invalid-feedback d-block">
                              {getFieldErrors(
                                loginFieldErrors,
                                "password",
                              ).join(" ")}
                            </div>
                          )}
                        </div>
                      )}

                      {statusMessage && (
                        <div className="col-12">
                          <div
                            className="alert alert-danger py-2 mb-0"
                            role="alert"
                          >
                            {statusMessage}
                          </div>
                        </div>
                      )}

                      <div className="col-12">
                        <div className="d-grid">
                          {isSignIn ? (
                            otpEnabled ? (
                              <button
                                type="button"
                                className="btn btn-primary radius-30"
                                onClick={() => void onContinueToOtp()}
                                disabled={loading || !email}
                              >
                                Sign in
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-primary radius-30"
                                onClick={() => void onPasswordLogin()}
                                disabled={loading || !email || !signupPassword}
                              >
                                Sign in
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary radius-30"
                              onClick={() => void onSignupRequestCode()}
                              disabled={loading || !email || !signupPassword}
                            >
                              Sign up
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="col-12 text-center">
                        {isSignIn ? (
                          <p className="mb-0">
                            Do not have an account?{" "}
                            <a href="/signup">Sign up</a>
                          </p>
                        ) : (
                          <p className="mb-0">
                            Already have an account?{" "}
                            <a href="/signin">Sign in</a>
                          </p>
                        )}
                      </div>
                    </div>
                  </form>

                  <DevelopmentSeedAccessCard
                    loading={loading}
                    onUseSeedEmail={onEmailChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
