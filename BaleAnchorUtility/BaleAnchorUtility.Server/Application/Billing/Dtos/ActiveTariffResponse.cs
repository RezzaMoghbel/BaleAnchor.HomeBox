namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class ActiveTariffResponse
{
    public required string UserId { get; init; }
    public required string EffectiveFromDate { get; init; }
    public required string WaterTariffPerUnit { get; init; }
    public required string WaterStandingChargePerDay { get; init; }
    public required string WaterVatPercent { get; init; }
    public required string ElectricityTariffPerUnit { get; init; }
    public required string ElectricityStandingChargePerDay { get; init; }
    public required string ElectricityVatPercent { get; init; }
}
