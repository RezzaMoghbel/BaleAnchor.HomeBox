using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Onboarding.Dtos;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Onboarding;

public sealed class OnboardingService
{
    private readonly IUserRepository userRepository;
    private readonly ISystemClock clock;
    private readonly ILogger<OnboardingService> logger;

    public OnboardingService(IUserRepository userRepository, ISystemClock clock, ILogger<OnboardingService> logger)
    {
        this.userRepository = userRepository;
        this.clock = clock;
        this.logger = logger;
    }

    public async Task<CompleteProfileResponse> CompleteProfileAsync(
        string userId,
        CompleteProfileRequest request,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User record was not found for this session.");

        if (user.Status is UserAccountStatus.Rejected
            or UserAccountStatus.Suspended
            or UserAccountStatus.MovedOut
            or UserAccountStatus.Archived)
        {
            throw new InvalidOperationException("This account is not eligible for onboarding updates.");
        }

        if (!DateOnly.TryParseExact(request.DateOfBirth, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dob))
        {
            throw new InvalidOperationException("Date of birth must use yyyy-MM-dd format.");
        }

        user.SurnameNormalized = NormalizeSurname(request.Surname);
        user.DateOfBirth = dob.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        user.FlatNumberNormalized = NormalizeFlatNumber(request.FlatNumber);
        user.MobileNumber = NormalizeMobileNumber(request.MobileNumber);
        user.Status = user.Status == UserAccountStatus.Active ? UserAccountStatus.Active : UserAccountStatus.UtilitySetupIncomplete;
        user.UpdatedAtUtc = clock.UtcNow;
        user.Version += 1;

        await userRepository.UpsertAsync(user, cancellationToken);

        logger.LogInformation("Onboarding profile completed for user {UserId}.", userId);

        return new CompleteProfileResponse
        {
            UserId = user.Id,
            Status = user.Status.ToString(),
            Message = "Profile details saved. Please continue with utility setup.",
        };
    }

    private static string NormalizeSurname(string surname)
    {
        var value = surname.Trim();
        if (value.Length < 2)
        {
            throw new InvalidOperationException("Surname must be at least 2 characters.");
        }

        return value.ToUpperInvariant();
    }

    private static string NormalizeFlatNumber(string flatNumber)
    {
        var value = flatNumber.Trim();
        if (value.Length == 0)
        {
            throw new InvalidOperationException("Flat number is required.");
        }

        return value.ToUpperInvariant();
    }

    private static string NormalizeMobileNumber(string mobile)
    {
        var value = mobile.Trim();
        if (value.Length < 7)
        {
            throw new InvalidOperationException("Mobile number appears invalid.");
        }

        return value;
    }
}
