import { describe, expect, it } from "vitest";
import { validateProfileInput, validateUtilitySetupInput } from "./onboarding";

describe("onboarding validation", () => {
  it("accepts valid profile input", () => {
    expect(
      validateProfileInput({
        surname: "Smith",
        dateOfBirth: "1990-01-10",
        flatNumber: "A12",
        mobileNumber: "07123456789",
      }),
    ).toEqual({});
  });

  it("returns profile field errors for invalid values", () => {
    expect(
      validateProfileInput({
        surname: "S",
        dateOfBirth: "10/01/1990",
        flatNumber: "",
        mobileNumber: "123",
      }),
    ).toEqual({
      surname: ["Surname must be at least 2 characters."],
      dateOfBirth: ["Enter a valid date in YYYY-MM-DD format."],
      flatNumber: ["Flat number is required."],
      mobileNumber: ["Mobile number must be at least 7 characters."],
    });
  });

  it("accepts valid utility setup input", () => {
    expect(
      validateUtilitySetupInput({
        moveInDate: "2026-04-01",
        openingColdWaterReading: "0.125",
        openingHotWaterReading: "0.500",
        openingElectricityReading: "12.125",
        initialWaterTariffPerUnit: "1.123456",
        initialElectricityTariffPerUnit: "0.654321",
        boilerKwhPerCubicMeter: "10.250000",
        boilerEfficiencyPercent: "85.50",
      }),
    ).toEqual({});
  });

  it("returns utility setup field errors for invalid values", () => {
    expect(
      validateUtilitySetupInput({
        moveInDate: "01-04-2026",
        openingColdWaterReading: "1.1234",
        openingHotWaterReading: "abc",
        openingElectricityReading: "",
        initialWaterTariffPerUnit: "1.1234567",
        initialElectricityTariffPerUnit: "-1",
        boilerKwhPerCubicMeter: "x",
        boilerEfficiencyPercent: "85.555",
      }),
    ).toEqual({
      moveInDate: ["Enter a valid date in YYYY-MM-DD format."],
      openingColdWaterReading: [
        "Enter a valid number with up to 3 decimal places.",
      ],
      openingHotWaterReading: [
        "Enter a valid number with up to 3 decimal places.",
      ],
      openingElectricityReading: [
        "Enter a valid number with up to 3 decimal places.",
      ],
      initialWaterTariffPerUnit: [
        "Enter a valid number with up to 6 decimal places.",
      ],
      initialElectricityTariffPerUnit: [
        "Enter a valid number with up to 6 decimal places.",
      ],
      boilerKwhPerCubicMeter: [
        "Enter a valid number with up to 6 decimal places.",
      ],
      boilerEfficiencyPercent: [
        "Enter a valid number with up to 2 decimal places.",
      ],
    });
  });
});
