import { describe, expect, it } from "vitest";
import {
  validatePaymentInput,
  validateReadingsInput,
  validateTariffInput,
} from "./billing";

describe("billing validation", () => {
  it("accepts valid readings input", () => {
    expect(
      validateReadingsInput({
        readingDate: "2026-07-28",
        coldWaterReading: "10.123",
        hotWaterReading: "3.1",
        electricityReading: "55",
      }),
    ).toEqual({});
  });

  it("returns field errors for invalid readings input", () => {
    expect(
      validateReadingsInput({
        readingDate: "28/07/2026",
        coldWaterReading: "10.1234",
        hotWaterReading: "abc",
        electricityReading: "",
      }),
    ).toEqual({
      readingDate: ["Enter a valid date in YYYY-MM-DD format."],
      coldWaterReading: ["Enter a valid number with up to 3 decimal places."],
      hotWaterReading: ["Enter a valid number with up to 3 decimal places."],
      electricityReading: ["Enter a valid number with up to 3 decimal places."],
    });
  });

  it("accepts valid tariff input", () => {
    expect(
      validateTariffInput({
        effectiveFromDate: "2026-07-01",
        waterTariffPerUnit: "1.123456",
        waterStandingChargePerDay: "0.654321",
        waterVatPercent: "5",
        electricityTariffPerUnit: "0.356789",
        electricityStandingChargePerDay: "0.300000",
        electricityVatPercent: "20.000000",
      }),
    ).toEqual({});
  });

  it("returns field errors for invalid tariff input", () => {
    expect(
      validateTariffInput({
        effectiveFromDate: "2026/07/01",
        waterTariffPerUnit: "1.1234567",
        waterStandingChargePerDay: "abc",
        waterVatPercent: "",
        electricityTariffPerUnit: "-0.3",
        electricityStandingChargePerDay: "1.2.3",
        electricityVatPercent: "20.1234567",
      }),
    ).toEqual({
      effectiveFromDate: ["Enter a valid date in YYYY-MM-DD format."],
      waterTariffPerUnit: ["Enter a valid number with up to 6 decimal places."],
      waterStandingChargePerDay: [
        "Enter a valid number with up to 6 decimal places.",
      ],
      waterVatPercent: ["Enter a valid number with up to 6 decimal places."],
      electricityTariffPerUnit: [
        "Enter a valid number with up to 6 decimal places.",
      ],
      electricityStandingChargePerDay: [
        "Enter a valid number with up to 6 decimal places.",
      ],
      electricityVatPercent: [
        "Enter a valid number with up to 6 decimal places.",
      ],
    });
  });

  it("accepts valid payment input", () => {
    expect(
      validatePaymentInput({
        amount: "120.50",
        paymentDate: "2026-07-29",
        method: "Direct Debit",
        reference: "July",
        notes: "Paid on time",
      }),
    ).toEqual({});
  });

  it("returns field errors for invalid payment input", () => {
    expect(
      validatePaymentInput({
        amount: "120.999",
        paymentDate: "29-07-2026",
        method: "D",
        reference: "x".repeat(101),
        notes: "x".repeat(301),
      }),
    ).toEqual({
      amount: ["Enter a valid number with up to 2 decimal places."],
      paymentDate: ["Enter a valid date in YYYY-MM-DD format."],
      method: ["Payment method must be at least 2 characters."],
      reference: ["Reference must be 100 characters or fewer."],
      notes: ["Notes must be 300 characters or fewer."],
    });
  });
});
