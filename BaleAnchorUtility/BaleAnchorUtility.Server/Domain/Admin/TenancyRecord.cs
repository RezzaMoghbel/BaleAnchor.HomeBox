namespace BaleAnchorUtility.Server.Domain.Admin;

public sealed class TenancyRecord
{
    public required string Id { get; init; }
    public required string UserId { get; set; }
    public required string FlatNumberNormalized { get; set; }
    public required string MoveInDate { get; set; }
    public string? MoveOutDate { get; set; }
    public string Status { get; set; } = "Active";
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
