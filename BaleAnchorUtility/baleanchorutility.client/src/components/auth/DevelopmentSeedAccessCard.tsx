import { useEffect, useState } from "react";
import { portalClient, PortalApiError } from "../../api/portalClient";
import type { DevelopmentSeedStatusResponse } from "../../shared/contracts";

export function DevelopmentSeedAccessCard() {
  const [seedStatus, setSeedStatus] =
    useState<DevelopmentSeedStatusResponse | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    let cancelled = false;

    const loadSeedStatus = async () => {
      try {
        const response = await portalClient.getDevelopmentSeedStatus();
        if (!cancelled) {
          setSeedStatus(response);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof PortalApiError) {
          setSeedStatus(null);
          return;
        }

        setSeedStatus(null);
      }
    };

    void loadSeedStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!import.meta.env.DEV || !seedStatus?.enabled) {
    return null;
  }

  return (
    <div className="alert alert-warning border mt-4 mb-0" role="note">
      <div className="fw-semibold mb-2">Development seed access</div>
      <div className="small text-dark">
        Use one of the seeded emails below, request a code, then enter the
        fixed OTP.
      </div>
      <div className="mt-2 small">
        <strong>Fixed OTP:</strong> {seedStatus.fixedOtpCode}
      </div>
      <div className="mt-2 small">
        <strong>Seed emails:</strong>
      </div>
      <ul className="small mb-0 mt-1 ps-3">
        {seedStatus.seedEmails.map((seedEmail) => (
          <li key={seedEmail}>{seedEmail}</li>
        ))}
      </ul>
    </div>
  );
}