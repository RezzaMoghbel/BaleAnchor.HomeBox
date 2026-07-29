using BaleAnchorUtility.Server.Application.Abstractions;
using Microsoft.AspNetCore.DataProtection;

namespace BaleAnchorUtility.Server.Infrastructure.Security;

public sealed class DataProtectionSecretProtector : ISecretProtector
{
    private readonly IDataProtector protector;

    public DataProtectionSecretProtector(IDataProtectionProvider provider)
    {
        protector = provider.CreateProtector("BaleAnchorUtility.Server.SecretProtector.v1");
    }

    public string Protect(string plaintext)
    {
        return protector.Protect(plaintext);
    }

    public bool TryUnprotect(string ciphertext, out string plaintext)
    {
        try
        {
            plaintext = protector.Unprotect(ciphertext);
            return true;
        }
        catch
        {
            plaintext = string.Empty;
            return false;
        }
    }
}
