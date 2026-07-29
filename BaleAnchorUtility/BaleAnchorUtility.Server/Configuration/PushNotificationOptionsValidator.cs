using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Configuration;

public sealed class PushNotificationOptionsValidator : IValidateOptions<PushNotificationOptions>
{
    public ValidateOptionsResult Validate(string? name, PushNotificationOptions options)
    {
        var errors = new List<string>();
        var mode = (options.Mode ?? string.Empty).Trim().ToLowerInvariant();

        if (mode is not ("log" or "webpush"))
        {
            errors.Add("PushNotifications:Mode must be either 'log' or 'webpush'.");
        }

        if (string.IsNullOrWhiteSpace(options.ReadingReminderDeepLinkPath)
            || !options.ReadingReminderDeepLinkPath.StartsWith("/", StringComparison.Ordinal))
        {
            errors.Add("PushNotifications:ReadingReminderDeepLinkPath must start with '/'.");
        }

        if (mode == "webpush")
        {
            if (string.IsNullOrWhiteSpace(options.VapidSubject))
            {
                errors.Add("PushNotifications:VapidSubject is required when Mode is 'webpush'.");
            }

            if (string.IsNullOrWhiteSpace(options.VapidPublicKey))
            {
                errors.Add("PushNotifications:VapidPublicKey is required when Mode is 'webpush'.");
            }

            if (string.IsNullOrWhiteSpace(options.VapidPrivateKey))
            {
                errors.Add("PushNotifications:VapidPrivateKey is required when Mode is 'webpush'.");
            }
        }

        return errors.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(errors);
    }
}
