using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class AdminDecisionRequest
{
    [Required]
    [MaxLength(300)]
    public string Reason { get; init; } = string.Empty;
}
