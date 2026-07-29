import { z } from "zod";
import type { FieldErrors } from "../shared/contracts";

const requestCodeSchema = z.object({
  email: z.email("Enter a valid email address."),
});

const verifyCodeSchema = z.object({
  email: z.email("Enter a valid email address."),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code."),
});

function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of error.issues) {
    const fieldName = issue.path.join(".") || "form";
    const existing = errors[fieldName] ?? [];
    errors[fieldName] = [...existing, issue.message];
  }

  return errors;
}

export function validateRequestCodeInput(email: string): FieldErrors {
  const result = requestCodeSchema.safeParse({ email: email.trim() });
  return result.success ? {} : toFieldErrors(result.error);
}

export function validateVerifyCodeInput(
  email: string,
  code: string,
): FieldErrors {
  const result = verifyCodeSchema.safeParse({
    email: email.trim(),
    code: code.trim(),
  });

  return result.success ? {} : toFieldErrors(result.error);
}
