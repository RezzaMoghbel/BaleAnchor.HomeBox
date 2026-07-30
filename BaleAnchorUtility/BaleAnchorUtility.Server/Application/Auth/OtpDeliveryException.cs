namespace BaleAnchorUtility.Server.Application.Auth;

public sealed class OtpDeliveryException : Exception
{
    public OtpDeliveryException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}