using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class AdminRoleChangeRequest
{
    [Required]
    [MaxLength(32)]
    public string Role { get; init; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string Reason { get; init; } = string.Empty;
}
