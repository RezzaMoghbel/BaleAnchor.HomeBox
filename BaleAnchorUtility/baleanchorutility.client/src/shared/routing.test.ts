import { describe, expect, it } from "vitest";
import type { SessionStatusResponse } from "./contracts";
import { getTargetRoute } from "./routing";

function createSession(
  overrides: Partial<SessionStatusResponse>,
): SessionStatusResponse {
  return {
    isAuthenticated: true,
    userStatus: "Active",
    userRole: "Resident",
    ...overrides,
  };
}

describe("getTargetRoute", () => {
  it("keeps unauthenticated users on login paths", () => {
    expect(getTargetRoute("/login", null)).toBeNull();
    expect(getTargetRoute("/", null)).toBeNull();
  });

  it("redirects unauthenticated users away from private routes", () => {
    expect(getTargetRoute("/dashboard", null)).toBe("/login");
    expect(getTargetRoute("/onboarding", null)).toBe("/login");
  });

  it("routes authenticated users with incomplete onboarding to onboarding", () => {
    const session = createSession({ userStatus: "PendingProfile" });

    expect(getTargetRoute("/dashboard", session)).toBe("/onboarding");
    expect(getTargetRoute("/dashboard/readings", session)).toBe("/onboarding");
    expect(getTargetRoute("/onboarding", session)).toBeNull();
  });

  it("routes active residents into the dashboard", () => {
    const session = createSession({ userStatus: "Active" });

    expect(getTargetRoute("/login", session)).toBe("/dashboard");
    expect(getTargetRoute("/dashboard", session)).toBeNull();
  });

  it("prevents non-admin users from opening admin routes", () => {
    const session = createSession({ userRole: "Resident" });

    expect(getTargetRoute("/dashboard/admin", session)).toBe("/dashboard");
  });

  it("protects notifications route for unauthenticated users", () => {
    expect(getTargetRoute("/dashboard/notifications", null)).toBe("/login");
  });

  it("allows notifications route for authenticated users", () => {
    const session = createSession({ userStatus: "Active" });

    expect(getTargetRoute("/dashboard/notifications", session)).toBeNull();
  });

  it("allows admin routes for admin roles case-insensitively", () => {
    const session = createSession({ userRole: "SuperAdmin" });

    expect(getTargetRoute("/dashboard/admin", session)).toBeNull();
  });
});
