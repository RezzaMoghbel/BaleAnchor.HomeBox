import { describe, expect, it } from "vitest";
import { getFieldErrors, readProblemDetails } from "./problemDetails";

describe("problemDetails", () => {
  it("maps field errors case-insensitively and with json path prefix", () => {
    const errors = {
      "$.timeZoneId": ["Timezone is required."],
      email: ["Email is required."],
    };

    expect(getFieldErrors(errors, "timeZoneId")).toEqual([
      "Timezone is required.",
    ]);
    expect(getFieldErrors(errors, "email")).toEqual(["Email is required."]);
  });

  it("parses validation problem details payload", async () => {
    const response = new Response(
      JSON.stringify({
        title: "Validation failed",
        detail: "One or more validation errors occurred.",
        errors: {
          code: ["Code must be 6 digits."],
        },
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/problem+json",
        },
      },
    );

    const parsed = await readProblemDetails(response);

    expect(parsed.message).toContain("One or more validation errors occurred.");
    expect(parsed.message).toContain("code: Code must be 6 digits.");
    expect(parsed.errors.code).toEqual(["Code must be 6 digits."]);
  });

  it("falls back to generic message when response json cannot be parsed", async () => {
    const response = new Response("not-json", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });

    const parsed = await readProblemDetails(response);

    expect(parsed.message).toBe("The request failed.");
    expect(parsed.errors).toEqual({});
  });
});
