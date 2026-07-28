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
    public required string InputHash { get; init; }
    public required string EquationSummary { get; init; }
}
