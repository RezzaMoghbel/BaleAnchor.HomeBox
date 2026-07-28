const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Europe/London",
});

export function formatDisplayDate(value?: string): string {
  if (!value) {
    return "-";
  }

  const shortDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (shortDateMatch) {
    const [, year, month, day] = shortDateMatch;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateFormatter.format(parsed);
}

export function formatDisplayDateTime(value?: string): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateTimeFormatter.format(parsed);
}

export function formatCurrencyGbp(value?: string): string {
  if (!value) {
    return "£0.00";
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }

  return gbpFormatter.format(numeric);
}

export function formatDateRange(
  startDate: string,
  endDateExclusive: string,
): string {
  return `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDateExclusive)}`;
}
