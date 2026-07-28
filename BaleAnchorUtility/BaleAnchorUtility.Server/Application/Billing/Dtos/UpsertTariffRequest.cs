using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class UpsertTariffRequest
{
    [Required]
    [RegularExpression("^\\d{4}-\\d{2}-\\d{2}$")]
    public string EffectiveFromDate { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,6})?$")]
    public string WaterTariffPerUnit { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,6})?$")]
    public string ElectricityTariffPerUnit { get; init; } = string.Empty;
}
