using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Notifications.Dtos;

public sealed class UpsertPushSubscriptionRequest
{
    [Required]
    [StringLength(2000)]
    public string Endpoint { get; init; } = string.Empty;

    [Required]
    [StringLength(256)]
    public string P256dh { get; init; } = string.Empty;

    [Required]
    [StringLength(256)]
    public string Auth { get; init; } = string.Empty;

    [StringLength(500)]
    public string? ClientUserAgent { get; init; }
}
