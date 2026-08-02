using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class LinkPaymentRequest
{
    [Required]
    public string SnapshotId { get; init; } = string.Empty;
}
