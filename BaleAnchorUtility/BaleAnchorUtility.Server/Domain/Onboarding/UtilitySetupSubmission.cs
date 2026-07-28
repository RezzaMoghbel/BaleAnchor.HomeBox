namespace BaleAnchorUtility.Server.Domain.Onboarding;

public sealed class UtilitySetupSubmission
{
    public required string Id { get; init; }
    public required string UserId { get; set; }
    public required string MoveInDate { get; set; }
    public decimal OpeningColdWaterReading { get; set; }
    public decimal OpeningHotWaterReading { get; set; }
    public decimal OpeningElectricityReading { get; set; }
    public decimal InitialWaterTariffPerUnit { get; set; }
    public decimal InitialElectricityTariffPerUnit { get; set; }
    public decimal BoilerKwhPerCubicMeter { get; set; }
    public decimal BoilerEfficiencyPercent { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
