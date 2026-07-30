namespace BaleAnchorUtility.Server.Application.Onboarding.Dtos;

public sealed class OnboardingStateResponse
{
    public required string UserId { get; init; }

    public string Surname { get; init; } = string.Empty;
    public string DateOfBirth { get; init; } = string.Empty;
    public string FlatNumber { get; init; } = string.Empty;
    public string MobileNumber { get; init; } = string.Empty;

    public string MoveInDate { get; init; } = string.Empty;
    public string OpeningColdWaterReading { get; init; } = string.Empty;
    public string OpeningHotWaterReading { get; init; } = string.Empty;
    public string OpeningElectricityReading { get; init; } = string.Empty;

    public string InitialWaterTariffPerUnit { get; init; } = string.Empty;
    public string InitialWaterStandingChargePerDay { get; init; } = string.Empty;
    public string InitialWaterVatPercent { get; init; } = string.Empty;
    public string InitialElectricityTariffPerUnit { get; init; } = string.Empty;
    public string InitialElectricityStandingChargePerDay { get; init; } = string.Empty;
    public string InitialElectricityVatPercent { get; init; } = string.Empty;

    public string HotWaterTemperatureCelsius { get; init; } = string.Empty;
    public string HotWaterHeatCapacity { get; init; } = string.Empty;
    public string HotWaterDensity { get; init; } = string.Empty;
    public string KiloJouleToKiloWattHourFactor { get; init; } = string.Empty;

    public string BoilerKwhPerCubicMeter { get; init; } = string.Empty;
    public string BoilerEfficiencyPercent { get; init; } = string.Empty;
}