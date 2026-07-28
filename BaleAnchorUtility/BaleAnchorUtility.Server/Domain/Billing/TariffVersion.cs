namespace BaleAnchorUtility.Server.Domain.Billing;

public sealed class TariffVersion
{
    public required string Id { get; init; }
    public required string UserId { get; set; }
    public required string EffectiveFromDate { get; set; }
    public decimal WaterTariffPerUnit { get; set; }
    public decimal ElectricityTariffPerUnit { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
