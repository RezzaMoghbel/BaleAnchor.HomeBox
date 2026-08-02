namespace BaleAnchorUtility.Server.Domain.Billing;

public sealed class TariffVersion
{
    public required string Id { get; init; }
    public required string UserId { get; set; }
    public required string EffectiveFromDate { get; set; }
    public decimal WaterTariffPerUnit { get; set; }
    public decimal WaterStandingChargePerDay { get; set; }
    public decimal WaterVatPercent { get; set; }
    public decimal ElectricityTariffPerUnit { get; set; }
    public decimal ElectricityStandingChargePerDay { get; set; }
    public decimal ElectricityVatPercent { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public bool IsDeleted { get; set; }
    public int Version { get; set; }
}
