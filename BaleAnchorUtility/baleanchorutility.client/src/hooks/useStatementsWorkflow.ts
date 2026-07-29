import { useEffect, type Dispatch, type SetStateAction, useState } from "react";
import { PortalApiError, portalClient } from "../api/portalClient";
import type {
  StatementExportHistoryItemResponse,
  StatementPeriodItemResponse,
  StatementSummaryResponse,
} from "../shared/contracts";

interface UseStatementsWorkflowArgs {
  isStatementsDashboard: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export function useStatementsWorkflow({
  isStatementsDashboard,
  setLoading,
}: UseStatementsWorkflowArgs) {
  const [statementMessage, setStatementMessage] = useState(
    "No statement action run yet.",
  );
  const [latestStatementSummary, setLatestStatementSummary] =
    useState<StatementSummaryResponse | null>(null);
  const [selectedStatementSummary, setSelectedStatementSummary] =
    useState<StatementSummaryResponse | null>(null);
  const [statementPeriods, setStatementPeriods] = useState<
    StatementPeriodItemResponse[]
  >([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [statementExportHistory, setStatementExportHistory] = useState<
    StatementExportHistoryItemResponse[]
  >([]);

  const loadLatestStatementSummary = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getLatestStatementSummary();
      setLatestStatementSummary(body);
      setStatementMessage(
        `Loaded latest statement summary for ${body.periodStartDate} to ${body.periodEndDateExclusive}.`,
      );
    } catch (error) {
      setLatestStatementSummary(null);
      if (error instanceof PortalApiError) {
        setStatementMessage(
          `Unable to load latest statement summary. ${error.message}`,
        );
      } else {
        setStatementMessage("Unable to load latest statement summary.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStatementPeriods = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getStatementPeriods();
      setStatementPeriods(body.items);
      if (!selectedSnapshotId && body.items.length > 0) {
        setSelectedSnapshotId(body.items[0].snapshotId);
      }
      setStatementMessage(`Loaded ${body.count} statement period option(s).`);
    } catch (error) {
      setStatementPeriods([]);
      if (error instanceof PortalApiError) {
        setStatementMessage(
          `Unable to load statement periods. ${error.message}`,
        );
      } else {
        setStatementMessage("Unable to load statement periods.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedStatementSummary = async (snapshotId?: string) => {
    const snapshot = snapshotId ?? selectedSnapshotId;

    if (!snapshot) {
      setStatementMessage(
        "Select a period snapshot before loading selected summary.",
      );
      return;
    }

    if (snapshot !== selectedSnapshotId) {
      setSelectedSnapshotId(snapshot);
    }

    setLoading(true);
    try {
      const body = await portalClient.getStatementSummary(snapshot);
      setSelectedStatementSummary(body);
      setStatementMessage(
        `Loaded selected summary for ${body.periodStartDate} to ${body.periodEndDateExclusive}.`,
      );
    } catch (error) {
      setSelectedStatementSummary(null);
      if (error instanceof PortalApiError) {
        setStatementMessage(
          `Unable to load selected summary. ${error.message}`,
        );
      } else {
        setStatementMessage("Unable to load selected summary.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStatementExportHistory = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getStatementExportHistory();
      setStatementExportHistory(body.items);
      if (!silent) {
        setStatementMessage(`Loaded ${body.count} statement export record(s).`);
      }
    } catch (error) {
      setStatementExportHistory([]);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setStatementMessage(
            `Unable to load statement exports. ${error.message}`,
          );
        } else {
          setStatementMessage("Unable to load statement exports.");
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const exportSelectedStatementPdf = async (snapshotId?: string) => {
    const snapshot = snapshotId ?? selectedSnapshotId;

    if (!snapshot) {
      setStatementMessage("Select a period snapshot before exporting PDF.");
      return;
    }

    if (snapshot !== selectedSnapshotId) {
      setSelectedSnapshotId(snapshot);
    }

    setLoading(true);
    try {
      const { blob, exportId, suggestedName } =
        await portalClient.exportStatementPdf(snapshot);
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = suggestedName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setStatementMessage(`Statement PDF exported. Export ID: ${exportId}.`);
      await loadStatementExportHistory(true);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setStatementMessage(`Statement PDF export failed. ${error.message}`);
      } else {
        setStatementMessage("Statement PDF export failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStatementsDashboard) {
      return;
    }

    if (statementPeriods.length === 0) {
      void loadStatementPeriods();
    }

    if (statementExportHistory.length === 0) {
      void loadStatementExportHistory(true);
    }
  }, [
    isStatementsDashboard,
    statementExportHistory.length,
    statementPeriods.length,
  ]);

  return {
    statementMessage,
    selectedSnapshotId,
    latestStatementSummary,
    selectedStatementSummary,
    statementPeriods,
    statementExportHistory,
    loadLatestStatementSummary,
    loadStatementPeriods,
    loadSelectedStatementSummary,
    exportSelectedStatementPdf,
    loadStatementExportHistory,
    setSelectedSnapshotId,
  };
}
