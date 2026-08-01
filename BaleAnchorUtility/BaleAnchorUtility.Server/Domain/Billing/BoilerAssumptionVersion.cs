namespace BaleAnchorUtility.Server.Domain.Billing;

public sealed class BoilerAssumptionVersion
{
    public required string Id { get; init; }
    public required string UserId { get; set; }
    public required string EffectiveFromDate { get; set; }
    public decimal HotWaterTemperatureCelsius { get; set; }
    public decimal HotWaterHeatCapacity { get; set; }
    public decimal HotWaterDensity { get; set; }
    public decimal KiloJouleToKiloWattHourFactor { get; set; }
    public decimal BoilerKwhPerCubicMeter { get; set; }
    public decimal BoilerEfficiencyPercent { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
