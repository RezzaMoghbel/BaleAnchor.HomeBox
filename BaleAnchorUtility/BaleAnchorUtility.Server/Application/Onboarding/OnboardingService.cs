using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Onboarding.Dtos;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Onboarding;

public sealed class OnboardingService
{
    private readonly IUserRepository userRepository;
    private readonly IUtilitySetupRepository utilitySetupRepository;
    private readonly ISystemClock clock;
    private readonly ILogger<OnboardingService> logger;

    public OnboardingService(
        IUserRepository userRepository,
        IUtilitySetupRepository utilitySetupRepository,
        ISystemClock clock,
        ILogger<OnboardingService> logger)
    {
        this.userRepository = userRepository;
        this.utilitySetupRepository = utilitySetupRepository;
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

    public async Task<CompleteUtilitySetupResponse> CompleteUtilitySetupAsync(
        string userId,
        CompleteUtilitySetupRequest request,
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

        if (user.Status is UserAccountStatus.TermsPending
            or UserAccountStatus.EmailUnverified
            or UserAccountStatus.EmailVerified)
        {
            throw new InvalidOperationException("Accept terms and complete profile details before utility setup.");
        }

        if (!DateOnly.TryParseExact(request.MoveInDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var moveInDate))
        {
            throw new InvalidOperationException("Move-in date must use yyyy-MM-dd format.");
        }

        var coldWater = ParseDecimal(request.OpeningColdWaterReading, "Opening cold-water reading");
        var hotWater = ParseDecimal(request.OpeningHotWaterReading, "Opening hot-water reading");
        var electricity = ParseDecimal(request.OpeningElectricityReading, "Opening electricity reading");
        var waterTariff = ParseDecimal(request.InitialWaterTariffPerUnit, "Initial water tariff");
        var electricityTariff = ParseDecimal(request.InitialElectricityTariffPerUnit, "Initial electricity tariff");
        var boilerKwh = ParseDecimal(request.BoilerKwhPerCubicMeter, "Boiler conversion (kWh per cubic meter)");
        var boilerEfficiency = ParseDecimal(request.BoilerEfficiencyPercent, "Boiler efficiency percent");

        if (boilerEfficiency is <= 0m or > 100m)
        {
            throw new InvalidOperationException("Boiler efficiency percent must be greater than 0 and at most 100.");
        }

        var now = clock.UtcNow;
        var existing = await utilitySetupRepository.GetByUserIdAsync(userId, cancellationToken);
        var submission = existing ?? new Domain.Onboarding.UtilitySetupSubmission
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            MoveInDate = request.MoveInDate,
            Version = 0,
        };

        submission.MoveInDate = moveInDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        submission.OpeningColdWaterReading = coldWater;
        submission.OpeningHotWaterReading = hotWater;
        submission.OpeningElectricityReading = electricity;
        submission.InitialWaterTariffPerUnit = waterTariff;
        submission.InitialElectricityTariffPerUnit = electricityTariff;
        submission.BoilerKwhPerCubicMeter = boilerKwh;
        submission.BoilerEfficiencyPercent = boilerEfficiency;
        submission.CreatedAtUtc = existing?.CreatedAtUtc ?? now;
        submission.UpdatedAtUtc = now;
        submission.Version += 1;

        await utilitySetupRepository.UpsertAsync(submission, cancellationToken);

        user.Status = user.Status == UserAccountStatus.Active ? UserAccountStatus.Active : UserAccountStatus.PendingApproval;
        user.UpdatedAtUtc = now;
        user.Version += 1;
        await userRepository.UpsertAsync(user, cancellationToken);

        logger.LogInformation("Utility setup completed for user {UserId}.", userId);

        return new CompleteUtilitySetupResponse
        {
            UserId = user.Id,
            Status = user.Status.ToString(),
            Message = "Utility setup saved. Your account details are being checked.",
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

    private static decimal ParseDecimal(string rawValue, string fieldName)
    {
        if (!decimal.TryParse(rawValue, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
        {
            throw new InvalidOperationException($"{fieldName} is invalid.");
        }

        if (value < 0m)
        {
            throw new InvalidOperationException($"{fieldName} cannot be negative.");
        }

        return value;
    }
}
