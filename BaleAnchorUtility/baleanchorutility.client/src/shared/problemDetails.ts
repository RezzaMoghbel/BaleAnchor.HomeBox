export interface ApiProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

export interface ParsedProblemDetails {
  message: string;
  errors: Record<string, string[]>;
}

function formatValidationErrors(errors?: Record<string, string[]>): string {
  if (!errors) {
    return "";
  }

  const parts = Object.entries(errors)
    .flatMap(([field, messages]) =>
      messages.map((message) => `${field}: ${message}`),
    )
    .filter((x) => x.length > 0);

  return parts.length > 0 ? ` ${parts.join(" | ")}` : "";
}

export function getFieldErrors(
  errors: Record<string, string[]>,
  fieldName: string,
): string[] {
  const direct = errors[fieldName];
  if (direct && direct.length > 0) {
    return direct;
  }

  const wanted = fieldName.toLowerCase();
  const matchEntry = Object.entries(errors).find(([key]) => {
    const normalized = key.replace(/^\$\./, "").toLowerCase();
    return normalized === wanted;
  });

  return matchEntry?.[1] ?? [];
}

export async function readProblemDetails(
  response: Response,
): Promise<ParsedProblemDetails> {
  try {
    const body = (await response.json()) as ApiProblemDetails;
    const detail = body.detail || body.title || "The request failed.";
    const errors = body.errors ?? {};
    return {
      message: `${detail}${formatValidationErrors(errors)}`,
      errors,
    };
  } catch {
    return {
      message: "The request failed.",
      errors: {},
    };
  }
}
