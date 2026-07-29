import { describe, expect, it } from "vitest";
import { validateRequestCodeInput, validateVerifyCodeInput } from "./auth";

describe("auth validation", () => {
  it("accepts a valid request-code email", () => {
    expect(validateRequestCodeInput("resident@example.com")).toEqual({});
  });

  it("returns an email error for invalid request-code input", () => {
    expect(validateRequestCodeInput("bad-email")).toEqual({
      email: ["Enter a valid email address."],
    });
  });

  it("accepts a valid verify-code payload", () => {
    expect(validateVerifyCodeInput("resident@example.com", "123456")).toEqual(
      {},
    );
  });

  it("returns both email and code errors for invalid verify-code input", () => {
    expect(validateVerifyCodeInput("", "12ab")).toEqual({
      email: ["Enter a valid email address."],
      code: ["Enter the 6-digit code."],
    });
  });
});
