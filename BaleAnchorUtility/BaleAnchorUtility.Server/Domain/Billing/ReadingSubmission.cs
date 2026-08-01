namespace BaleAnchorUtility.Server.Domain.Billing;

public sealed class ReadingSubmission
{
    public required string Id { get; init; }
    public required string UserId { get; set; }
    public required string ReadingDate { get; set; }
    public decimal ColdWaterReading { get; set; }
    public decimal HotWaterReading { get; set; }
    public decimal ElectricityReading { get; set; }
    public string? AppliedBoilerEffectiveFromDate { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
