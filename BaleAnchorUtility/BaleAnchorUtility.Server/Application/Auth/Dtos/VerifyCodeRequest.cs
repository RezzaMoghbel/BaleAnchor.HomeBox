using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Auth.Dtos;

public sealed class VerifyCodeRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(320)]
    public string Email { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^[0-9]{6}$", ErrorMessage = "Code must be 6 digits.")]
    public string Code { get; init; } = string.Empty;
}
