import { z } from "zod";
import type { FieldErrors } from "../shared/contracts";

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date in YYYY-MM-DD format.");

const profileSchema = z.object({
  surname: z
    .string()
    .trim()
    .min(2, "Surname must be at least 2 characters.")
    .max(80, "Surname must be 80 characters or fewer."),
  dateOfBirth: isoDateSchema,
  flatNumber: z
    .string()
    .trim()
    .min(1, "Flat number is required.")
    .max(20, "Flat number must be 20 characters or fewer."),
  mobileNumber: z
    .string()
    .trim()
    .min(7, "Mobile number must be at least 7 characters.")
    .max(32, "Mobile number must be 32 characters or fewer."),
});

const decimalUpTo3Schema = z
  .string()
  .trim()
  .regex(
    /^\d+(\.\d{1,3})?$/,
    "Enter a valid number with up to 3 decimal places.",
  );

const decimalUpTo6Schema = z
  .string()
  .trim()
  .regex(
    /^\d+(\.\d{1,6})?$/,
    "Enter a valid number with up to 6 decimal places.",
  );

const decimalUpTo2Schema = z
  .string()
  .trim()
  .regex(
    /^\d+(\.\d{1,2})?$/,
    "Enter a valid number with up to 2 decimal places.",
  );

const utilitySetupSchema = z.object({
  moveInDate: isoDateSchema,
  openingColdWaterReading: decimalUpTo3Schema,
  openingHotWaterReading: decimalUpTo3Schema,
  openingElectricityReading: decimalUpTo3Schema,
  initialWaterTariffPerUnit: decimalUpTo6Schema,
  initialWaterStandingChargePerDay: decimalUpTo6Schema,
  initialWaterVatPercent: decimalUpTo2Schema,
  initialElectricityTariffPerUnit: decimalUpTo6Schema,
  initialElectricityStandingChargePerDay: decimalUpTo6Schema,
  initialElectricityVatPercent: decimalUpTo2Schema,
  hotWaterTemperatureCelsius: decimalUpTo2Schema,
  hotWaterHeatCapacity: decimalUpTo6Schema,
  hotWaterDensity: decimalUpTo3Schema,
  kiloJouleToKiloWattHourFactor: decimalUpTo6Schema,
  boilerKwhPerCubicMeter: decimalUpTo6Schema,
  boilerEfficiencyPercent: decimalUpTo2Schema,
});

interface ProfileValidationInput {
  surname: string;
  dateOfBirth: string;
  flatNumber: string;
  mobileNumber: string;
}

interface UtilitySetupValidationInput {
  moveInDate: string;
  openingColdWaterReading: string;
  openingHotWaterReading: string;
  openingElectricityReading: string;
  initialWaterTariffPerUnit: string;
  initialWaterStandingChargePerDay: string;
  initialWaterVatPercent: string;
  initialElectricityTariffPerUnit: string;
  initialElectricityStandingChargePerDay: string;
  initialElectricityVatPercent: string;
  hotWaterTemperatureCelsius: string;
  hotWaterHeatCapacity: string;
  hotWaterDensity: string;
  kiloJouleToKiloWattHourFactor: string;
  boilerKwhPerCubicMeter: string;
  boilerEfficiencyPercent: string;
}

function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of error.issues) {
    const fieldName = issue.path.join(".") || "form";
    const existing = errors[fieldName] ?? [];
    errors[fieldName] = [...existing, issue.message];
  }

  return errors;
}

export function validateProfileInput(
  input: ProfileValidationInput,
): FieldErrors {
  const result = profileSchema.safeParse({
    surname: input.surname.trim(),
    dateOfBirth: input.dateOfBirth.trim(),
    flatNumber: input.flatNumber.trim(),
    mobileNumber: input.mobileNumber.trim(),
  });

  return result.success ? {} : toFieldErrors(result.error);
}

export function validateUtilitySetupInput(
  input: UtilitySetupValidationInput,
): FieldErrors {
  const result = utilitySetupSchema.safeParse({
    moveInDate: input.moveInDate.trim(),
    openingColdWaterReading: input.openingColdWaterReading.trim(),
    openingHotWaterReading: input.openingHotWaterReading.trim(),
    openingElectricityReading: input.openingElectricityReading.trim(),
    initialWaterTariffPerUnit: input.initialWaterTariffPerUnit.trim(),
    initialWaterStandingChargePerDay:
      input.initialWaterStandingChargePerDay.trim(),
    initialWaterVatPercent: input.initialWaterVatPercent.trim(),
    initialElectricityTariffPerUnit:
      input.initialElectricityTariffPerUnit.trim(),
    initialElectricityStandingChargePerDay:
      input.initialElectricityStandingChargePerDay.trim(),
    initialElectricityVatPercent: input.initialElectricityVatPercent.trim(),
    hotWaterTemperatureCelsius: input.hotWaterTemperatureCelsius.trim(),
    hotWaterHeatCapacity: input.hotWaterHeatCapacity.trim(),
    hotWaterDensity: input.hotWaterDensity.trim(),
    kiloJouleToKiloWattHourFactor: input.kiloJouleToKiloWattHourFactor.trim(),
    boilerKwhPerCubicMeter: input.boilerKwhPerCubicMeter.trim(),
    boilerEfficiencyPercent: input.boilerEfficiencyPercent.trim(),
  });

  return result.success ? {} : toFieldErrors(result.error);
}
