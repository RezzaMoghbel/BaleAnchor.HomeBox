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
        initialWaterStandingChargePerDay: "0.250000",
        initialWaterVatPercent: "5",
        initialElectricityTariffPerUnit: "0.654321",
        initialElectricityStandingChargePerDay: "0.450000",
        initialElectricityVatPercent: "20",
        hotWaterTemperatureCelsius: "55",
        hotWaterHeatCapacity: "4.186000",
        hotWaterDensity: "1000",
        kiloJouleToKiloWattHourFactor: "3600",
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
        initialWaterStandingChargePerDay: "0.1234567",
        initialWaterVatPercent: "5.555",
        initialElectricityTariffPerUnit: "-1",
        initialElectricityStandingChargePerDay: "abc",
        initialElectricityVatPercent: "abc",
        hotWaterTemperatureCelsius: "1.234",
        hotWaterHeatCapacity: "1.1234567",
        hotWaterDensity: "1.1234",
        kiloJouleToKiloWattHourFactor: "x",
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
      initialWaterStandingChargePerDay: [
        "Enter a valid number with up to 6 decimal places.",
      ],
      initialWaterVatPercent: [
        "Enter a valid number with up to 2 decimal places.",
      ],
      initialElectricityTariffPerUnit: [
        "Enter a valid number with up to 6 decimal places.",
      ],
      initialElectricityStandingChargePerDay: [
        "Enter a valid number with up to 6 decimal places.",
      ],
      initialElectricityVatPercent: [
        "Enter a valid number with up to 2 decimal places.",
      ],
      hotWaterTemperatureCelsius: [
        "Enter a valid number with up to 2 decimal places.",
      ],
      hotWaterHeatCapacity: [
        "Enter a valid number with up to 6 decimal places.",
      ],
      hotWaterDensity: ["Enter a valid number with up to 3 decimal places."],
      kiloJouleToKiloWattHourFactor: [
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
