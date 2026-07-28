using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Auth.Dtos;

public sealed class RequestCodeRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(320)]
    public string Email { get; init; } = string.Empty;
}
