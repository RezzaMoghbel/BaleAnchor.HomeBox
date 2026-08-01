namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class SubmitReadingsResponse
{
    public required string UserId { get; init; }
    public required string ReadingDate { get; init; }
    public string? AppliedTariffEffectiveFromDate { get; init; }
    public string? AppliedBoilerEffectiveFromDate { get; init; }
    public required string Message { get; init; }
}
