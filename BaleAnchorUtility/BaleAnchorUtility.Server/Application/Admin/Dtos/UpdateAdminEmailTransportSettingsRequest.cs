namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class UpdateAdminEmailTransportSettingsRequest
{
    public string Mode { get; init; } = "log";
    public string FromName { get; init; } = string.Empty;
    public string FromAddress { get; init; } = string.Empty;
    public string SmtpHost { get; init; } = string.Empty;
    public int SmtpPort { get; init; } = 587;
    public bool SmtpUseSsl { get; init; } = true;
    public string SmtpUsername { get; init; } = string.Empty;
    public string? SmtpPassword { get; init; }
    public string Reason { get; init; } = string.Empty;
}
