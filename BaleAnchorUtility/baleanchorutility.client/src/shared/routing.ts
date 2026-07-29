import type { SessionStatusResponse } from "./contracts";

export function getTargetRoute(
  path: string,
  currentSession: SessionStatusResponse | null,
): string | null {
  const isLoginPath = path === "/" || path === "/login";
  const isOnboardingPath = path === "/onboarding";
  const isDashboardPath = path.startsWith("/dashboard");
  const isAdminPath = path.startsWith("/dashboard/admin");

  const isAuthenticated = currentSession?.isAuthenticated === true;
  const status = currentSession?.userStatus?.trim().toLowerCase();
  const role = currentSession?.userRole?.trim().toLowerCase();
  const needsOnboarding = isAuthenticated && status !== "active";
  const isAdminUser = role === "admin" || role === "superadmin";

  if (!isAuthenticated) {
    return isLoginPath ? null : "/login";
  }

  if (needsOnboarding) {
    return isOnboardingPath ? null : "/onboarding";
  }

  if (isAdminPath && !isAdminUser) {
    return "/dashboard";
  }

  return isDashboardPath ? null : "/dashboard";
}
