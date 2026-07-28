using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class RecordLatestPeriodPaymentRequest
{
    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,2})?$")]
    public string Amount { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d{4}-\\d{2}-\\d{2}$")]
    public string PaymentDate { get; init; } = string.Empty;

    [Required]
    [StringLength(40, MinimumLength = 2)]
    public string Method { get; init; } = string.Empty;

    [StringLength(100)]
    public string? Reference { get; init; }

    [StringLength(300)]
    public string? Notes { get; init; }
}
