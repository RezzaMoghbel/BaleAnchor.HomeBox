using System.ComponentModel.DataAnnotations;

namespace BaleAnchorUtility.Server.Application.Onboarding.Dtos;

public sealed class CompleteProfileRequest
{
    [Required]
    [MinLength(2)]
    [MaxLength(80)]
    public string Surname { get; init; } = string.Empty;

    [Required]
    [RegularExpression("^\\d{4}-\\d{2}-\\d{2}$")]
    public string DateOfBirth { get; init; } = string.Empty;

    [Required]
    [MinLength(1)]
    [MaxLength(20)]
    public string FlatNumber { get; init; } = string.Empty;

    [Required]
    [MinLength(7)]
    [MaxLength(32)]
    public string MobileNumber { get; init; } = string.Empty;
}
