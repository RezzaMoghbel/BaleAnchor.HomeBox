import type { SessionStatusResponse } from "./contracts";

export function getTargetRoute(
  path: string,
  currentSession: SessionStatusResponse | null,
): string | null {
  const isLoginPath =
    path === "/" ||
    path === "/login" ||
    path === "/signin" ||
    path === "/signup" ||
    path === "/otp";
  const isRejectedPath = path === "/rejected";
  const isSuspendedPath = path === "/suspended";
  const isTermsPath = path === "/terms-and-conditions";
  const isOnboardingPath = path === "/onboarding";
  const isDashboardPath = path.startsWith("/dashboard");
  const isAdminPath = path.startsWith("/dashboard/admin");
  const isNotificationsPath = path.startsWith("/dashboard/notifications");

  const isAuthenticated = currentSession?.isAuthenticated === true;
  const status = currentSession?.userStatus?.trim().toLowerCase();
  const role = currentSession?.userRole?.trim().toLowerCase();
  const isRejected = isAuthenticated && status === "rejected";
  const isSuspended = isAuthenticated && status === "suspended";
  const isResidentUser = role === "resident";
  const needsOnboarding =
    isAuthenticated &&
    isResidentUser &&
    !isRejected &&
    !isSuspended &&
    status !== "active";
  const isAdminUser = role === "admin" || role === "superadmin";

  if (!isAuthenticated) {
    return isLoginPath || isTermsPath ? null : "/signin";
  }

  if (isTermsPath) {
    return null;
  }

  if (isRejected) {
    return isRejectedPath ? null : "/rejected";
  }

  if (isSuspended) {
    return isSuspendedPath ? null : "/suspended";
  }

  if (needsOnboarding) {
    return isOnboardingPath ? null : "/onboarding";
  }

  if (isAdminPath && !isAdminUser) {
    return "/dashboard";
  }

  if (isNotificationsPath && !isAuthenticated) {
    return "/signin";
  }

  return isDashboardPath ? null : "/dashboard";
}
