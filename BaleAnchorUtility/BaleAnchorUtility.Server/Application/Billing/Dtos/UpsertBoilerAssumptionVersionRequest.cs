using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class UpsertBoilerAssumptionVersionRequest
{
    [Required]
    [RegularExpression("^\\d{4}-\\d{2}-\\d{2}$")]
    public string EffectiveFromDate { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,6})?$")]
    public string HotWaterTemperatureCelsius { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,6})?$")]
    public string HotWaterHeatCapacity { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,6})?$")]
    public string HotWaterDensity { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,6})?$")]
    public string KiloJouleToKiloWattHourFactor { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,6})?$")]
    public string BoilerKwhPerCubicMeter { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,6})?$")]
    public string BoilerEfficiencyPercent { get; init; } = string.Empty;
}
