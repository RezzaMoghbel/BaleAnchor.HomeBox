import { z } from "zod";
import type { FieldErrors } from "../shared/contracts";

const requestCodeSchema = z.object({
  email: z.email("Enter a valid email address."),
});

const signupRequestCodeSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[0-9]/, "Password must include a number.")
    .regex(/[^A-Za-z0-9]/, "Password must include a special character."),
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

export function validateSignupRequestCodeInput(
  email: string,
  password: string,
): FieldErrors {
  const result = signupRequestCodeSchema.safeParse({
    email: email.trim(),
    password: password.trim(),
  });

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
