namespace BaleAnchorUtility.Server.Domain.Audit;

public sealed class AuditLogEntry
{
    public required string Id { get; init; }
    public required string ActorUserId { get; set; }
    public required string TargetUserId { get; set; }
    public required string Category { get; set; }
    public required string Action { get; set; }
    public required string Reason { get; set; }
    public required string Metadata { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public int Version { get; set; }
}
