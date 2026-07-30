using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Onboarding.Dtos;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Onboarding;

public sealed class OnboardingService
{
    private readonly IUserRepository userRepository;
    private readonly IUtilitySetupRepository utilitySetupRepository;
    private readonly ITermsAcceptanceRepository termsAcceptanceRepository;
    private readonly ITermsVersionRepository termsVersionRepository;
    private readonly ISystemClock clock;
    private readonly ILogger<OnboardingService> logger;

    public OnboardingService(
        IUserRepository userRepository,
        IUtilitySetupRepository utilitySetupRepository,
        ITermsAcceptanceRepository termsAcceptanceRepository,
        ITermsVersionRepository termsVersionRepository,
        ISystemClock clock,
        ILogger<OnboardingService> logger)
    {
        this.userRepository = userRepository;
        this.utilitySetupRepository = utilitySetupRepository;
        this.termsAcceptanceRepository = termsAcceptanceRepository;
        this.termsVersionRepository = termsVersionRepository;
        this.clock = clock;
        this.logger = logger;
    }

    public async Task<OnboardingProgressResponse> GetProgressAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User record was not found for this session.");

        var profileComplete = !string.IsNullOrWhiteSpace(user.SurnameNormalized)
            && !string.IsNullOrWhiteSpace(user.DateOfBirth)
            && !string.IsNullOrWhiteSpace(user.FlatNumberNormalized)
            && !string.IsNullOrWhiteSpace(user.MobileNumber);

        var utilitySetup = await utilitySetupRepository.GetByUserIdAsync(userId, cancellationToken);
        var utilitySetupComplete = utilitySetup is not null;

        var activeTerms = await termsVersionRepository.GetActiveAsync(cancellationToken);
        var termsAccepted = activeTerms is null
            || await termsAcceptanceRepository.GetByUserAndVersionAsync(userId, activeTerms.Id, cancellationToken) is not null;

        return new OnboardingProgressResponse
        {
            UserId = user.Id,
            AccountStatus = user.Status.ToString(),
            TermsAccepted = termsAccepted,
            ProfileComplete = profileComplete,
            UtilitySetupComplete = utilitySetupComplete,
            NextStep = ResolveNextStep(termsAccepted, profileComplete, utilitySetupComplete),
        };
    }

    public async Task<OnboardingStateResponse> GetStateAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User record was not found for this session.");

        var utilitySetup = await utilitySetupRepository.GetByUserIdAsync(userId, cancellationToken);

        return new OnboardingStateResponse
        {
            UserId = user.Id,
            Surname = user.SurnameNormalized ?? string.Empty,
            DateOfBirth = user.DateOfBirth ?? string.Empty,
            FlatNumber = user.FlatNumberNormalized ?? string.Empty,
            MobileNumber = user.MobileNumber ?? string.Empty,

            MoveInDate = utilitySetup?.MoveInDate ?? string.Empty,
            OpeningColdWaterReading = utilitySetup?.OpeningColdWaterReading.ToString("0.###", CultureInfo.InvariantCulture) ?? string.Empty,
            OpeningHotWaterReading = utilitySetup?.OpeningHotWaterReading.ToString("0.###", CultureInfo.InvariantCulture) ?? string.Empty,
            OpeningElectricityReading = utilitySetup?.OpeningElectricityReading.ToString("0.###", CultureInfo.InvariantCulture) ?? string.Empty,

            InitialWaterTariffPerUnit = utilitySetup?.InitialWaterTariffPerUnit.ToString("0.######", CultureInfo.InvariantCulture) ?? string.Empty,
            InitialWaterStandingChargePerDay = utilitySetup?.InitialWaterStandingChargePerDay.ToString("0.######", CultureInfo.InvariantCulture) ?? string.Empty,
            InitialWaterVatPercent = utilitySetup?.InitialWaterVatPercent.ToString("0.##", CultureInfo.InvariantCulture) ?? string.Empty,
            InitialElectricityTariffPerUnit = utilitySetup?.InitialElectricityTariffPerUnit.ToString("0.######", CultureInfo.InvariantCulture) ?? string.Empty,
            InitialElectricityStandingChargePerDay = utilitySetup?.InitialElectricityStandingChargePerDay.ToString("0.######", CultureInfo.InvariantCulture) ?? string.Empty,
            InitialElectricityVatPercent = utilitySetup?.InitialElectricityVatPercent.ToString("0.##", CultureInfo.InvariantCulture) ?? string.Empty,

            HotWaterTemperatureCelsius = utilitySetup?.HotWaterTemperatureCelsius.ToString("0.##", CultureInfo.InvariantCulture) ?? string.Empty,
            HotWaterHeatCapacity = utilitySetup?.HotWaterHeatCapacity.ToString("0.######", CultureInfo.InvariantCulture) ?? string.Empty,
            HotWaterDensity = utilitySetup?.HotWaterDensity.ToString("0.###", CultureInfo.InvariantCulture) ?? string.Empty,
            KiloJouleToKiloWattHourFactor = utilitySetup?.KiloJouleToKiloWattHourFactor.ToString("0.######", CultureInfo.InvariantCulture) ?? string.Empty,

            BoilerKwhPerCubicMeter = utilitySetup?.BoilerKwhPerCubicMeter.ToString("0.######", CultureInfo.InvariantCulture) ?? string.Empty,
            BoilerEfficiencyPercent = utilitySetup?.BoilerEfficiencyPercent.ToString("0.##", CultureInfo.InvariantCulture) ?? string.Empty,
        };
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
        var waterStanding = ParseDecimal(request.InitialWaterStandingChargePerDay, "Water standing charge");
        var waterVatPercent = ParseDecimal(request.InitialWaterVatPercent, "Water VAT percent");
        var electricityTariff = ParseDecimal(request.InitialElectricityTariffPerUnit, "Initial electricity tariff");
        var electricityStanding = ParseDecimal(request.InitialElectricityStandingChargePerDay, "Electricity standing charge");
        var electricityVatPercent = ParseDecimal(request.InitialElectricityVatPercent, "Electricity VAT percent");
        var hotWaterTemperature = ParseDecimal(request.HotWaterTemperatureCelsius, "Hot-water temperature");
        var hotWaterHeatCapacity = ParseDecimal(request.HotWaterHeatCapacity, "Hot-water heat capacity");
        var hotWaterDensity = ParseDecimal(request.HotWaterDensity, "Hot-water density");
        var conversionFactor = ParseDecimal(request.KiloJouleToKiloWattHourFactor, "Hot-water conversion factor");
        var boilerKwh = ParseDecimal(request.BoilerKwhPerCubicMeter, "Boiler conversion (kWh per cubic meter)");
        var boilerEfficiency = ParseDecimal(request.BoilerEfficiencyPercent, "Boiler efficiency percent");

        if (waterVatPercent > 100m || electricityVatPercent > 100m)
        {
            throw new InvalidOperationException("VAT percent values must be at most 100.");
        }

        if (hotWaterTemperature <= 0m)
        {
            throw new InvalidOperationException("Hot-water temperature must be greater than 0.");
        }

        if (hotWaterHeatCapacity <= 0m)
        {
            throw new InvalidOperationException("Hot-water heat capacity must be greater than 0.");
        }

        if (hotWaterDensity <= 0m)
        {
            throw new InvalidOperationException("Hot-water density must be greater than 0.");
        }

        if (conversionFactor <= 0m)
        {
            throw new InvalidOperationException("Hot-water conversion factor must be greater than 0.");
        }

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
        submission.InitialWaterStandingChargePerDay = waterStanding;
        submission.InitialWaterVatPercent = waterVatPercent;
        submission.InitialElectricityTariffPerUnit = electricityTariff;
        submission.InitialElectricityStandingChargePerDay = electricityStanding;
        submission.InitialElectricityVatPercent = electricityVatPercent;
        submission.HotWaterTemperatureCelsius = hotWaterTemperature;
        submission.HotWaterHeatCapacity = hotWaterHeatCapacity;
        submission.HotWaterDensity = hotWaterDensity;
        submission.KiloJouleToKiloWattHourFactor = conversionFactor;
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

    private static string ResolveNextStep(bool termsAccepted, bool profileComplete, bool utilitySetupComplete)
    {
        if (!termsAccepted)
        {
            return "AcceptTerms";
        }

        if (!profileComplete)
        {
            return "CompleteProfile";
        }

        if (!utilitySetupComplete)
        {
            return "CompleteUtilitySetup";
        }

        return "AwaitApproval";
    }
}
