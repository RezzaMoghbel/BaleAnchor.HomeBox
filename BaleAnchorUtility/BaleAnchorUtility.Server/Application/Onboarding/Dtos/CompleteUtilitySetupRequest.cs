using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Onboarding.Dtos;

public sealed class CompleteUtilitySetupRequest
{
    [Required]
    [RegularExpression("^\\d{4}-\\d{2}-\\d{2}$")]
    public string MoveInDate { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,3})?$")]
    public string OpeningColdWaterReading { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,3})?$")]
    public string OpeningHotWaterReading { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,3})?$")]
    public string OpeningElectricityReading { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,6})?$")]
    public string InitialWaterTariffPerUnit { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,6})?$")]
    public string InitialElectricityTariffPerUnit { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,6})?$")]
    public string BoilerKwhPerCubicMeter { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d+(\\.\\d{1,2})?$")]
    public string BoilerEfficiencyPercent { get; init; } = string.Empty;
}
