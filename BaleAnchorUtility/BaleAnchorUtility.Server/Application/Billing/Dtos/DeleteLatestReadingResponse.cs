namespace BaleAnchorUtility.Server.Application.Billing.Dtos;

public sealed class DeleteLatestReadingResponse
{
    public string UserId { get; init; } = string.Empty;
    public string DeletedReadingId { get; init; } = string.Empty;
    public string DeletedReadingDate { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}
