namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class UpsertBoilerAssumptionVersionResponse
{
    public required string UserId { get; init; }
    public required string EffectiveFromDate { get; init; }
    public required string HotWaterTemperatureCelsius { get; init; }
    public required string HotWaterHeatCapacity { get; init; }
    public required string HotWaterDensity { get; init; }
    public required string KiloJouleToKiloWattHourFactor { get; init; }
    public required string BoilerKwhPerCubicMeter { get; init; }
    public required string BoilerEfficiencyPercent { get; init; }
    public required string Message { get; init; }
}
