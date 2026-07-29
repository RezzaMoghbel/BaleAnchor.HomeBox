namespace BaleAnchorUtility.Server.Domain.Admin;

public sealed class FlatRecord
{
    public required string Id { get; init; }
    public required string FlatNumberNormalized { get; set; }
    public string Label { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
