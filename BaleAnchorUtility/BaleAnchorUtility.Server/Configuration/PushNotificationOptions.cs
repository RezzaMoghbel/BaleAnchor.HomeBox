namespace BaleAnchorUtility.Server.Configuration;

public sealed class PushNotificationOptions
{
    public const string SectionName = "PushNotifications";

    public string Mode { get; set; } = "log";
    public string VapidSubject { get; set; } = string.Empty;
    public string VapidPublicKey { get; set; } = string.Empty;
    public string VapidPrivateKey { get; set; } = string.Empty;
    public string ReadingReminderDeepLinkPath { get; set; } = "/dashboard/readings";
}
