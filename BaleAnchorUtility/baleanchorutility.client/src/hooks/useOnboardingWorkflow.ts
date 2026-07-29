import { type Dispatch, type SetStateAction, useState } from "react";
import { PortalApiError, portalClient } from "../api/portalClient";
import type {
  ActiveTermsResponse,
  FieldErrors,
  OnboardingProgressResponse,
} from "../shared/contracts";
import {
  validateProfileInput,
  validateUtilitySetupInput,
} from "../validation/onboarding";

interface UseOnboardingWorkflowArgs {
  setLoading: Dispatch<SetStateAction<boolean>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  refreshSession: () => Promise<void>;
}

export function useOnboardingWorkflow({
  setLoading,
  setStatusMessage,
  refreshSession,
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
  const [initialElectricityTariffPerUnit, setInitialElectricityTariffPerUnit] =
    useState("");
  const [boilerKwhPerCubicMeter, setBoilerKwhPerCubicMeter] = useState("");
  const [boilerEfficiencyPercent, setBoilerEfficiencyPercent] = useState("");
  const [utilitySetupMessage, setUtilitySetupMessage] = useState(
    "Utility setup not submitted.",
  );
  const [utilityFieldErrors, setUtilityFieldErrors] = useState<FieldErrors>({});

  const [onboardingProgress, setOnboardingProgress] =
    useState<OnboardingProgressResponse | null>(null);
  const [progressMessage, setProgressMessage] = useState(
    "Onboarding progress not loaded.",
  );

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
      await refreshSession();
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
      initialElectricityTariffPerUnit,
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
        initialElectricityTariffPerUnit,
        boilerKwhPerCubicMeter,
        boilerEfficiencyPercent,
      });
      setUtilityFieldErrors({});
      setUtilitySetupMessage(`${body.message} Status: ${body.status}.`);
      setStatusMessage(`Utility setup complete for user ${body.userId}.`);
      await refreshSession();
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

  const loadOnboardingProgress = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

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
    initialElectricityTariffPerUnit,
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
    setInitialElectricityTariffPerUnit,
    setBoilerKwhPerCubicMeter,
    setBoilerEfficiencyPercent,
  };
}
