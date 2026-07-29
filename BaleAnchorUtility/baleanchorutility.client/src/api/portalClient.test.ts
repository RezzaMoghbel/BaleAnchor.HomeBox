import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { portalClient, PortalApiError } from "./portalClient";

describe("portalClient", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("returns parsed json for successful requests", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "Code sent.",
          resendAfterSeconds: 30,
          expiresInSeconds: 600,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await expect(
      portalClient.requestCode({ email: "resident@example.com" }),
    ).resolves.toEqual({
      message: "Code sent.",
      resendAfterSeconds: 30,
      expiresInSeconds: 600,
    });
  });

  it("throws PortalApiError with parsed field errors for problem responses", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          title: "Validation failed",
          detail: "Email is required.",
          errors: {
            email: ["Email is required."],
          },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await expect(portalClient.requestCode({ email: "" })).rejects.toMatchObject(
      {
        name: "PortalApiError",
        message: "Email is required. email: Email is required.",
        errors: {
          email: ["Email is required."],
        },
      },
    );
  });

  it("creates a PortalApiError instance for callers to narrow on", async () => {
    fetchMock.mockResolvedValue(
      new Response('{"detail":"Forbidden."}', {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    try {
      await portalClient.getPendingApprovals();
    } catch (error) {
      expect(error).toBeInstanceOf(PortalApiError);
      expect((error as PortalApiError).message).toBe("Forbidden.");
      return;
    }

    throw new Error("Expected PortalApiError to be thrown.");
  });

  it("returns pdf export metadata from response headers", async () => {
    fetchMock.mockResolvedValue(
      new Response("pdf-data", {
        status: 200,
        headers: {
          "Content-Disposition": 'attachment; filename="statement-abc.pdf"',
          "X-Statement-Export-Id": "export-123",
        },
      }),
    );

    const result = await portalClient.exportStatementPdf("abc");

    expect(result.exportId).toBe("export-123");
    expect(result.suggestedName).toBe("statement-abc.pdf");
    await expect(result.blob.text()).resolves.toBe("pdf-data");
  });
});
