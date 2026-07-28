namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class ActiveTariffResponse
{
    public required string UserId { get; init; }
    public required string EffectiveFromDate { get; init; }
    public required string WaterTariffPerUnit { get; init; }
    public required string ElectricityTariffPerUnit { get; init; }
}
