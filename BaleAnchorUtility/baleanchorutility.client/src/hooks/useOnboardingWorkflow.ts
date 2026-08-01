import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
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

  const [surname, setSurnameState] = useState("");
  const [dateOfBirth, setDateOfBirthState] = useState("");
  const [flatNumber, setFlatNumberState] = useState("");
  const [mobileNumber, setMobileNumberState] = useState("");
  const [profileMessage, setProfileMessage] = useState(
    "Profile details not submitted.",
  );
  const [profileFieldErrors, setProfileFieldErrors] = useState<FieldErrors>({});

  const [moveInDate, setMoveInDateState] = useState("");
  const [openingColdWaterReading, setOpeningColdWaterReadingState] =
    useState("");
  const [openingHotWaterReading, setOpeningHotWaterReadingState] = useState("");
  const [openingElectricityReading, setOpeningElectricityReadingState] =
    useState("");
  const [initialWaterTariffPerUnit, setInitialWaterTariffPerUnitState] =
    useState("");
  const [
    initialWaterStandingChargePerDay,
    setInitialWaterStandingChargePerDayState,
  ] = useState("");
  const [initialWaterVatPercent, setInitialWaterVatPercentState] = useState("");
  const [
    initialElectricityTariffPerUnit,
    setInitialElectricityTariffPerUnitState,
  ] = useState("");
  const [
    initialElectricityStandingChargePerDay,
    setInitialElectricityStandingChargePerDayState,
  ] = useState("");
  const [initialElectricityVatPercent, setInitialElectricityVatPercentState] =
    useState("");
  const [hotWaterTemperatureCelsius, setHotWaterTemperatureCelsiusState] =
    useState("55");
  const [hotWaterHeatCapacity, setHotWaterHeatCapacityState] =
    useState("4.186");
  const [hotWaterDensity, setHotWaterDensityState] = useState("1000");
  const [kiloJouleToKiloWattHourFactor, setKiloJouleToKiloWattHourFactorState] =
    useState("3600");
  const [boilerKwhPerCubicMeter, setBoilerKwhPerCubicMeterState] =
    useState("10.500000");
  const [boilerEfficiencyPercent, setBoilerEfficiencyPercentState] =
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
  const allowServerHydrationRef = useRef(true);

  const markLocalOnboardingEdit = () => {
    allowServerHydrationRef.current = false;
  };

  const setSurname = (value: string) => {
    markLocalOnboardingEdit();
    setSurnameState(value);
  };

  const setDateOfBirth = (value: string) => {
    markLocalOnboardingEdit();
    setDateOfBirthState(value);
  };

  const setFlatNumber = (value: string) => {
    markLocalOnboardingEdit();
    setFlatNumberState(value);
  };

  const setMobileNumber = (value: string) => {
    markLocalOnboardingEdit();
    setMobileNumberState(value);
  };

  const setMoveInDate = (value: string) => {
    markLocalOnboardingEdit();
    setMoveInDateState(value);
  };

  const setOpeningColdWaterReading = (value: string) => {
    markLocalOnboardingEdit();
    setOpeningColdWaterReadingState(value);
  };

  const setOpeningHotWaterReading = (value: string) => {
    markLocalOnboardingEdit();
    setOpeningHotWaterReadingState(value);
  };

  const setOpeningElectricityReading = (value: string) => {
    markLocalOnboardingEdit();
    setOpeningElectricityReadingState(value);
  };

  const setInitialWaterTariffPerUnit = (value: string) => {
    markLocalOnboardingEdit();
    setInitialWaterTariffPerUnitState(value);
  };

  const setInitialWaterStandingChargePerDay = (value: string) => {
    markLocalOnboardingEdit();
    setInitialWaterStandingChargePerDayState(value);
  };

  const setInitialWaterVatPercent = (value: string) => {
    markLocalOnboardingEdit();
    setInitialWaterVatPercentState(value);
  };

  const setInitialElectricityTariffPerUnit = (value: string) => {
    markLocalOnboardingEdit();
    setInitialElectricityTariffPerUnitState(value);
  };

  const setInitialElectricityStandingChargePerDay = (value: string) => {
    markLocalOnboardingEdit();
    setInitialElectricityStandingChargePerDayState(value);
  };

  const setInitialElectricityVatPercent = (value: string) => {
    markLocalOnboardingEdit();
    setInitialElectricityVatPercentState(value);
  };

  const setHotWaterTemperatureCelsius = (value: string) => {
    markLocalOnboardingEdit();
    setHotWaterTemperatureCelsiusState(value);
  };

  const setHotWaterHeatCapacity = (value: string) => {
    markLocalOnboardingEdit();
    setHotWaterHeatCapacityState(value);
  };

  const setHotWaterDensity = (value: string) => {
    markLocalOnboardingEdit();
    setHotWaterDensityState(value);
  };

  const setKiloJouleToKiloWattHourFactor = (value: string) => {
    markLocalOnboardingEdit();
    setKiloJouleToKiloWattHourFactorState(value);
  };

  const setBoilerKwhPerCubicMeter = (value: string) => {
    markLocalOnboardingEdit();
    setBoilerKwhPerCubicMeterState(value);
  };

  const setBoilerEfficiencyPercent = (value: string) => {
    markLocalOnboardingEdit();
    setBoilerEfficiencyPercentState(value);
  };

  const hydrateFromOnboardingState = (state: OnboardingStateResponse) => {
    if (!allowServerHydrationRef.current) {
      return;
    }

    setSurnameState(state.surname);
    setDateOfBirthState(state.dateOfBirth);
    setFlatNumberState(state.flatNumber);
    setMobileNumberState(state.mobileNumber);

    if (state.moveInDate) {
      setMoveInDateState(state.moveInDate);
    }
    if (state.openingColdWaterReading) {
      setOpeningColdWaterReadingState(state.openingColdWaterReading);
    }
    if (state.openingHotWaterReading) {
      setOpeningHotWaterReadingState(state.openingHotWaterReading);
    }
    if (state.openingElectricityReading) {
      setOpeningElectricityReadingState(state.openingElectricityReading);
    }
    if (state.initialWaterTariffPerUnit) {
      setInitialWaterTariffPerUnitState(state.initialWaterTariffPerUnit);
    }
    if (state.initialWaterStandingChargePerDay) {
      setInitialWaterStandingChargePerDayState(
        state.initialWaterStandingChargePerDay,
      );
    }
    if (state.initialWaterVatPercent) {
      setInitialWaterVatPercentState(state.initialWaterVatPercent);
    }
    if (state.initialElectricityTariffPerUnit) {
      setInitialElectricityTariffPerUnitState(
        state.initialElectricityTariffPerUnit,
      );
    }
    if (state.initialElectricityStandingChargePerDay) {
      setInitialElectricityStandingChargePerDayState(
        state.initialElectricityStandingChargePerDay,
      );
    }
    if (state.initialElectricityVatPercent) {
      setInitialElectricityVatPercentState(state.initialElectricityVatPercent);
    }
    if (state.hotWaterTemperatureCelsius) {
      setHotWaterTemperatureCelsiusState(state.hotWaterTemperatureCelsius);
    }
    if (state.hotWaterHeatCapacity) {
      setHotWaterHeatCapacityState(state.hotWaterHeatCapacity);
    }
    if (state.hotWaterDensity) {
      setHotWaterDensityState(state.hotWaterDensity);
    }
    if (state.kiloJouleToKiloWattHourFactor) {
      setKiloJouleToKiloWattHourFactorState(
        state.kiloJouleToKiloWattHourFactor,
      );
    }

    if (state.boilerKwhPerCubicMeter) {
      setBoilerKwhPerCubicMeterState(state.boilerKwhPerCubicMeter);
    }
    if (state.boilerEfficiencyPercent) {
      setBoilerEfficiencyPercentState(state.boilerEfficiencyPercent);
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

    const heartbeat = window.setInterval(() => {
      void refreshSession(true);
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
