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

  it("loads development seed status details", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          enabled: true,
          environment: "Development",
          fixedOtpCode: "123456",
          seedEmails: [
            "superadmin@baleanchor.local",
            "resident.active@baleanchor.local",
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await expect(portalClient.getDevelopmentSeedStatus()).resolves.toEqual({
      enabled: true,
      environment: "Development",
      fixedOtpCode: "123456",
      seedEmails: [
        "superadmin@baleanchor.local",
        "resident.active@baleanchor.local",
      ],
    });
  });

  it("posts to reseed development data", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "Development seed data reset and recreated.",
          usersChanged: 8,
          sessionsChanged: 1,
          otpChallengesChanged: 1,
          termsAcceptancesChanged: 2,
          utilitySetupsChanged: 1,
          tariffsChanged: 2,
          readingsChanged: 2,
          calculationSnapshotsChanged: 1,
          paymentsChanged: 1,
          statementExportsChanged: 1,
          auditLogsChanged: 1,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const result = await portalClient.reseedDevelopmentData();

    expect(fetchMock).toHaveBeenCalledWith("/api/system/dev-seed", {
      method: "POST",
    });
    expect(result.message).toBe("Development seed data reset and recreated.");
    expect(result.usersChanged).toBe(8);
  });

  it("deletes development seed data", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "Development seed data removed.",
          usersChanged: 4,
          sessionsChanged: 2,
          otpChallengesChanged: 1,
          termsAcceptancesChanged: 1,
          utilitySetupsChanged: 1,
          tariffsChanged: 2,
          readingsChanged: 2,
          calculationSnapshotsChanged: 1,
          paymentsChanged: 1,
          statementExportsChanged: 1,
          auditLogsChanged: 1,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const result = await portalClient.deleteDevelopmentSeedData();

    expect(fetchMock).toHaveBeenCalledWith("/api/system/dev-seed", {
      method: "DELETE",
    });
    expect(result.message).toBe("Development seed data removed.");
    expect(result.usersChanged).toBe(4);
  });

  it("loads reminder preferences with authenticated request", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          userId: "resident-1",
          emailRemindersEnabled: true,
          pushRemindersEnabled: false,
          readingReminderEnabled: true,
          timeZoneId: "Europe/London",
          updatedAtUtc: "2026-07-29T12:00:00.0000000Z",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const result = await portalClient.getReminderPreferences();

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/reminders/preferences", {
      method: "GET",
      credentials: "include",
    });
    expect(result.userId).toBe("resident-1");
  });

  it("sends reminder preferences updates using PUT with json body", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          userId: "resident-1",
          emailRemindersEnabled: false,
          pushRemindersEnabled: true,
          readingReminderEnabled: true,
          timeZoneId: "UTC",
          updatedAtUtc: "2026-07-29T12:01:00.0000000Z",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const request = {
      emailRemindersEnabled: false,
      pushRemindersEnabled: true,
      readingReminderEnabled: true,
      timeZoneId: "UTC",
    };

    await portalClient.updateReminderPreferences(request);

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/reminders/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });
  });

  it("upserts push subscriptions and posts test notification", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            subscriptionId: "sub-1",
            endpoint: "https://push.example/subscriptions/1",
            isActive: true,
            updatedAtUtc: "2026-07-29T12:03:00.0000000Z",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            userId: "resident-1",
            deliveredSubscriptions: 1,
            message: "Test notification sent to active subscriptions.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

    await portalClient.upsertPushSubscription({
      endpoint: "https://push.example/subscriptions/1",
      p256dh: "p256dh-key",
      auth: "auth-key",
      clientUserAgent: "vitest",
    });
    await portalClient.sendPushTestNotification();

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/v1/push/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        endpoint: "https://push.example/subscriptions/1",
        p256dh: "p256dh-key",
        auth: "auth-key",
        clientUserAgent: "vitest",
      }),
    });

    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/push/test", {
      method: "POST",
      credentials: "include",
    });
  });
});
