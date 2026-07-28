namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class LatestReadingsResponse
{
    public required string UserId { get; init; }
    public required string ReadingDate { get; init; }
    public required string ColdWaterReading { get; init; }
    public required string HotWaterReading { get; init; }
    public required string ElectricityReading { get; init; }
}
