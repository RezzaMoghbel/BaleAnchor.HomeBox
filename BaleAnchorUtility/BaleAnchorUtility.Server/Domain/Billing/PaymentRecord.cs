namespace BaleAnchorUtility.Server.Domain.Billing;

public sealed class PaymentRecord
{
    public required string Id { get; init; }
    public required string UserId { get; set; }
    public string? PeriodStartDate { get; set; }
    public string? PeriodEndDateExclusive { get; set; }
    public string? LinkedSnapshotId { get; set; }
    public decimal Amount { get; set; }
    public required string PaymentDate { get; set; }
    public required string Method { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public required string Source { get; set; }
    public required string VerificationStatus { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
