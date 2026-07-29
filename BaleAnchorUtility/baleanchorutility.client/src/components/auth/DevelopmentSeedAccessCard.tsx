import { useEffect, useState } from "react";
import { portalClient, PortalApiError } from "../../api/portalClient";
import type {
  DevelopmentSeedOperationResponse,
  DevelopmentSeedStatusResponse,
} from "../../shared/contracts";

interface DevelopmentSeedAccessCardProps {
  loading: boolean;
  onUseSeedEmail: (email: string) => void;
}

export function DevelopmentSeedAccessCard({
  loading,
  onUseSeedEmail,
}: DevelopmentSeedAccessCardProps) {
  const [seedStatus, setSeedStatus] =
    useState<DevelopmentSeedStatusResponse | null>(null);
  const [operationMessage, setOperationMessage] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const loadSeedStatus = async () => {
    const response = await portalClient.getDevelopmentSeedStatus();
    setSeedStatus(response);
  };

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    let cancelled = false;

    const load = async () => {
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

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!import.meta.env.DEV || !seedStatus?.enabled) {
    return null;
  }

  const completeOperation = async (
    operation: Promise<DevelopmentSeedOperationResponse>,
  ) => {
    setActionBusy(true);
    try {
      const result = await operation;
      setOperationMessage(result.message);
      await loadSeedStatus();
    } catch (error) {
      if (error instanceof PortalApiError) {
        setOperationMessage(error.message);
      } else {
        setOperationMessage("Development seed operation failed.");
      }
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="alert alert-warning border mt-4 mb-0" role="note">
      <div className="fw-semibold mb-2">Development seed access</div>
      <div className="small text-dark">
        Use one of the seeded emails below, request a code, then enter the fixed
        OTP.
      </div>
      <div className="mt-2 small">
        <strong>Fixed OTP:</strong> {seedStatus.fixedOtpCode}
      </div>
      <div className="mt-2 small">
        <strong>Seed emails:</strong>
      </div>
      <ul className="small mb-3 mt-1 ps-3">
        {seedStatus.seedEmails.map((seedEmail) => (
          <li key={seedEmail} className="mb-1">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span>{seedEmail}</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                onClick={() => onUseSeedEmail(seedEmail)}
                disabled={loading || actionBusy}
              >
                Use
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="d-flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() =>
            void completeOperation(portalClient.reseedDevelopmentData())
          }
          disabled={loading || actionBusy}
        >
          Reseed demo data
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={() =>
            void completeOperation(portalClient.deleteDevelopmentSeedData())
          }
          disabled={loading || actionBusy}
        >
          Delete seed data
        </button>
      </div>

      {operationMessage && (
        <div className="mt-3 small text-dark">{operationMessage}</div>
      )}
    </div>
  );
}
