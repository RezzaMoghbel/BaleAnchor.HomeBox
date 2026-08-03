namespace BaleAnchorUtility.Server.Application.Calculations.Dtos;

public sealed class RecalculateStatementPeriodsResponse
{
    public required string UserId { get; init; }
    public int PeriodsProcessed { get; init; }
    public int SnapshotsCreated { get; init; }
    public required string LatestSnapshotId { get; init; }
    public required string LatestPeriodStartDate { get; init; }
    public required string LatestPeriodEndDateExclusive { get; init; }
    public required string Message { get; init; }
}
