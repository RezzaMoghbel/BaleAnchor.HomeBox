namespace BaleAnchorUtility.Server.Domain.System;

public sealed class EmailTransportRuntimeSettingsDocument
{
    public const string DocumentId = "email-transport";

    public string Id { get; set; } = DocumentId;
    public string Mode { get; set; } = "log";
    public string FromName { get; set; } = "BaleAnchor Utility";
    public string FromAddress { get; set; } = "no-reply@example.com";
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public bool SmtpUseSsl { get; set; } = true;
    public string SmtpUsername { get; set; } = string.Empty;
    public string? SmtpPasswordCiphertext { get; set; }
    public string UpdatedByUserId { get; set; } = string.Empty;
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public int Version { get; set; }
}
