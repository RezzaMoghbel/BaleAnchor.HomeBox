import { z } from "zod";
import type { FieldErrors } from "../shared/contracts";

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date in YYYY-MM-DD format.");

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

const readingsSchema = z.object({
  readingDate: isoDateSchema,
  coldWaterReading: decimalUpTo3Schema,
  hotWaterReading: decimalUpTo3Schema,
  electricityReading: decimalUpTo3Schema,
});

const tariffSchema = z.object({
  effectiveFromDate: isoDateSchema,
  waterTariffPerUnit: decimalUpTo6Schema,
  waterStandingChargePerDay: decimalUpTo6Schema,
  waterVatPercent: decimalUpTo6Schema,
  electricityTariffPerUnit: decimalUpTo6Schema,
  electricityStandingChargePerDay: decimalUpTo6Schema,
  electricityVatPercent: decimalUpTo6Schema,
});

const paymentSchema = z.object({
  amount: decimalUpTo2Schema,
  paymentDate: isoDateSchema,
  method: z
    .string()
    .trim()
    .min(2, "Payment method must be at least 2 characters.")
    .max(40, "Payment method must be 40 characters or fewer."),
  reference: z
    .string()
    .trim()
    .max(100, "Reference must be 100 characters or fewer.")
    .optional(),
  notes: z
    .string()
    .trim()
    .max(300, "Notes must be 300 characters or fewer.")
    .optional(),
});

interface ReadingsValidationInput {
  readingDate: string;
  coldWaterReading: string;
  hotWaterReading: string;
  electricityReading: string;
}

interface TariffValidationInput {
  effectiveFromDate: string;
  waterTariffPerUnit: string;
  waterStandingChargePerDay: string;
  waterVatPercent: string;
  electricityTariffPerUnit: string;
  electricityStandingChargePerDay: string;
  electricityVatPercent: string;
}

interface PaymentValidationInput {
  amount: string;
  paymentDate: string;
  method: string;
  reference: string;
  notes: string;
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

export function validateReadingsInput(
  input: ReadingsValidationInput,
): FieldErrors {
  const result = readingsSchema.safeParse({
    readingDate: input.readingDate.trim(),
    coldWaterReading: input.coldWaterReading.trim(),
    hotWaterReading: input.hotWaterReading.trim(),
    electricityReading: input.electricityReading.trim(),
  });

  return result.success ? {} : toFieldErrors(result.error);
}

export function validateTariffInput(input: TariffValidationInput): FieldErrors {
  const result = tariffSchema.safeParse({
    effectiveFromDate: input.effectiveFromDate.trim(),
    waterTariffPerUnit: input.waterTariffPerUnit.trim(),
    waterStandingChargePerDay: input.waterStandingChargePerDay.trim(),
    waterVatPercent: input.waterVatPercent.trim(),
    electricityTariffPerUnit: input.electricityTariffPerUnit.trim(),
    electricityStandingChargePerDay:
      input.electricityStandingChargePerDay.trim(),
    electricityVatPercent: input.electricityVatPercent.trim(),
  });

  return result.success ? {} : toFieldErrors(result.error);
}

export function validatePaymentInput(
  input: PaymentValidationInput,
): FieldErrors {
  const result = paymentSchema.safeParse({
    amount: input.amount.trim(),
    paymentDate: input.paymentDate.trim(),
    method: input.method.trim(),
    reference: input.reference.trim() || undefined,
    notes: input.notes.trim() || undefined,
  });

  return result.success ? {} : toFieldErrors(result.error);
}
