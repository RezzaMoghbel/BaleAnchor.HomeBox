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
    public decimal WaterTotal { get; set; }
    public decimal ElectricityTotal { get; set; }
    public decimal PeriodTotal { get; set; }
    public bool ContainsEstimatedSegments { get; set; }
    public required string EngineVersion { get; set; }
    public required string InputHash { get; set; }
    public required string EquationSummary { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public int Version { get; set; }
}
