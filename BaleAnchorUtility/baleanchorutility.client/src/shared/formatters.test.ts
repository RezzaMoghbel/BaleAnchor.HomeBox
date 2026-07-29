import { describe, expect, it } from "vitest";
import {
  formatCurrencyGbp,
  formatDateRange,
  formatDisplayDate,
  formatDisplayDateTime,
} from "./formatters";

describe("formatters", () => {
  it("formats yyyy-mm-dd dates in dd/mm/yyyy", () => {
    expect(formatDisplayDate("2026-07-29")).toBe("29/07/2026");
  });

  it("returns fallback marker for missing dates", () => {
    expect(formatDisplayDate()).toBe("-");
    expect(formatDisplayDateTime()).toBe("-");
  });

  it("formats gbp values with 2 decimals", () => {
    expect(formatCurrencyGbp("1234.5")).toBe("£1,234.50");
  });

  it("returns input for non-numeric gbp value", () => {
    expect(formatCurrencyGbp("not-a-number")).toBe("not-a-number");
  });

  it("builds formatted date ranges", () => {
    expect(formatDateRange("2026-07-01", "2026-08-01")).toBe(
      "01/07/2026 to 01/08/2026",
    );
  });
});
