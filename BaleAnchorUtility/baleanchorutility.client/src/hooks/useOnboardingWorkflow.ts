import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { PortalApiError, portalClient } from "../api/portalClient";
import type {
  ActiveTermsResponse,
  FieldErrors,
  OnboardingProgressResponse,
  OnboardingStateResponse,
} from "../shared/contracts";
import {
  validateProfileInput,
  validateUtilitySetupInput,
} from "../validation/onboarding";

interface UseOnboardingWorkflowArgs {
  setLoading: Dispatch<SetStateAction<boolean>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  refreshSession: (silent?: boolean) => Promise<void>;
  enableOnboardingHeartbeat: boolean;
}

export function useOnboardingWorkflow({
  setLoading,
  setStatusMessage,
  refreshSession,
  enableOnboardingHeartbeat,
}: UseOnboardingWorkflowArgs) {
  const [activeTerms, setActiveTerms] = useState<ActiveTermsResponse | null>(
    null,
  );
  const [termsMessage, setTermsMessage] = useState("Active terms not loaded.");

  const [surname, setSurname] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [profileMessage, setProfileMessage] = useState(
    "Profile details not submitted.",
  );
  const [profileFieldErrors, setProfileFieldErrors] = useState<FieldErrors>({});

  const [moveInDate, setMoveInDate] = useState("");
  const [openingColdWaterReading, setOpeningColdWaterReading] = useState("");
  const [openingHotWaterReading, setOpeningHotWaterReading] = useState("");
  const [openingElectricityReading, setOpeningElectricityReading] =
    useState("");
  const [initialWaterTariffPerUnit, setInitialWaterTariffPerUnit] =
    useState("");
  const [
    initialWaterStandingChargePerDay,
    setInitialWaterStandingChargePerDay,
  ] = useState("");
  const [initialWaterVatPercent, setInitialWaterVatPercent] = useState("");
  const [initialElectricityTariffPerUnit, setInitialElectricityTariffPerUnit] =
    useState("");
  const [
    initialElectricityStandingChargePerDay,
    setInitialElectricityStandingChargePerDay,
  ] = useState("");
  const [initialElectricityVatPercent, setInitialElectricityVatPercent] =
    useState("");
  const [hotWaterTemperatureCelsius, setHotWaterTemperatureCelsius] =
    useState("55");
  const [hotWaterHeatCapacity, setHotWaterHeatCapacity] = useState("4.186");
  const [hotWaterDensity, setHotWaterDensity] = useState("1000");
  const [kiloJouleToKiloWattHourFactor, setKiloJouleToKiloWattHourFactor] =
    useState("3600");
  const [boilerKwhPerCubicMeter, setBoilerKwhPerCubicMeter] =
    useState("10.500000");
  const [boilerEfficiencyPercent, setBoilerEfficiencyPercent] =
    useState("85.00");
  const [utilitySetupMessage, setUtilitySetupMessage] = useState(
    "Utility setup not submitted.",
  );
  const [utilityFieldErrors, setUtilityFieldErrors] = useState<FieldErrors>({});

  const [onboardingProgress, setOnboardingProgress] =
    useState<OnboardingProgressResponse | null>(null);
  const [progressMessage, setProgressMessage] = useState(
    "Onboarding progress not loaded.",
  );

  const hydrateFromOnboardingState = (state: OnboardingStateResponse) => {
    setSurname(state.surname);
    setDateOfBirth(state.dateOfBirth);
    setFlatNumber(state.flatNumber);
    setMobileNumber(state.mobileNumber);

    if (state.moveInDate) {
      setMoveInDate(state.moveInDate);
    }
    if (state.openingColdWaterReading) {
      setOpeningColdWaterReading(state.openingColdWaterReading);
    }
    if (state.openingHotWaterReading) {
      setOpeningHotWaterReading(state.openingHotWaterReading);
    }
    if (state.openingElectricityReading) {
      setOpeningElectricityReading(state.openingElectricityReading);
    }
    if (state.initialWaterTariffPerUnit) {
      setInitialWaterTariffPerUnit(state.initialWaterTariffPerUnit);
    }
    if (state.initialWaterStandingChargePerDay) {
      setInitialWaterStandingChargePerDay(
        state.initialWaterStandingChargePerDay,
      );
    }
    if (state.initialWaterVatPercent) {
      setInitialWaterVatPercent(state.initialWaterVatPercent);
    }
    if (state.initialElectricityTariffPerUnit) {
      setInitialElectricityTariffPerUnit(state.initialElectricityTariffPerUnit);
    }
    if (state.initialElectricityStandingChargePerDay) {
      setInitialElectricityStandingChargePerDay(
        state.initialElectricityStandingChargePerDay,
      );
    }
    if (state.initialElectricityVatPercent) {
      setInitialElectricityVatPercent(state.initialElectricityVatPercent);
    }
    if (state.hotWaterTemperatureCelsius) {
      setHotWaterTemperatureCelsius(state.hotWaterTemperatureCelsius);
    }
    if (state.hotWaterHeatCapacity) {
      setHotWaterHeatCapacity(state.hotWaterHeatCapacity);
    }
    if (state.hotWaterDensity) {
      setHotWaterDensity(state.hotWaterDensity);
    }
    if (state.kiloJouleToKiloWattHourFactor) {
      setKiloJouleToKiloWattHourFactor(state.kiloJouleToKiloWattHourFactor);
    }

    if (state.boilerKwhPerCubicMeter) {
      setBoilerKwhPerCubicMeter(state.boilerKwhPerCubicMeter);
    }
    if (state.boilerEfficiencyPercent) {
      setBoilerEfficiencyPercent(state.boilerEfficiencyPercent);
    }
  };

  const loadOnboardingState = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getOnboardingState();
      hydrateFromOnboardingState(body);
    } catch {
      // Keep local defaults when persisted state is unavailable.
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const loadActiveTerms = async () => {
    setLoading(true);
    try {
      const body = await portalClient.getActiveTerms();
      setActiveTerms(body);
      setTermsMessage(`Loaded ${body.versionLabel}.`);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setTermsMessage(
          `No active terms are currently published. ${error.message}`,
        );
      } else {
        setTermsMessage("Failed to load active terms.");
      }
      setActiveTerms(null);
    } finally {
      setLoading(false);
    }
  };

  const acceptTerms = async () => {
    if (!activeTerms) {
      setTermsMessage("Load active terms before accepting.");
      return;
    }

    setLoading(true);
    try {
      const body = await portalClient.acceptTerms(activeTerms.versionId);
      setTermsMessage(`${body.message} Accepted at ${body.acceptedAtUtc}.`);
      await refreshSession(true);
      await loadOnboardingProgress(true);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setTermsMessage(`Terms acceptance failed. ${error.message}`);
      } else {
        setTermsMessage("Failed to accept terms.");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitProfile = async () => {
    const validationErrors = validateProfileInput({
      surname,
      dateOfBirth,
      flatNumber,
      mobileNumber,
    });
    if (Object.keys(validationErrors).length > 0) {
      setProfileFieldErrors(validationErrors);
      setProfileMessage("Review highlighted profile fields and try again.");
      return;
    }

    setProfileFieldErrors({});
    setLoading(true);
    try {
      const body = await portalClient.submitProfile({
        surname,
        dateOfBirth,
        flatNumber,
        mobileNumber,
      });
      setProfileFieldErrors({});
      setProfileMessage(`${body.message} Status: ${body.status}.`);
      setStatusMessage(`Profile details saved for user ${body.userId}.`);
      await refreshSession(true);
      await loadOnboardingProgress(true);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setProfileFieldErrors(error.errors);
        setProfileMessage(`Profile submission failed. ${error.message}`);
      } else {
        setProfileMessage("Failed to submit profile details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitUtilitySetup = async () => {
    const validationErrors = validateUtilitySetupInput({
      moveInDate,
      openingColdWaterReading,
      openingHotWaterReading,
      openingElectricityReading,
      initialWaterTariffPerUnit,
      initialWaterStandingChargePerDay,
      initialWaterVatPercent,
      initialElectricityTariffPerUnit,
      initialElectricityStandingChargePerDay,
      initialElectricityVatPercent,
      hotWaterTemperatureCelsius,
      hotWaterHeatCapacity,
      hotWaterDensity,
      kiloJouleToKiloWattHourFactor,
      boilerKwhPerCubicMeter,
      boilerEfficiencyPercent,
    });
    if (Object.keys(validationErrors).length > 0) {
      setUtilityFieldErrors(validationErrors);
      setUtilitySetupMessage(
        "Review highlighted utility setup fields and try again.",
      );
      return;
    }

    setUtilityFieldErrors({});
    setLoading(true);
    try {
      const body = await portalClient.submitUtilitySetup({
        moveInDate,
        openingColdWaterReading,
        openingHotWaterReading,
        openingElectricityReading,
        initialWaterTariffPerUnit,
        initialWaterStandingChargePerDay,
        initialWaterVatPercent,
        initialElectricityTariffPerUnit,
        initialElectricityStandingChargePerDay,
        initialElectricityVatPercent,
        hotWaterTemperatureCelsius,
        hotWaterHeatCapacity,
        hotWaterDensity,
        kiloJouleToKiloWattHourFactor,
        boilerKwhPerCubicMeter,
        boilerEfficiencyPercent,
      });
      setUtilityFieldErrors({});
      setUtilitySetupMessage(`${body.message} Status: ${body.status}.`);
      setStatusMessage(`Utility setup complete for user ${body.userId}.`);
      await refreshSession(true);
      await loadOnboardingProgress(true);
    } catch (error) {
      if (error instanceof PortalApiError) {
        setUtilityFieldErrors(error.errors);
        setUtilitySetupMessage(`Utility setup failed. ${error.message}`);
      } else {
        setUtilitySetupMessage("Failed to submit utility setup.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOnboardingProgress = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const body = await portalClient.getOnboardingProgress();
      setOnboardingProgress(body);
      setProgressMessage(`Next required step: ${body.nextStep}.`);
    } catch (error) {
      setOnboardingProgress(null);
      if (error instanceof PortalApiError) {
        setProgressMessage(
          `Unable to load onboarding progress. ${error.message}`,
        );
      } else {
        setProgressMessage("Failed to load onboarding progress.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!enableOnboardingHeartbeat) {
      return;
    }

    void loadOnboardingState(true);
    void loadOnboardingProgress(true);

    const heartbeat = window.setInterval(() => {
      void refreshSession(true);
      void loadOnboardingState(true);
      void loadOnboardingProgress(true);
    }, 15000);

    return () => {
      window.clearInterval(heartbeat);
    };
  }, [enableOnboardingHeartbeat]);

  return {
    activeTerms,
    termsMessage,
    surname,
    dateOfBirth,
    flatNumber,
    mobileNumber,
    profileMessage,
    profileFieldErrors,
    moveInDate,
    openingColdWaterReading,
    openingHotWaterReading,
    openingElectricityReading,
    initialWaterTariffPerUnit,
    initialWaterStandingChargePerDay,
    initialWaterVatPercent,
    initialElectricityTariffPerUnit,
    initialElectricityStandingChargePerDay,
    initialElectricityVatPercent,
    hotWaterTemperatureCelsius,
    hotWaterHeatCapacity,
    hotWaterDensity,
    kiloJouleToKiloWattHourFactor,
    boilerKwhPerCubicMeter,
    boilerEfficiencyPercent,
    utilitySetupMessage,
    utilityFieldErrors,
    onboardingProgress,
    progressMessage,
    loadActiveTerms,
    acceptTerms,
    submitProfile,
    submitUtilitySetup,
    loadOnboardingState,
    loadOnboardingProgress,
    setSurname,
    setDateOfBirth,
    setFlatNumber,
    setMobileNumber,
    setMoveInDate,
    setOpeningColdWaterReading,
    setOpeningHotWaterReading,
    setOpeningElectricityReading,
    setInitialWaterTariffPerUnit,
    setInitialWaterStandingChargePerDay,
    setInitialWaterVatPercent,
    setInitialElectricityTariffPerUnit,
    setInitialElectricityStandingChargePerDay,
    setInitialElectricityVatPercent,
    setHotWaterTemperatureCelsius,
    setHotWaterHeatCapacity,
    setHotWaterDensity,
    setKiloJouleToKiloWattHourFactor,
    setBoilerKwhPerCubicMeter,
    setBoilerEfficiencyPercent,
  };
}
