namespace BaleAnchorUtility.Server.Application.Abstractions;

public sealed class EmailTransportRuntimeSettings
{
    public string Mode { get; init; } = "log";
    public string FromName { get; init; } = "BaleAnchor Utility";
    public string FromAddress { get; init; } = "no-reply@example.com";
    public string SmtpHost { get; init; } = string.Empty;
    public int SmtpPort { get; init; } = 587;
    public bool SmtpUseSsl { get; init; } = true;
    public string SmtpUsername { get; init; } = string.Empty;
    public string SmtpPassword { get; init; } = string.Empty;
}
