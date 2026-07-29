namespace BaleAnchorUtility.Server.Domain.Admin;

public sealed class TenantGapAllocation
{
    public required string Id { get; init; }
    public required string FlatNumberNormalized { get; set; }
    public required string FromDate { get; set; }
    public required string ToDateExclusive { get; set; }
    public required string AssignedUserId { get; set; }
    public decimal Amount { get; set; }
    public required string Reason { get; set; }
    public string Status { get; set; } = "Open";
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
