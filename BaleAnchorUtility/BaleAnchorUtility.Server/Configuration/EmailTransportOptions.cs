namespace BaleAnchorUtility.Server.Configuration;

public sealed class EmailTransportOptions
{
    public const string SectionName = "EmailTransport";

    public string Mode { get; set; } = "log";
    public string FromName { get; set; } = "BaleAnchor Utility";
    public string FromAddress { get; set; } = "no-reply@example.com";
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public bool SmtpUseSsl { get; set; } = true;
    public string SmtpUsername { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
}
