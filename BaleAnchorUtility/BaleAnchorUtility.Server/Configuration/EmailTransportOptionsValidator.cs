using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Configuration;

public sealed class EmailTransportOptionsValidator : IValidateOptions<EmailTransportOptions>
{
    public ValidateOptionsResult Validate(string? name, EmailTransportOptions options)
    {
        var errors = new List<string>();

        var mode = (options.Mode ?? string.Empty).Trim().ToLowerInvariant();
        if (mode is not ("log" or "smtp"))
        {
            errors.Add("EmailTransport:Mode must be either 'log' or 'smtp'.");
        }

        if (string.IsNullOrWhiteSpace(options.FromName))
        {
            errors.Add("EmailTransport:FromName is required.");
        }

        if (!IsValidEmail(options.FromAddress))
        {
            errors.Add("EmailTransport:FromAddress must be a valid email address.");
        }

        if (mode == "smtp")
        {
            if (string.IsNullOrWhiteSpace(options.SmtpHost))
            {
                errors.Add("EmailTransport:SmtpHost is required when Mode is 'smtp'.");
            }

            if (options.SmtpPort is < 1 or > 65535)
            {
                errors.Add("EmailTransport:SmtpPort must be between 1 and 65535 when Mode is 'smtp'.");
            }

            if (string.IsNullOrWhiteSpace(options.SmtpUsername))
            {
                errors.Add("EmailTransport:SmtpUsername is required when Mode is 'smtp'.");
            }

            if (string.IsNullOrWhiteSpace(options.SmtpPassword))
            {
                errors.Add("EmailTransport:SmtpPassword is required in secure config. Set via environment variable EmailTransport__SmtpPassword.");
            }
        }

        return errors.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(errors);
    }

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
