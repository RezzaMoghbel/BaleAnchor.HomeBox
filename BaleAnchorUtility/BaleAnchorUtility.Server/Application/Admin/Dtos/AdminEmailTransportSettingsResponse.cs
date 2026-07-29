namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class AdminEmailTransportSettingsResponse
{
    public string Mode { get; init; } = "log";
    public string FromName { get; init; } = string.Empty;
    public string FromAddress { get; init; } = string.Empty;
    public string SmtpHost { get; init; } = string.Empty;
    public int SmtpPort { get; init; }
    public bool SmtpUseSsl { get; init; }
    public string SmtpUsername { get; init; } = string.Empty;
    public bool HasSmtpPassword { get; init; }
    public string? UpdatedByUserId { get; init; }
    public string? UpdatedAtUtc { get; init; }
}
