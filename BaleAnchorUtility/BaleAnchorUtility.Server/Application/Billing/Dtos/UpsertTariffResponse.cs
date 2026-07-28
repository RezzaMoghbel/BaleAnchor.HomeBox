namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class UpsertTariffResponse
{
    public required string UserId { get; init; }
    public required string EffectiveFromDate { get; init; }
    public required string WaterTariffPerUnit { get; init; }
    public required string ElectricityTariffPerUnit { get; init; }
    public required string Message { get; init; }
}
