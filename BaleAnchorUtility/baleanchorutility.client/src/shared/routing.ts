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
  const isOnboardingPath = path === "/onboarding";
  const isDashboardPath = path.startsWith("/dashboard");
  const isAdminPath = path.startsWith("/dashboard/admin");
  const isNotificationsPath = path.startsWith("/dashboard/notifications");

  const isAuthenticated = currentSession?.isAuthenticated === true;
  const status = currentSession?.userStatus?.trim().toLowerCase();
  const role = currentSession?.userRole?.trim().toLowerCase();
  const needsOnboarding = isAuthenticated && status !== "active";
  const isAdminUser = role === "admin" || role === "superadmin";

  if (!isAuthenticated) {
    return isLoginPath ? null : "/signin";
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
