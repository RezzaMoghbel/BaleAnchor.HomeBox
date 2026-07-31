namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class TariffOptionItemResponse
{
    public required string EffectiveFromDate { get; init; }
    public required string WaterTariffPerUnit { get; init; }
    public required string WaterStandingChargePerDay { get; init; }
    public required string WaterVatPercent { get; init; }
    public required string ElectricityTariffPerUnit { get; init; }
    public required string ElectricityStandingChargePerDay { get; init; }
    public required string ElectricityVatPercent { get; init; }
    public required bool IsLatestApplicable { get; init; }
}

public sealed class TariffOptionsResponse
{
    public required string UserId { get; init; }
    public required string OnDate { get; init; }
    public required string RecommendedEffectiveFromDate { get; init; }
    public required int Count { get; init; }
    public required IReadOnlyList<TariffOptionItemResponse> Items { get; init; }
}