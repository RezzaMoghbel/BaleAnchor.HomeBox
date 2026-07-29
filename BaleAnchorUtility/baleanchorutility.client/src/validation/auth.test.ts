import { describe, expect, it } from "vitest";
import {
  validateRequestCodeInput,
  validateSignupRequestCodeInput,
  validateVerifyCodeInput,
} from "./auth";

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

  it("accepts a valid signup payload", () => {
    expect(
      validateSignupRequestCodeInput("resident@example.com", "Valid123!"),
    ).toEqual({});
  });

  it("returns password errors for weak signup password", () => {
    expect(
      validateSignupRequestCodeInput("resident@example.com", "123456"),
    ).toEqual({
      password: [
        "Password must be at least 8 characters.",
        "Password must include an uppercase letter.",
        "Password must include a lowercase letter.",
        "Password must include a special character.",
      ],
    });
  });
});
