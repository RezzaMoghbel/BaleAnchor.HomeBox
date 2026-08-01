import { useState } from "react";
import type { FieldErrors } from "../shared/contracts";

function clearFieldError(
  currentErrors: FieldErrors,
  fieldName: string,
): FieldErrors {
  if (!currentErrors[fieldName]) {
    return currentErrors;
  }

  const next = { ...currentErrors };
  delete next[fieldName];
  return next;
}

export function useBillingFormState() {
  const [readingDate, setReadingDate] = useState("");
  const [coldWaterReading, setColdWaterReading] = useState("");
  const [hotWaterReading, setHotWaterReading] = useState("");
  const [electricityReading, setElectricityReading] = useState("");
  const [tariffEffectiveFromDate, setTariffEffectiveFromDate] = useState("");
  const [waterTariffPerUnit, setWaterTariffPerUnit] = useState("");
  const [waterStandingChargePerDay, setWaterStandingChargePerDay] =
    useState("");
  const [waterVatPercent, setWaterVatPercent] = useState("");
  const [electricityTariffPerUnit, setElectricityTariffPerUnit] = useState("");
  const [electricityStandingChargePerDay, setElectricityStandingChargePerDay] =
    useState("");
  const [electricityVatPercent, setElectricityVatPercent] = useState("");
  const [boilerEffectiveFromDate, setBoilerEffectiveFromDate] = useState("");
  const [hotWaterTemperatureCelsius, setHotWaterTemperatureCelsius] =
    useState("");
  const [hotWaterHeatCapacity, setHotWaterHeatCapacity] = useState("");
  const [hotWaterDensity, setHotWaterDensity] = useState("");
  const [kiloJouleToKiloWattHourFactor, setKiloJouleToKiloWattHourFactor] =
    useState("");
  const [boilerKwhPerCubicMeter, setBoilerKwhPerCubicMeter] = useState("");
  const [boilerEfficiencyPercent, setBoilerEfficiencyPercent] = useState("");
  const [readingsFieldErrors, setReadingsFieldErrors] = useState<FieldErrors>(
    {},
  );
  const [tariffFieldErrors, setTariffFieldErrors] = useState<FieldErrors>({});
  const [boilerFieldErrors, setBoilerFieldErrors] = useState<FieldErrors>({});

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Direct Debit");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentFieldErrors, setPaymentFieldErrors] = useState<FieldErrors>({});

  const handleReadingDateChange = (value: string) => {
    setReadingDate(value);
    setReadingsFieldErrors((current) =>
      clearFieldError(current, "readingDate"),
    );
  };

  const handleColdWaterReadingChange = (value: string) => {
    setColdWaterReading(value);
    setReadingsFieldErrors((current) =>
      clearFieldError(current, "coldWaterReading"),
    );
  };

  const handleHotWaterReadingChange = (value: string) => {
    setHotWaterReading(value);
    setReadingsFieldErrors((current) =>
      clearFieldError(current, "hotWaterReading"),
    );
  };

  const handleElectricityReadingChange = (value: string) => {
    setElectricityReading(value);
    setReadingsFieldErrors((current) =>
      clearFieldError(current, "electricityReading"),
    );
  };

  const handleTariffEffectiveFromDateChange = (value: string) => {
    setTariffEffectiveFromDate(value);
    setTariffFieldErrors((current) =>
      clearFieldError(current, "effectiveFromDate"),
    );
  };

  const handleWaterTariffPerUnitChange = (value: string) => {
    setWaterTariffPerUnit(value);
    setTariffFieldErrors((current) =>
      clearFieldError(current, "waterTariffPerUnit"),
    );
  };

  const handleWaterStandingChargePerDayChange = (value: string) => {
    setWaterStandingChargePerDay(value);
    setTariffFieldErrors((current) =>
      clearFieldError(current, "waterStandingChargePerDay"),
    );
  };

  const handleWaterVatPercentChange = (value: string) => {
    setWaterVatPercent(value);
    setTariffFieldErrors((current) =>
      clearFieldError(current, "waterVatPercent"),
    );
  };

  const handleElectricityTariffPerUnitChange = (value: string) => {
    setElectricityTariffPerUnit(value);
    setTariffFieldErrors((current) =>
      clearFieldError(current, "electricityTariffPerUnit"),
    );
  };

  const handleElectricityStandingChargePerDayChange = (value: string) => {
    setElectricityStandingChargePerDay(value);
    setTariffFieldErrors((current) =>
      clearFieldError(current, "electricityStandingChargePerDay"),
    );
  };

  const handleElectricityVatPercentChange = (value: string) => {
    setElectricityVatPercent(value);
    setTariffFieldErrors((current) =>
      clearFieldError(current, "electricityVatPercent"),
    );
  };

  const handleBoilerEffectiveFromDateChange = (value: string) => {
    setBoilerEffectiveFromDate(value);
    setBoilerFieldErrors((current) =>
      clearFieldError(current, "effectiveFromDate"),
    );
  };

  const handleHotWaterTemperatureCelsiusChange = (value: string) => {
    setHotWaterTemperatureCelsius(value);
    setBoilerFieldErrors((current) =>
      clearFieldError(current, "hotWaterTemperatureCelsius"),
    );
  };

  const handleHotWaterHeatCapacityChange = (value: string) => {
    setHotWaterHeatCapacity(value);
    setBoilerFieldErrors((current) =>
      clearFieldError(current, "hotWaterHeatCapacity"),
    );
  };

  const handleHotWaterDensityChange = (value: string) => {
    setHotWaterDensity(value);
    setBoilerFieldErrors((current) =>
      clearFieldError(current, "hotWaterDensity"),
    );
  };

  const handleKiloJouleToKiloWattHourFactorChange = (value: string) => {
    setKiloJouleToKiloWattHourFactor(value);
    setBoilerFieldErrors((current) =>
      clearFieldError(current, "kiloJouleToKiloWattHourFactor"),
    );
  };

  const handleBoilerKwhPerCubicMeterChange = (value: string) => {
    setBoilerKwhPerCubicMeter(value);
    setBoilerFieldErrors((current) =>
      clearFieldError(current, "boilerKwhPerCubicMeter"),
    );
  };

  const handleBoilerEfficiencyPercentChange = (value: string) => {
    setBoilerEfficiencyPercent(value);
    setBoilerFieldErrors((current) =>
      clearFieldError(current, "boilerEfficiencyPercent"),
    );
  };

  const handlePaymentAmountChange = (value: string) => {
    setPaymentAmount(value);
    setPaymentFieldErrors((current) => clearFieldError(current, "amount"));
  };

  const handlePaymentDateChange = (value: string) => {
    setPaymentDate(value);
    setPaymentFieldErrors((current) => clearFieldError(current, "paymentDate"));
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value);
    setPaymentFieldErrors((current) => clearFieldError(current, "method"));
  };

  const handlePaymentReferenceChange = (value: string) => {
    setPaymentReference(value);
    setPaymentFieldErrors((current) => clearFieldError(current, "reference"));
  };

  const handlePaymentNotesChange = (value: string) => {
    setPaymentNotes(value);
    setPaymentFieldErrors((current) => clearFieldError(current, "notes"));
  };

  return {
    readingDate,
    coldWaterReading,
    hotWaterReading,
    electricityReading,
    tariffEffectiveFromDate,
    waterTariffPerUnit,
    waterStandingChargePerDay,
    waterVatPercent,
    electricityTariffPerUnit,
    electricityStandingChargePerDay,
    electricityVatPercent,
    boilerEffectiveFromDate,
    hotWaterTemperatureCelsius,
    hotWaterHeatCapacity,
    hotWaterDensity,
    kiloJouleToKiloWattHourFactor,
    boilerKwhPerCubicMeter,
    boilerEfficiencyPercent,
    readingsFieldErrors,
    tariffFieldErrors,
    boilerFieldErrors,
    paymentAmount,
    paymentDate,
    paymentMethod,
    paymentReference,
    paymentNotes,
    paymentFieldErrors,
    setPaymentAmount,
    setPaymentDate,
    setPaymentMethod,
    setPaymentReference,
    setPaymentNotes,
    setReadingsFieldErrors,
    setTariffFieldErrors,
    setBoilerFieldErrors,
    setPaymentFieldErrors,
    handleReadingDateChange,
    handleColdWaterReadingChange,
    handleHotWaterReadingChange,
    handleElectricityReadingChange,
    handleTariffEffectiveFromDateChange,
    handleWaterTariffPerUnitChange,
    handleWaterStandingChargePerDayChange,
    handleWaterVatPercentChange,
    handleElectricityTariffPerUnitChange,
    handleElectricityStandingChargePerDayChange,
    handleElectricityVatPercentChange,
    handleBoilerEffectiveFromDateChange,
    handleHotWaterTemperatureCelsiusChange,
    handleHotWaterHeatCapacityChange,
    handleHotWaterDensityChange,
    handleKiloJouleToKiloWattHourFactorChange,
    handleBoilerKwhPerCubicMeterChange,
    handleBoilerEfficiencyPercentChange,
    handlePaymentAmountChange,
    handlePaymentDateChange,
    handlePaymentMethodChange,
    handlePaymentReferenceChange,
    handlePaymentNotesChange,
  };
}
