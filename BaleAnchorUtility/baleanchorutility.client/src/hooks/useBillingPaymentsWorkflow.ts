import { type Dispatch, type SetStateAction, useState } from "react";
import { PortalApiError, portalClient } from "../api/portalClient";
import type {
  ActiveBoilerAssumptionResponse,
  ActiveTariffResponse,
  AllTimeBalanceResponse,
  BoilerAssumptionManagementItemResponse,
  CalculateLatestPeriodResponse,
  FieldErrors,
  LatestPeriodPaymentSummaryResponse,
  LatestReadingsResponse,
  PaymentHistoryItemResponse,
  TariffManagementItemResponse,
} from "../shared/contracts";
import {
  validateBoilerAssumptionInput,
  validatePaymentInput,
  validateReadingsInput,
  validateTariffInput,
} from "../validation/billing";

interface UseBillingPaymentsWorkflowArgs {
  setLoading: Dispatch<SetStateAction<boolean>>;
  readingDate: string;
  coldWaterReading: string;
  hotWaterReading: string;
  electricityReading: string;
  tariffEffectiveFromDate: string;
  waterTariffPerUnit: string;
  waterStandingChargePerDay: string;
  waterVatPercent: string;
  electricityTariffPerUnit: string;
  electricityStandingChargePerDay: string;
  electricityVatPercent: string;
  boilerEffectiveFromDate: string;
  hotWaterTemperatureCelsius: string;
  hotWaterHeatCapacity: string;
  hotWaterDensity: string;
  kiloJouleToKiloWattHourFactor: string;
  boilerKwhPerCubicMeter: string;
  boilerEfficiencyPercent: string;
  paymentAmount: string;
  paymentDate: string;
  paymentMethod: string;
  paymentReference: string;
  paymentNotes: string;
  setPaymentAmount: Dispatch<SetStateAction<string>>;
  setPaymentDate: Dispatch<SetStateAction<string>>;
  setPaymentMethod: Dispatch<SetStateAction<string>>;
  setPaymentReference: Dispatch<SetStateAction<string>>;
  setPaymentNotes: Dispatch<SetStateAction<string>>;
  setReadingsFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
  setTariffFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
  setBoilerFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
  setPaymentFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
}

export function useBillingPaymentsWorkflow({
  setLoading,
  readingDate,
  coldWaterReading,
  hotWaterReading,
  electricityReading,
  tariffEffectiveFromDate,
  waterTariffPerUnit,
  waterStandingChargePerDay,
  waterVatPercent,
  electricityTariffPerUnit,
  electricityStandingChargePerDay,
  electricityVatPercent,
  boilerEffectiveFromDate,
  hotWaterTemperatureCelsius,
  hotWaterHeatCapacity,
  hotWaterDensity,
  kiloJouleToKiloWattHourFactor,
  boilerKwhPerCubicMeter,
  boilerEfficiencyPercent,
  paymentAmount,
  paymentDate,
  paymentMethod,
  paymentReference,
  paymentNotes,
  setPaymentAmount,
  setPaymentDate,
  setPaymentMethod,
  setPaymentReference,
  setPaymentNotes,
  setReadingsFieldErrors,
  setTariffFieldErrors,
  setBoilerFieldErrors,
  setPaymentFieldErrors,
}: UseBillingPaymentsWorkflowArgs) {
  const [billingMessage, setBillingMessage] = useState(
    "Billing inputs have not been submitted.",
  );
  const [latestReadings, setLatestReadings] =
    useState<LatestReadingsResponse | null>(null);
  const [activeTariff, setActiveTariff] = useState<ActiveTariffResponse | null>(
    null,
  );
  const [tariffManagementItems, setTariffManagementItems] = useState<
    TariffManagementItemResponse[]
  >([]);
  const [activeBoilerAssumption, setActiveBoilerAssumption] =
    useState<ActiveBoilerAssumptionResponse | null>(null);
  const [boilerManagementItems, setBoilerManagementItems] = useState<
    BoilerAssumptionManagementItemResponse[]
  >([]);
  const [latestCalculation, setLatestCalculation] =
    useState<CalculateLatestPeriodResponse | null>(null);
  const [paymentMessage, setPaymentMessage] = useState(
    "No payment action submitted.",
  );
  const [latestPaymentSummary, setLatestPaymentSummary] =
    useState<LatestPeriodPaymentSummaryResponse | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<
    PaymentHistoryItemResponse[]
  >([]);
  const [balanceSummary, setBalanceSummary] =
    useState<AllTimeBalanceResponse | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const loadLatestReadings = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getLatestReadings();
      if (!body) {
        setLatestReadings(null);
        setBillingMessage("No readings submitted yet.");
        return;
      }

      setLatestReadings(body);
      setBillingMessage(`Loaded latest readings for ${body.readingDate}.`);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(`Unable to load latest readings. ${error.message}`);
      } else {
        setBillingMessage("Unable to load latest readings.");
      }
      setLatestReadings(null);
    } finally {
      setLoading(false);
    }
  };

  const submitReadings = async (selection?: {
    tariffEffectiveFromDate?: string;
    boilerEffectiveFromDate?: string;
  }): Promise<boolean> => {
    const validationErrors = validateReadingsInput({
      readingDate,
      coldWaterReading,
      hotWaterReading,
      electricityReading,
      tariffEffectiveFromDate: selection?.tariffEffectiveFromDate,
      boilerEffectiveFromDate: selection?.boilerEffectiveFromDate,
      requireTariffSelection: true,
      requireBoilerSelection: true,
    });
    if (Object.keys(validationErrors).length > 0) {
      setReadingsFieldErrors(validationErrors);
      setBillingMessage("Review highlighted reading fields and try again.");
      return false;
    }

    setReadingsFieldErrors({});
    setLoading(true);
    try {
      const body = await portalClient.submitReadings({
        readingDate,
        coldWaterReading,
        hotWaterReading,
        electricityReading,
        tariffEffectiveFromDate: selection?.tariffEffectiveFromDate,
        boilerEffectiveFromDate: selection?.boilerEffectiveFromDate,
      });
      const tariffSuffix = body.appliedTariffEffectiveFromDate
        ? ` Tariff: ${body.appliedTariffEffectiveFromDate}.`
        : "";
      const boilerSuffix = body.appliedBoilerEffectiveFromDate
        ? ` Boiler: ${body.appliedBoilerEffectiveFromDate}.`
        : "";
      setBillingMessage(
        `${body.message} Date: ${body.readingDate}.${tariffSuffix}${boilerSuffix}`,
      );
      await loadLatestReadings();
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setReadingsFieldErrors(error.errors);
        setBillingMessage(`Reading submission failed. ${error.message}`);
      } else {
        setBillingMessage("Reading submission failed.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateLatestReadings = async (): Promise<boolean> => {
    const validationErrors = validateReadingsInput({
      readingDate,
      coldWaterReading,
      hotWaterReading,
      electricityReading,
    });
    if (Object.keys(validationErrors).length > 0) {
      setReadingsFieldErrors(validationErrors);
      setBillingMessage("Review highlighted reading fields and try again.");
      return false;
    }

    setReadingsFieldErrors({});
    setLoading(true);
    try {
      const body = await portalClient.updateLatestReadings({
        readingDate,
        coldWaterReading,
        hotWaterReading,
        electricityReading,
      });
      setBillingMessage(`${body.message} Date: ${body.readingDate}.`);
      await loadLatestReadings();
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setReadingsFieldErrors(error.errors);
        setBillingMessage(`Reading update failed. ${error.message}`);
      } else {
        setBillingMessage("Reading update failed.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadActiveTariff = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getActiveTariff();
      setActiveTariff(body);
      setBillingMessage(`Loaded active tariff from ${body.effectiveFromDate}.`);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(`Unable to load active tariff. ${error.message}`);
      } else {
        setBillingMessage("Unable to load active tariff.");
      }
      setActiveTariff(null);
    } finally {
      setLoading(false);
    }
  };

  const submitTariffVersion = async () => {
    const validationErrors = validateTariffInput({
      effectiveFromDate: tariffEffectiveFromDate,
      waterTariffPerUnit,
      waterStandingChargePerDay,
      waterVatPercent,
      electricityTariffPerUnit,
      electricityStandingChargePerDay,
      electricityVatPercent,
    });
    if (Object.keys(validationErrors).length > 0) {
      setTariffFieldErrors(validationErrors);
      setBillingMessage("Review highlighted tariff fields and try again.");
      return false;
    }

    setTariffFieldErrors({});
    setLoading(true);
    try {
      const body = await portalClient.submitTariffVersion({
        effectiveFromDate: tariffEffectiveFromDate,
        waterTariffPerUnit,
        waterStandingChargePerDay,
        waterVatPercent,
        electricityTariffPerUnit,
        electricityStandingChargePerDay,
        electricityVatPercent,
      });
      setBillingMessage(
        `${body.message} Effective from ${body.effectiveFromDate}.`,
      );
      await Promise.all([loadActiveTariff(), loadTariffManagement(true)]);
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setTariffFieldErrors(error.errors);
        setBillingMessage(`Tariff save failed. ${error.message}`);
      } else {
        setBillingMessage("Tariff save failed.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadTariffManagement = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getTariffManagement();
      setTariffManagementItems(body.items);
      if (!silent) {
        setBillingMessage(`Loaded ${body.count} tariff version(s).`);
      }
    } catch (error) {
      setTariffManagementItems([]);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setBillingMessage(`Unable to load tariffs. ${error.message}`);
        } else {
          setBillingMessage("Unable to load tariffs.");
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const updateTariffVersion = async (effectiveFromDate: string) => {
    const validationErrors = validateTariffInput({
      effectiveFromDate: tariffEffectiveFromDate,
      waterTariffPerUnit,
      waterStandingChargePerDay,
      waterVatPercent,
      electricityTariffPerUnit,
      electricityStandingChargePerDay,
      electricityVatPercent,
    });
    if (Object.keys(validationErrors).length > 0) {
      setTariffFieldErrors(validationErrors);
      setBillingMessage("Review highlighted tariff fields and try again.");
      return false;
    }

    setTariffFieldErrors({});
    setLoading(true);
    try {
      const body = await portalClient.updateTariffVersion(effectiveFromDate, {
        effectiveFromDate: tariffEffectiveFromDate,
        waterTariffPerUnit,
        waterStandingChargePerDay,
        waterVatPercent,
        electricityTariffPerUnit,
        electricityStandingChargePerDay,
        electricityVatPercent,
      });

      setBillingMessage(
        `${body.message} Effective from ${body.effectiveFromDate}.`,
      );
      await Promise.all([loadActiveTariff(), loadTariffManagement(true)]);
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setTariffFieldErrors(error.errors);
        setBillingMessage(`Tariff update failed. ${error.message}`);
      } else {
        setBillingMessage("Tariff update failed.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTariffVersion = async (effectiveFromDate: string) => {
    setLoading(true);
    try {
      const body = await portalClient.deleteTariffVersion(effectiveFromDate);
      setBillingMessage(
        `${body.message} Effective from ${body.effectiveFromDate}.`,
      );
      await Promise.all([loadActiveTariff(), loadTariffManagement(true)]);
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(`Tariff delete failed. ${error.message}`);
      } else {
        setBillingMessage("Tariff delete failed.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadActiveBoilerAssumption = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getActiveBoilerAssumption();
      setActiveBoilerAssumption(body);
      setBillingMessage(
        `Loaded active boiler assumptions from ${body.effectiveFromDate}.`,
      );
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(
          `Unable to load active boiler assumptions. ${error.message}`,
        );
      } else {
        setBillingMessage("Unable to load active boiler assumptions.");
      }
      setActiveBoilerAssumption(null);
    } finally {
      setLoading(false);
    }
  };

  const submitBoilerAssumptionVersion = async () => {
    const validationErrors = validateBoilerAssumptionInput({
      effectiveFromDate: boilerEffectiveFromDate,
      hotWaterTemperatureCelsius,
      hotWaterHeatCapacity,
      hotWaterDensity,
      kiloJouleToKiloWattHourFactor,
      boilerKwhPerCubicMeter,
      boilerEfficiencyPercent,
    });
    if (Object.keys(validationErrors).length > 0) {
      setBoilerFieldErrors(validationErrors);
      setBillingMessage(
        "Review highlighted boiler assumption fields and try again.",
      );
      return false;
    }

    setBoilerFieldErrors({});
    setLoading(true);
    try {
      const body = await portalClient.submitBoilerAssumptionVersion({
        effectiveFromDate: boilerEffectiveFromDate,
        hotWaterTemperatureCelsius,
        hotWaterHeatCapacity,
        hotWaterDensity,
        kiloJouleToKiloWattHourFactor,
        boilerKwhPerCubicMeter,
        boilerEfficiencyPercent,
      });
      setBillingMessage(
        `${body.message} Effective from ${body.effectiveFromDate}.`,
      );
      await Promise.all([
        loadActiveBoilerAssumption(),
        loadBoilerAssumptionManagement(true),
      ]);
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBoilerFieldErrors(error.errors);
        setBillingMessage(`Boiler assumptions save failed. ${error.message}`);
      } else {
        setBillingMessage("Boiler assumptions save failed.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadBoilerAssumptionManagement = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getBoilerAssumptionManagement();
      setBoilerManagementItems(body.items);
      if (!silent) {
        setBillingMessage(`Loaded ${body.count} boiler version(s).`);
      }
    } catch (error) {
      setBoilerManagementItems([]);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setBillingMessage(
            `Unable to load boiler assumptions. ${error.message}`,
          );
        } else {
          setBillingMessage("Unable to load boiler assumptions.");
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const updateBoilerAssumptionVersion = async (effectiveFromDate: string) => {
    const validationErrors = validateBoilerAssumptionInput({
      effectiveFromDate: boilerEffectiveFromDate,
      hotWaterTemperatureCelsius,
      hotWaterHeatCapacity,
      hotWaterDensity,
      kiloJouleToKiloWattHourFactor,
      boilerKwhPerCubicMeter,
      boilerEfficiencyPercent,
    });
    if (Object.keys(validationErrors).length > 0) {
      setBoilerFieldErrors(validationErrors);
      setBillingMessage(
        "Review highlighted boiler assumption fields and try again.",
      );
      return false;
    }

    setBoilerFieldErrors({});
    setLoading(true);
    try {
      const body = await portalClient.updateBoilerAssumptionVersion(
        effectiveFromDate,
        {
          effectiveFromDate: boilerEffectiveFromDate,
          hotWaterTemperatureCelsius,
          hotWaterHeatCapacity,
          hotWaterDensity,
          kiloJouleToKiloWattHourFactor,
          boilerKwhPerCubicMeter,
          boilerEfficiencyPercent,
        },
      );

      setBillingMessage(
        `${body.message} Effective from ${body.effectiveFromDate}.`,
      );
      await Promise.all([
        loadActiveBoilerAssumption(),
        loadBoilerAssumptionManagement(true),
      ]);
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBoilerFieldErrors(error.errors);
        setBillingMessage(`Boiler assumptions update failed. ${error.message}`);
      } else {
        setBillingMessage("Boiler assumptions update failed.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteBoilerAssumptionVersion = async (effectiveFromDate: string) => {
    setLoading(true);
    try {
      const body =
        await portalClient.deleteBoilerAssumptionVersion(effectiveFromDate);
      setBillingMessage(
        `${body.message} Effective from ${body.effectiveFromDate}.`,
      );
      await Promise.all([
        loadActiveBoilerAssumption(),
        loadBoilerAssumptionManagement(true),
      ]);
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(`Boiler assumptions delete failed. ${error.message}`);
      } else {
        setBillingMessage("Boiler assumptions delete failed.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const runLatestCalculation = async () => {
    setLoading(true);
    try {
      const body = await portalClient.runLatestCalculation();
      setLatestCalculation(body);
      setBillingMessage(`Calculation snapshot created: ${body.snapshotId}.`);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(`Calculation failed. ${error.message}`);
      } else {
        setBillingMessage("Calculation failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLatestCalculation = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getLatestCalculation();
      setLatestCalculation(body);
      setBillingMessage(`Loaded calculation snapshot ${body.snapshotId}.`);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setBillingMessage(
          `Unable to load calculation snapshot. ${error.message}`,
        );
      } else {
        setBillingMessage("Unable to load calculation snapshot.");
      }
      setLatestCalculation(null);
    } finally {
      setLoading(false);
    }
  };

  const loadLatestPeriodPaymentSummary = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getLatestPeriodPaymentSummary();
      setLatestPaymentSummary(body);
      if (!silent) {
        setPaymentMessage(
          `Loaded payment summary for ${body.periodStartDate} to ${body.periodEndDateExclusive}.`,
        );
      }
    } catch (error) {
      setLatestPaymentSummary(null);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setPaymentMessage(
            `Unable to load latest payment summary. ${error.message}`,
          );
        } else {
          setPaymentMessage("Unable to load latest payment summary.");
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadPaymentHistory = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getPaymentHistory();
      setPaymentHistory(body.items);
      if (!silent) {
        setPaymentMessage(`Loaded ${body.count} payment history record(s).`);
      }
    } catch (error) {
      setPaymentHistory([]);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setPaymentMessage(`Unable to load payment history. ${error.message}`);
        } else {
          setPaymentMessage("Unable to load payment history.");
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadAllTimeBalance = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getAllTimeBalance();
      setBalanceSummary(body);
      if (!silent) {
        setPaymentMessage(`Loaded all-time balance (${body.balanceStatus}).`);
      }
    } catch (error) {
      setBalanceSummary(null);
      if (!silent) {
        if (error instanceof PortalApiError) {
          setPaymentMessage(
            `Unable to load all-time balance. ${error.message}`,
          );
        } else {
          setPaymentMessage("Unable to load all-time balance.");
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const recordLatestPeriodPayment = async () => {
    const validationErrors = validatePaymentInput({
      amount: paymentAmount,
      paymentDate,
      method: paymentMethod,
      reference: paymentReference,
      notes: paymentNotes,
    });
    if (Object.keys(validationErrors).length > 0) {
      setPaymentFieldErrors(validationErrors);
      setPaymentMessage("Review highlighted payment fields and try again.");
      return false;
    }

    setPaymentFieldErrors({});
    setLoading(true);
    try {
      if (editingPaymentId) {
        const body = await portalClient.updatePayment(editingPaymentId, {
          amount: paymentAmount,
          paymentDate,
          method: paymentMethod,
          reference: paymentReference || undefined,
          notes: paymentNotes || undefined,
        });

        setPaymentMessage(`${body.message} Payment ${body.paymentId} updated.`);
        setEditingPaymentId(null);
      } else {
        const body = await portalClient.createPayment({
          amount: paymentAmount,
          paymentDate,
          method: paymentMethod,
          reference: paymentReference || undefined,
          notes: paymentNotes || undefined,
        });

        setPaymentMessage(
          `${body.message} Payment ${body.paymentId} saved to unlinked pool.`,
        );
      }

      await Promise.all([
        loadLatestPeriodPaymentSummary(true),
        loadPaymentHistory(true),
        loadAllTimeBalance(true),
      ]);
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setPaymentFieldErrors(error.errors);
        setPaymentMessage(`Payment save failed. ${error.message}`);
      } else {
        setPaymentMessage("Payment save failed.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const beginPaymentEdit = (item: PaymentHistoryItemResponse) => {
    setEditingPaymentId(item.paymentId);
    setPaymentAmount(item.amount);
    setPaymentDate(item.paymentDate);
    setPaymentMethod(item.method);
    setPaymentReference(item.reference ?? "");
    setPaymentNotes(item.notes ?? "");
    setPaymentFieldErrors({});
    setPaymentMessage(
      `Editing payment ${item.paymentId}. Update fields, then save.`,
    );
  };

  const cancelPaymentEdit = () => {
    setEditingPaymentId(null);
    setPaymentFieldErrors({});
    setPaymentMessage("Edit cancelled. Ready to record a new payment.");
  };

  const deletePayment = async (paymentId: string) => {
    setLoading(true);
    try {
      const body = await portalClient.deletePayment(paymentId);
      if (editingPaymentId === paymentId) {
        setEditingPaymentId(null);
      }

      setPaymentMessage(`${body.message} Payment ${body.paymentId} removed.`);
      await Promise.all([
        loadLatestPeriodPaymentSummary(true),
        loadPaymentHistory(true),
        loadAllTimeBalance(true),
      ]);
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setPaymentMessage(`Payment delete failed. ${error.message}`);
      } else {
        setPaymentMessage("Payment delete failed.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unlinkPayment = async (paymentId: string) => {
    setLoading(true);
    try {
      const body = await portalClient.unlinkPayment(paymentId);
      if (editingPaymentId === paymentId) {
        setEditingPaymentId(null);
      }

      setPaymentMessage(`${body.message} Payment ${body.paymentId} unlinked.`);
      await Promise.all([
        loadLatestPeriodPaymentSummary(true),
        loadPaymentHistory(true),
        loadAllTimeBalance(true),
      ]);
      return true;
    } catch (error) {
      if (error instanceof PortalApiError) {
        setPaymentMessage(`Payment unlink failed. ${error.message}`);
      } else {
        setPaymentMessage("Payment unlink failed.");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    billingMessage,
    latestReadings,
    activeTariff,
    tariffManagementItems,
    activeBoilerAssumption,
    boilerManagementItems,
    latestCalculation,
    paymentMessage,
    latestPaymentSummary,
    paymentHistory,
    balanceSummary,
    editingPaymentId,
    submitReadings,
    updateLatestReadings,
    loadLatestReadings,
    submitTariffVersion,
    loadTariffManagement,
    updateTariffVersion,
    deleteTariffVersion,
    loadActiveTariff,
    submitBoilerAssumptionVersion,
    loadBoilerAssumptionManagement,
    updateBoilerAssumptionVersion,
    deleteBoilerAssumptionVersion,
    loadActiveBoilerAssumption,
    runLatestCalculation,
    loadLatestCalculation,
    recordLatestPeriodPayment,
    beginPaymentEdit,
    cancelPaymentEdit,
    deletePayment,
    unlinkPayment,
    loadLatestPeriodPaymentSummary,
    loadPaymentHistory,
    loadAllTimeBalance,
  };
}
