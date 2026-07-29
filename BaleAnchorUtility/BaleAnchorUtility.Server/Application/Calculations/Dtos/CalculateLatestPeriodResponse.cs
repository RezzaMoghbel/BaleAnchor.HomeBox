namespace BaleAnchorUtility.Server.Application.Calculations.Dtos;

public sealed class CalculateLatestPeriodResponse
{
    public required string SnapshotId { get; init; }
    public required string UserId { get; init; }
    public required string PeriodStartDate { get; init; }
    public required string PeriodEndDateExclusive { get; init; }
    public int DaysInPeriod { get; init; }
    public required string ColdWaterUsed { get; init; }
    public required string HotWaterUsed { get; init; }
    public required string ApartmentElectricityUsed { get; init; }
    public required string BoilerElectricityUsed { get; init; }
    public required string ColdWaterTotal { get; init; }
    public required string HotWaterTotal { get; init; }
    public required string ApartmentElectricityTotal { get; init; }
    public required string BoilerElectricityTotal { get; init; }
    public required string WaterTotal { get; init; }
    public required string ElectricityTotal { get; init; }
    public required string PeriodTotal { get; init; }
    public bool ContainsEstimatedSegments { get; init; }
    public required string EngineVersion { get; init; }
    public required string RoundingPolicyVersion { get; init; }
    public required string InputHash { get; init; }
    public required string EquationSummary { get; init; }
    public string? EstimatedAllocationLabel { get; init; }
    public required BoilerAssumptionSummaryResponse BoilerAssumptions { get; init; }
    public required IReadOnlyList<CalculationTariffSegmentResponse> TariffSegments { get; init; }
    public required IReadOnlyList<CalculationComponentLineResponse> ComponentLines { get; init; }
    public bool IntegrityChecksPassed { get; init; }
    public required string IntegrityDigest { get; init; }
}

public sealed class BoilerAssumptionSummaryResponse
{
    public required string BoilerKwhPerCubicMeter { get; init; }
    public required string BoilerEfficiencyPercent { get; init; }
}

public sealed class CalculationTariffSegmentResponse
{
    public required string StartDate { get; init; }
    public required string EndDateExclusive { get; init; }
    public int Days { get; init; }
    public bool IsEstimatedAllocation { get; init; }
    public required string WaterTariffPerUnit { get; init; }
    public required string WaterStandingChargePerDay { get; init; }
    public required string WaterVatPercent { get; init; }
    public required string ElectricityTariffPerUnit { get; init; }
    public required string ElectricityStandingChargePerDay { get; init; }
    public required string ElectricityVatPercent { get; init; }
    public required string ColdWaterUsage { get; init; }
    public required string HotWaterUsage { get; init; }
    public required string ApartmentElectricityUsage { get; init; }
    public required string BoilerElectricityUsage { get; init; }
}

public sealed class CalculationComponentLineResponse
{
    public required string Component { get; init; }
    public required string Usage { get; init; }
    public required string UsageSubtotal { get; init; }
    public required string StandingSubtotal { get; init; }
    public required string VatAmount { get; init; }
    public required string Total { get; init; }
    public required string Equation { get; init; }
}
