using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Billing.Dtos;
using BaleAnchorUtility.Server.Application.Notifications;
using BaleAnchorUtility.Server.Domain.Billing;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Billing;

public sealed class BillingInputService
{
    private const string MaxIsoDate = "9999-12-31";

    private readonly IUserRepository userRepository;
    private readonly IReadingSubmissionRepository readingSubmissionRepository;
    private readonly IUtilitySetupRepository utilitySetupRepository;
    private readonly ITariffVersionRepository tariffVersionRepository;
    private readonly IPaymentRepository paymentRepository;
    private readonly ReminderDispatchService reminderDispatchService;
    private readonly ISystemClock clock;
    private readonly ILogger<BillingInputService> logger;

    public BillingInputService(
        IUserRepository userRepository,
        IReadingSubmissionRepository readingSubmissionRepository,
        IUtilitySetupRepository utilitySetupRepository,
        ITariffVersionRepository tariffVersionRepository,
        IPaymentRepository paymentRepository,
        ReminderDispatchService reminderDispatchService,
        ISystemClock clock,
        ILogger<BillingInputService> logger)
    {
        this.userRepository = userRepository;
        this.readingSubmissionRepository = readingSubmissionRepository;
        this.utilitySetupRepository = utilitySetupRepository;
        this.tariffVersionRepository = tariffVersionRepository;
        this.paymentRepository = paymentRepository;
        this.reminderDispatchService = reminderDispatchService;
        this.clock = clock;
        this.logger = logger;
    }

    public async Task<SubmitReadingsResponse> SubmitReadingsAsync(
        string userId,
        SubmitReadingsRequest request,
        CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);
        var readingDate = ParseIsoDate(request.ReadingDate, "Reading date must use yyyy-MM-dd format.");
        var readingDateIso = readingDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        var coldWater = ParseDecimal(request.ColdWaterReading, "Cold-water reading is invalid.");
        var hotWater = ParseDecimal(request.HotWaterReading, "Hot-water reading is invalid.");
        var electricity = ParseDecimal(request.ElectricityReading, "Electricity reading is invalid.");

        DateOnly? requestedTariffEffectiveFromDate = null;
        if (!string.IsNullOrWhiteSpace(request.TariffEffectiveFromDate))
        {
            requestedTariffEffectiveFromDate = ParseIsoDate(
                request.TariffEffectiveFromDate,
                "Tariff effective-from date must use yyyy-MM-dd format.");
        }

        if (readingDate > DateOnly.FromDateTime(clock.UtcNow.UtcDateTime))
        {
            throw new InvalidOperationException("Reading date cannot be in the future.");
        }

        var latest = await readingSubmissionRepository.GetLatestByUserIdAsync(user.Id, cancellationToken);
        if (latest is not null)
        {
            var latestDate = ParseIsoDate(latest.ReadingDate, "Latest reading date is invalid in storage.");
            if (readingDate <= latestDate)
            {
                throw new InvalidOperationException("Reading date must be after the latest submitted reading date.");
            }

            if (coldWater < latest.ColdWaterReading || hotWater < latest.HotWaterReading || electricity < latest.ElectricityReading)
            {
                throw new InvalidOperationException("Readings cannot roll back below the latest submitted values.");
            }
        }

        var availableTariffs = await GetAvailableTariffsOrSeedFromUtilitySetupAsync(
            user.Id,
            readingDateIso,
            cancellationToken);

        if (availableTariffs.Count == 0)
        {
            throw new InvalidOperationException(
                "No tariff was found for the reading date. Add a tariff version before submitting readings.");
        }

        var orderedTariffs = availableTariffs
            .OrderByDescending(x => ParseIsoDate(x.EffectiveFromDate, "Stored tariff effective-from date is invalid."))
            .ThenByDescending(x => x.UpdatedAtUtc)
            .ToList();

        var latestApplicableTariff = orderedTariffs[0];
        if (requestedTariffEffectiveFromDate is not null)
        {
            var requestedIso = requestedTariffEffectiveFromDate.Value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            var selectedTariff = orderedTariffs.FirstOrDefault(x =>
                string.Equals(x.EffectiveFromDate, requestedIso, StringComparison.Ordinal));

            if (selectedTariff is null)
            {
                throw new InvalidOperationException(
                    "Selected tariff is not available for the requested reading date.");
            }

            if (!string.Equals(
                    selectedTariff.EffectiveFromDate,
                    latestApplicableTariff.EffectiveFromDate,
                    StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    $"Select tariff dated {latestApplicableTariff.EffectiveFromDate} because it is the latest available for this reading date.");
            }
        }

        var now = clock.UtcNow;
        var submission = new ReadingSubmission
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = user.Id,
            ReadingDate = readingDateIso,
            ColdWaterReading = coldWater,
            HotWaterReading = hotWater,
            ElectricityReading = electricity,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        };

        await readingSubmissionRepository.AddAsync(submission, cancellationToken);
        await reminderDispatchService.ScheduleForNextRecommendedDateAsync(user.Id, readingDate, cancellationToken);

        logger.LogInformation("Readings submitted for user {UserId} on {ReadingDate}.", user.Id, submission.ReadingDate);

        return new SubmitReadingsResponse
        {
            UserId = user.Id,
            ReadingDate = submission.ReadingDate,
            AppliedTariffEffectiveFromDate = latestApplicableTariff.EffectiveFromDate,
            Message = "Readings submitted successfully.",
        };
    }

    public async Task<SubmitReadingsResponse> UpdateLatestReadingsAsync(
        string userId,
        SubmitReadingsRequest request,
        CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);
        var readingDate = ParseIsoDate(request.ReadingDate, "Reading date must use yyyy-MM-dd format.");

        var coldWater = ParseDecimal(request.ColdWaterReading, "Cold-water reading is invalid.");
        var hotWater = ParseDecimal(request.HotWaterReading, "Hot-water reading is invalid.");
        var electricity = ParseDecimal(request.ElectricityReading, "Electricity reading is invalid.");

        if (readingDate > DateOnly.FromDateTime(clock.UtcNow.UtcDateTime))
        {
            throw new InvalidOperationException("Reading date cannot be in the future.");
        }

        var readings = (await readingSubmissionRepository.GetByUserIdAsync(user.Id, cancellationToken))
            .OrderBy(x => x.ReadingDate, StringComparer.Ordinal)
            .ThenBy(x => x.UpdatedAtUtc)
            .ToList();

        if (readings.Count == 0)
        {
            throw new InvalidOperationException("No readings have been submitted yet.");
        }

        var latest = readings[^1];
        if (readings.Count >= 2)
        {
            var previous = readings[^2];
            var previousDate = ParseIsoDate(previous.ReadingDate, "Stored previous reading date is invalid.");

            if (readingDate <= previousDate)
            {
                throw new InvalidOperationException("Reading date must be after the previous submitted reading date.");
            }

            if (coldWater < previous.ColdWaterReading || hotWater < previous.HotWaterReading || electricity < previous.ElectricityReading)
            {
                throw new InvalidOperationException("Readings cannot roll back below the previous submitted values.");
            }

            var payment = await paymentRepository.GetByUserAndPeriodAsync(
                user.Id,
                previous.ReadingDate,
                latest.ReadingDate,
                cancellationToken);

            if (payment is not null)
            {
                throw new InvalidOperationException("The latest reading closes a paid period. Delete the linked payment first.");
            }
        }

        latest.ReadingDate = readingDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        latest.ColdWaterReading = coldWater;
        latest.HotWaterReading = hotWater;
        latest.ElectricityReading = electricity;
        latest.UpdatedAtUtc = clock.UtcNow;
        latest.Version += 1;

        await readingSubmissionRepository.UpsertAsync(latest, cancellationToken);

        logger.LogInformation(
            "Latest readings updated for user {UserId} on {ReadingDate}.",
            user.Id,
            latest.ReadingDate);

        return new SubmitReadingsResponse
        {
            UserId = user.Id,
            ReadingDate = latest.ReadingDate,
            Message = "Latest readings updated successfully.",
        };
    }

    public async Task<TariffOptionsResponse> GetTariffOptionsAsync(string userId, string? onDate, CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);
        var lookupDate = string.IsNullOrWhiteSpace(onDate)
            ? DateOnly.FromDateTime(clock.UtcNow.UtcDateTime)
            : ParseIsoDate(onDate, "onDate must use yyyy-MM-dd format.");
        var lookupDateIso = lookupDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        var availableTariffs = await GetAvailableTariffsOrSeedFromUtilitySetupAsync(user.Id, lookupDateIso, cancellationToken);
        if (availableTariffs.Count == 0)
        {
            throw new InvalidOperationException("No tariff was found for the requested date.");
        }

        var ordered = availableTariffs
            .OrderByDescending(x => ParseIsoDate(x.EffectiveFromDate, "Stored tariff effective-from date is invalid."))
            .ThenByDescending(x => x.UpdatedAtUtc)
            .ToList();
        var latestEffectiveFromDate = ordered[0].EffectiveFromDate;

        return new TariffOptionsResponse
        {
            UserId = user.Id,
            OnDate = lookupDateIso,
            RecommendedEffectiveFromDate = latestEffectiveFromDate,
            Count = ordered.Count,
            Items = ordered
                .Select(x => new TariffOptionItemResponse
                {
                    EffectiveFromDate = x.EffectiveFromDate,
                    WaterTariffPerUnit = x.WaterTariffPerUnit.ToString("0.######", CultureInfo.InvariantCulture),
                    WaterStandingChargePerDay = x.WaterStandingChargePerDay.ToString("0.######", CultureInfo.InvariantCulture),
                    WaterVatPercent = x.WaterVatPercent.ToString("0.######", CultureInfo.InvariantCulture),
                    ElectricityTariffPerUnit = x.ElectricityTariffPerUnit.ToString("0.######", CultureInfo.InvariantCulture),
                    ElectricityStandingChargePerDay = x.ElectricityStandingChargePerDay.ToString("0.######", CultureInfo.InvariantCulture),
                    ElectricityVatPercent = x.ElectricityVatPercent.ToString("0.######", CultureInfo.InvariantCulture),
                    IsLatestApplicable = string.Equals(x.EffectiveFromDate, latestEffectiveFromDate, StringComparison.Ordinal),
                })
                .ToList(),
        };
    }

    public async Task<LatestReadingsResponse> GetLatestReadingsAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);
        var latest = await readingSubmissionRepository.GetLatestByUserIdAsync(user.Id, cancellationToken)
            ?? throw new InvalidOperationException("No readings have been submitted yet.");

        return new LatestReadingsResponse
        {
            UserId = user.Id,
            ReadingDate = latest.ReadingDate,
            ColdWaterReading = latest.ColdWaterReading.ToString("0.###", CultureInfo.InvariantCulture),
            HotWaterReading = latest.HotWaterReading.ToString("0.###", CultureInfo.InvariantCulture),
            ElectricityReading = latest.ElectricityReading.ToString("0.###", CultureInfo.InvariantCulture),
        };
    }

    public async Task<UpsertTariffResponse> UpsertTariffAsync(
        string userId,
        UpsertTariffRequest request,
        CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);
        var effectiveFromDate = ParseIsoDate(request.EffectiveFromDate, "Effective-from date must use yyyy-MM-dd format.");

        var waterTariff = ParseDecimal(request.WaterTariffPerUnit, "Water tariff is invalid.");
        var waterStandingCharge = ParseDecimal(request.WaterStandingChargePerDay, "Water standing charge is invalid.");
        var waterVatPercent = ParseDecimal(request.WaterVatPercent, "Water VAT percent is invalid.");
        var electricityTariff = ParseDecimal(request.ElectricityTariffPerUnit, "Electricity tariff is invalid.");
        var electricityStandingCharge = ParseDecimal(request.ElectricityStandingChargePerDay, "Electricity standing charge is invalid.");
        var electricityVatPercent = ParseDecimal(request.ElectricityVatPercent, "Electricity VAT percent is invalid.");

        if (waterTariff <= 0m || electricityTariff <= 0m)
        {
            throw new InvalidOperationException("Water and electricity tariffs must be greater than zero.");
        }

        if (waterVatPercent > 100m || electricityVatPercent > 100m)
        {
            throw new InvalidOperationException("VAT percent cannot exceed 100.");
        }

        var effectiveFrom = effectiveFromDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var existing = await tariffVersionRepository.GetByUserAndEffectiveFromDateAsync(user.Id, effectiveFrom, cancellationToken);
        if (existing is not null)
        {
            throw new InvalidOperationException("A tariff entry already exists for this effective-from date.");
        }

        var now = clock.UtcNow;
        var version = new TariffVersion
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = user.Id,
            EffectiveFromDate = effectiveFrom,
            WaterTariffPerUnit = waterTariff,
            WaterStandingChargePerDay = waterStandingCharge,
            WaterVatPercent = waterVatPercent,
            ElectricityTariffPerUnit = electricityTariff,
            ElectricityStandingChargePerDay = electricityStandingCharge,
            ElectricityVatPercent = electricityVatPercent,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        };

        await tariffVersionRepository.AddAsync(version, cancellationToken);

        logger.LogInformation("Tariff version submitted for user {UserId} effective from {EffectiveFromDate}.", user.Id, effectiveFrom);

        return new UpsertTariffResponse
        {
            UserId = user.Id,
            EffectiveFromDate = version.EffectiveFromDate,
            WaterTariffPerUnit = version.WaterTariffPerUnit.ToString("0.######", CultureInfo.InvariantCulture),
            WaterStandingChargePerDay = version.WaterStandingChargePerDay.ToString("0.######", CultureInfo.InvariantCulture),
            WaterVatPercent = version.WaterVatPercent.ToString("0.######", CultureInfo.InvariantCulture),
            ElectricityTariffPerUnit = version.ElectricityTariffPerUnit.ToString("0.######", CultureInfo.InvariantCulture),
            ElectricityStandingChargePerDay = version.ElectricityStandingChargePerDay.ToString("0.######", CultureInfo.InvariantCulture),
            ElectricityVatPercent = version.ElectricityVatPercent.ToString("0.######", CultureInfo.InvariantCulture),
            Message = "Tariff version saved.",
        };
    }

    public async Task<ActiveTariffResponse> GetActiveTariffAsync(string userId, string? onDate, CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);
        var lookupDate = string.IsNullOrWhiteSpace(onDate)
            ? DateOnly.FromDateTime(clock.UtcNow.UtcDateTime).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
            : ParseIsoDate(onDate, "onDate must use yyyy-MM-dd format.").ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        var active = await tariffVersionRepository.GetActiveByUserAndDateAsync(user.Id, lookupDate, cancellationToken)
            ?? throw new InvalidOperationException("No active tariff was found for the requested date.");

        return new ActiveTariffResponse
        {
            UserId = user.Id,
            EffectiveFromDate = active.EffectiveFromDate,
            WaterTariffPerUnit = active.WaterTariffPerUnit.ToString("0.######", CultureInfo.InvariantCulture),
            WaterStandingChargePerDay = active.WaterStandingChargePerDay.ToString("0.######", CultureInfo.InvariantCulture),
            WaterVatPercent = active.WaterVatPercent.ToString("0.######", CultureInfo.InvariantCulture),
            ElectricityTariffPerUnit = active.ElectricityTariffPerUnit.ToString("0.######", CultureInfo.InvariantCulture),
            ElectricityStandingChargePerDay = active.ElectricityStandingChargePerDay.ToString("0.######", CultureInfo.InvariantCulture),
            ElectricityVatPercent = active.ElectricityVatPercent.ToString("0.######", CultureInfo.InvariantCulture),
        };
    }

    public async Task<DeleteLatestReadingResponse> DeleteLatestReadingAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await GetEligibleUserAsync(userId, cancellationToken);
        var readings = await readingSubmissionRepository.GetByUserIdAsync(user.Id, cancellationToken);
        if (readings.Count == 0)
        {
            throw new InvalidOperationException("No readings exist to delete.");
        }

        var latest = readings[^1];

        if (readings.Count >= 2)
        {
            var previous = readings[^2];
            var payment = await paymentRepository.GetByUserAndPeriodAsync(
                user.Id,
                previous.ReadingDate,
                latest.ReadingDate,
                cancellationToken);

            if (payment is not null)
            {
                throw new InvalidOperationException("The latest reading closes a paid period. Delete the linked payment first.");
            }
        }

        await readingSubmissionRepository.DeleteAsync(latest.Id, cancellationToken);

        logger.LogInformation(
            "Latest reading {ReadingId} dated {ReadingDate} deleted for user {UserId}.",
            latest.Id,
            latest.ReadingDate,
            user.Id);

        return new DeleteLatestReadingResponse
        {
            UserId = user.Id,
            DeletedReadingId = latest.Id,
            DeletedReadingDate = latest.ReadingDate,
            Message = "The latest reading was deleted successfully.",
        };
    }

    private async Task<IReadOnlyList<TariffVersion>> GetAvailableTariffsOrSeedFromUtilitySetupAsync(
        string userId,
        string onDate,
        CancellationToken cancellationToken)
    {
        var availableTariffs = await tariffVersionRepository.GetByUserUpToDateAsync(userId, onDate, cancellationToken);
        if (availableTariffs.Count > 0)
        {
            return availableTariffs;
        }

        var anyExistingTariffs = await tariffVersionRepository.GetByUserUpToDateAsync(userId, MaxIsoDate, cancellationToken);
        if (anyExistingTariffs.Count > 0)
        {
            return availableTariffs;
        }

        var utilitySetup = await utilitySetupRepository.GetByUserIdAsync(userId, cancellationToken);
        if (utilitySetup is null)
        {
            return availableTariffs;
        }

        var moveInDate = ParseIsoDate(utilitySetup.MoveInDate, "Stored move-in date is invalid.");
        var lookupDate = ParseIsoDate(onDate, "onDate must use yyyy-MM-dd format.");
        if (moveInDate > lookupDate)
        {
            return availableTariffs;
        }

        var now = clock.UtcNow;
        var seededVersion = new TariffVersion
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            EffectiveFromDate = moveInDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            WaterTariffPerUnit = utilitySetup.InitialWaterTariffPerUnit,
            WaterStandingChargePerDay = utilitySetup.InitialWaterStandingChargePerDay,
            WaterVatPercent = utilitySetup.InitialWaterVatPercent,
            ElectricityTariffPerUnit = utilitySetup.InitialElectricityTariffPerUnit,
            ElectricityStandingChargePerDay = utilitySetup.InitialElectricityStandingChargePerDay,
            ElectricityVatPercent = utilitySetup.InitialElectricityVatPercent,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        };

        await tariffVersionRepository.AddAsync(seededVersion, cancellationToken);

        logger.LogInformation(
            "Bootstrapped missing tariff version from utility setup for user {UserId} effective from {EffectiveFromDate}.",
            userId,
            seededVersion.EffectiveFromDate);

        return [seededVersion];
    }

    private async Task<UserAccount> GetEligibleUserAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User record was not found for this session.");

        if (user.Status != UserAccountStatus.Active)
        {
            throw new InvalidOperationException("Only active accounts can manage readings and tariffs.");
        }

        return user;
    }

    private static DateOnly ParseIsoDate(string rawValue, string errorMessage)
    {
        if (!DateOnly.TryParseExact(rawValue, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var value))
        {
            throw new InvalidOperationException(errorMessage);
        }

        return value;
    }

    private static decimal ParseDecimal(string rawValue, string errorMessage)
    {
        if (!decimal.TryParse(rawValue, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
        {
            throw new InvalidOperationException(errorMessage);
        }

        if (value < 0m)
        {
            throw new InvalidOperationException(errorMessage);
        }

        return value;
    }
}
