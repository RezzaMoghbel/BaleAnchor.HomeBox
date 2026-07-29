namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface ISecretProtector
{
    string Protect(string plaintext);
    bool TryUnprotect(string ciphertext, out string plaintext);
}
