using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class SubmitReadingsRequest
{
    [Required]
    [RegularExpression("^\\d{4}-\\d{2}-\\d{2}$")]
    public string ReadingDate { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,3})?$")]
    public string ColdWaterReading { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,3})?$")]
    public string HotWaterReading { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,3})?$")]
    public string ElectricityReading { get; init; } = string.Empty;
}
