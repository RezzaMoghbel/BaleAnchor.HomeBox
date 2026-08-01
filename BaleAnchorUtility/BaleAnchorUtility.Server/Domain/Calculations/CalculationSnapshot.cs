namespace BaleAnchorUtility.Server.Domain.Calculations;

public sealed class CalculationSnapshot
{
    public required string Id { get; init; }
    public required string UserId { get; set; }
    public required string PeriodStartDate { get; set; }
    public required string PeriodEndDateExclusive { get; set; }
    public int DaysInPeriod { get; set; }
    public decimal ColdWaterUsed { get; set; }
    public decimal HotWaterUsed { get; set; }
    public decimal ApartmentElectricityUsed { get; set; }
    public decimal BoilerElectricityUsed { get; set; }
    public decimal ColdWaterTotal { get; set; }
    public decimal HotWaterTotal { get; set; }
    public decimal ApartmentElectricityTotal { get; set; }
    public decimal BoilerElectricityTotal { get; set; }
    public decimal WaterTotal { get; set; }
    public decimal ElectricityTotal { get; set; }
    public decimal PeriodTotal { get; set; }
    public bool ContainsEstimatedSegments { get; set; }
    public string? EstimatedAllocationLabel { get; set; }
    public required string EngineVersion { get; set; }
    public string RoundingPolicyVersion { get; set; } = "money-2dp-awayfromzero:v1";
    public required string InputHash { get; set; }
    public required string EquationSummary { get; set; }
    public decimal HotWaterTemperatureCelsiusUsed { get; set; }
    public decimal HotWaterHeatCapacityUsed { get; set; }
    public decimal HotWaterDensityUsed { get; set; }
    public decimal KiloJouleToKiloWattHourFactorUsed { get; set; }
    public decimal BoilerKwhPerCubicMeterUsed { get; set; }
    public decimal BoilerEfficiencyPercentUsed { get; set; }
    public List<CalculationTariffSegmentTrace> TariffSegments { get; set; } = [];
    public List<CalculationComponentLineTrace> ComponentLines { get; set; } = [];
    public bool IntegrityChecksPassed { get; set; }
    public string IntegrityDigest { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public int Version { get; set; }
}

public sealed class CalculationTariffSegmentTrace
{
    public required string StartDate { get; set; }
    public required string EndDateExclusive { get; set; }
    public int Days { get; set; }
    public bool IsEstimatedAllocation { get; set; }
    public decimal WaterTariffPerUnit { get; set; }
    public decimal WaterStandingChargePerDay { get; set; }
    public decimal WaterVatPercent { get; set; }
    public decimal ElectricityTariffPerUnit { get; set; }
    public decimal ElectricityStandingChargePerDay { get; set; }
    public decimal ElectricityVatPercent { get; set; }
    public decimal ColdWaterUsage { get; set; }
    public decimal HotWaterUsage { get; set; }
    public decimal ApartmentElectricityUsage { get; set; }
    public decimal BoilerElectricityUsage { get; set; }
}

public sealed class CalculationComponentLineTrace
{
    public required string Component { get; set; }
    public decimal Usage { get; set; }
    public decimal UsageSubtotal { get; set; }
    public decimal StandingSubtotal { get; set; }
    public decimal VatAmount { get; set; }
    public decimal Total { get; set; }
    public string Equation { get; set; } = string.Empty;
}
