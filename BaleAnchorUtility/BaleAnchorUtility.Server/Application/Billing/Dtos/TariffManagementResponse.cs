namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class TariffManagementItemResponse
{
    public required string EffectiveFromDate { get; init; }
    public required string WaterTariffPerUnit { get; init; }
    public required string WaterStandingChargePerDay { get; init; }
    public required string WaterVatPercent { get; init; }
    public required string ElectricityTariffPerUnit { get; init; }
    public required string ElectricityStandingChargePerDay { get; init; }
    public required string ElectricityVatPercent { get; init; }
    public required bool IsActive { get; init; }
    public required bool IsLinked { get; init; }
    public required bool CanEdit { get; init; }
    public required bool CanDelete { get; init; }
    public required int LinkedReadingsCount { get; init; }
}

public sealed class TariffManagementResponse
{
    public required string UserId { get; init; }
    public required string OnDate { get; init; }
    public required int Count { get; init; }
    public required IReadOnlyList<TariffManagementItemResponse> Items { get; init; }
}
