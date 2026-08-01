namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class BoilerAssumptionOptionItemResponse
{
    public required string EffectiveFromDate { get; init; }
    public required string HotWaterTemperatureCelsius { get; init; }
    public required string HotWaterHeatCapacity { get; init; }
    public required string HotWaterDensity { get; init; }
    public required string KiloJouleToKiloWattHourFactor { get; init; }
    public required string BoilerKwhPerCubicMeter { get; init; }
    public required string BoilerEfficiencyPercent { get; init; }
    public required bool IsLatestApplicable { get; init; }
}

public sealed class BoilerAssumptionOptionsResponse
{
    public required string UserId { get; init; }
    public required string OnDate { get; init; }
    public required string RecommendedEffectiveFromDate { get; init; }
    public required int Count { get; init; }
    public required IReadOnlyList<BoilerAssumptionOptionItemResponse> Items { get; init; }
}
