import { type Dispatch, type SetStateAction, useState } from "react";
import { PortalApiError, portalClient } from "../api/portalClient";
import type { PendingApprovalUserItem } from "../shared/contracts";

interface UseAdminWorkflowArgs {
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export function useAdminWorkflow({ setLoading }: UseAdminWorkflowArgs) {
  const [pendingApprovals, setPendingApprovals] = useState<
    PendingApprovalUserItem[]
  >([]);
  const [adminTargetUserId, setAdminTargetUserId] = useState("");
  const [adminReason, setAdminReason] = useState("");
  const [adminRoleTarget, setAdminRoleTarget] = useState("Admin");
  const [adminMessage, setAdminMessage] = useState(
    "Admin approvals not loaded.",
  );

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getPendingApprovals();
      setPendingApprovals(body.items);
      setAdminMessage(`Loaded ${body.count} pending approval record(s).`);
    } catch (error) {
      setPendingApprovals([]);
      if (error instanceof PortalApiError) {
        setAdminMessage(`Unable to load pending approvals. ${error.message}`);
      } else {
        setAdminMessage("Unable to load pending approvals.");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitAdminDecision = async (action: "approve" | "reject") => {
    if (!adminTargetUserId || !adminReason) {
      setAdminMessage("Target user ID and reason are required.");
      return;
    }

    setLoading(true);
    try {
      const body = await portalClient.submitAdminDecision(
        adminTargetUserId,
        action,
        { reason: adminReason },
      );
      setAdminMessage(
        `${body.message} User ${body.userId} now in state ${body.newStatus}.`,
      );
      await loadPendingApprovals();
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(
          `${action === "approve" ? "Approve" : "Reject"} failed. ${error.message}`,
        );
      } else {
        setAdminMessage(
          `${action === "approve" ? "Approve" : "Reject"} action failed.`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const submitRoleChange = async () => {
    if (!adminTargetUserId || !adminReason || !adminRoleTarget) {
      setAdminMessage("Target user ID, role, and reason are required.");
      return;
    }

    setLoading(true);
    try {
      const body = await portalClient.submitRoleChange(adminTargetUserId, {
        role: adminRoleTarget,
        reason: adminReason,
      });
      setAdminMessage(
        `${body.message} User ${body.userId}: ${body.previousRole} -> ${body.newRole}.`,
      );
      await loadPendingApprovals();
    } catch (error) {
      if (error instanceof PortalApiError) {
        setAdminMessage(`Role update failed. ${error.message}`);
      } else {
        setAdminMessage("Role update failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    pendingApprovals,
    adminTargetUserId,
    adminReason,
    adminRoleTarget,
    adminMessage,
    setAdminTargetUserId,
    setAdminReason,
    setAdminRoleTarget,
    loadPendingApprovals,
    submitAdminDecision,
    submitRoleChange,
  };
}