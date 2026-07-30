using System.Globalization;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Admin.Dtos;
using BaleAnchorUtility.Server.Domain.Admin;
using BaleAnchorUtility.Server.Domain.Audit;
using BaleAnchorUtility.Server.Domain.Billing;
using BaleAnchorUtility.Server.Domain.Terms;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Admin;

public sealed class AdminCmsService
{
    private readonly IUserRepository userRepository;
    private readonly IFlatRepository flatRepository;
    private readonly ITenancyRepository tenancyRepository;
    private readonly ITenantGapRepository tenantGapRepository;
    private readonly IReadingSubmissionRepository readingSubmissionRepository;
    private readonly ITariffVersionRepository tariffVersionRepository;
    private readonly IPaymentRepository paymentRepository;
    private readonly IUtilitySetupRepository utilitySetupRepository;
    private readonly ITermsVersionRepository termsVersionRepository;
    private readonly ITermsAcceptanceRepository termsAcceptanceRepository;
    private readonly IAuditLogRepository auditLogRepository;
    private readonly IAdminUserPurgeRepository adminUserPurgeRepository;
    private readonly ISystemClock clock;

    public AdminCmsService(
        IUserRepository userRepository,
        IFlatRepository flatRepository,
        ITenancyRepository tenancyRepository,
        ITenantGapRepository tenantGapRepository,
        IReadingSubmissionRepository readingSubmissionRepository,
        ITariffVersionRepository tariffVersionRepository,
        IPaymentRepository paymentRepository,
        IUtilitySetupRepository utilitySetupRepository,
        ITermsVersionRepository termsVersionRepository,
        ITermsAcceptanceRepository termsAcceptanceRepository,
        IAuditLogRepository auditLogRepository,
        IAdminUserPurgeRepository adminUserPurgeRepository,
        ISystemClock clock)
    {
        this.userRepository = userRepository;
        this.flatRepository = flatRepository;
        this.tenancyRepository = tenancyRepository;
        this.tenantGapRepository = tenantGapRepository;
        this.readingSubmissionRepository = readingSubmissionRepository;
        this.tariffVersionRepository = tariffVersionRepository;
        this.paymentRepository = paymentRepository;
        this.utilitySetupRepository = utilitySetupRepository;
        this.termsVersionRepository = termsVersionRepository;
        this.termsAcceptanceRepository = termsAcceptanceRepository;
        this.auditLogRepository = auditLogRepository;
        this.adminUserPurgeRepository = adminUserPurgeRepository;
        this.clock = clock;
    }

    public async Task<FlatListResponse> GetFlatsAsync(CancellationToken cancellationToken)
    {
        var flats = await flatRepository.GetAllAsync(cancellationToken);
        var items = flats
            .OrderBy(x => x.FlatNumberNormalized, StringComparer.Ordinal)
            .Select(x => new FlatSummaryItem
            {
                FlatNumber = x.FlatNumberNormalized,
                Label = x.Label,
                IsActive = x.IsActive,
                UpdatedAtUtc = x.UpdatedAtUtc.ToString("O"),
            })
            .ToList();

        return new FlatListResponse
        {
            Count = items.Count,
            Items = items,
        };
    }

    public async Task<AdminActionResultResponse> UpsertFlatAsync(
        UserAccount actor,
        UpsertFlatRequest request,
        CancellationToken cancellationToken)
    {
        var flatNumber = NormalizeFlatNumber(request.FlatNumber);
        var label = RequireLength(request.Label, 1, 120, nameof(request.Label), "Flat label must be 1 to 120 characters.");
        var reason = ValidateReason(request.Reason, nameof(request.Reason));

        var now = clock.UtcNow;
        var existing = await flatRepository.GetByFlatNumberAsync(flatNumber, cancellationToken);
        var flat = existing ?? new FlatRecord
        {
            Id = Guid.NewGuid().ToString("N"),
            FlatNumberNormalized = flatNumber,
            CreatedAtUtc = now,
            Version = 0,
        };

        flat.Label = label;
        flat.IsActive = request.IsActive;
        flat.UpdatedAtUtc = now;
        flat.Version += 1;

        await flatRepository.UpsertAsync(flat, cancellationToken);

        await AddAuditAsync(
            actor.Id,
            actor.Id,
            "ADMIN_FLAT",
            existing is null ? "CREATE_FLAT" : "UPDATE_FLAT",
            reason,
            $"flatNumber:{flat.FlatNumberNormalized};isActive:{flat.IsActive}",
            cancellationToken);

        return new AdminActionResultResponse
        {
            UserId = actor.Id,
            Message = $"Flat {flat.FlatNumberNormalized} saved successfully.",
        };
    }

    public async Task<TenancyListResponse> GetTenanciesAsync(string? userId, string? flatNumber, CancellationToken cancellationToken)
    {
        IReadOnlyList<TenancyRecord> tenancies;
        if (!string.IsNullOrWhiteSpace(userId))
        {
            tenancies = await tenancyRepository.GetByUserIdAsync(userId.Trim(), cancellationToken);
        }
        else if (!string.IsNullOrWhiteSpace(flatNumber))
        {
            tenancies = await tenancyRepository.GetByFlatNumberAsync(NormalizeFlatNumber(flatNumber), cancellationToken);
        }
        else
        {
            tenancies = await tenancyRepository.GetAllAsync(cancellationToken);
        }

        var items = tenancies
            .OrderByDescending(x => x.UpdatedAtUtc)
            .Take(300)
            .Select(x => new TenancySummaryItem
            {
                TenancyId = x.Id,
                UserId = x.UserId,
                FlatNumber = x.FlatNumberNormalized,
                MoveInDate = x.MoveInDate,
                MoveOutDate = x.MoveOutDate,
                Status = x.Status,
                Notes = x.Notes,
                UpdatedAtUtc = x.UpdatedAtUtc.ToString("O"),
            })
            .ToList();

        return new TenancyListResponse
        {
            Count = items.Count,
            Items = items,
        };
    }

    public async Task<AdminActionResultResponse> UpsertTenancyAsync(
        UserAccount actor,
        UpsertTenancyRequest request,
        CancellationToken cancellationToken)
    {
        var target = await GetTargetUserAsync(request.UserId, cancellationToken);
        var flatNumber = NormalizeFlatNumber(request.FlatNumber);
        var reason = ValidateReason(request.Reason, nameof(request.Reason));
        var moveInDate = ParseIsoDate(request.MoveInDate, "Move-in date must use yyyy-MM-dd format.")
            .ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        string? moveOutDate = null;
        if (!string.IsNullOrWhiteSpace(request.MoveOutDate))
        {
            moveOutDate = ParseIsoDate(request.MoveOutDate, "Move-out date must use yyyy-MM-dd format.")
                .ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

            if (string.CompareOrdinal(moveOutDate, moveInDate) <= 0)
            {
                throw new InvalidOperationException("Move-out date must be after move-in date.");
            }
        }

        var status = string.IsNullOrWhiteSpace(request.Status)
            ? (moveOutDate is null ? "Active" : "Closed")
            : RequireLength(request.Status, 3, 20, nameof(request.Status), "Tenancy status must be 3 to 20 characters.");

        var notes = string.IsNullOrWhiteSpace(request.Notes)
            ? null
            : RequireLength(request.Notes, 1, 300, nameof(request.Notes), "Notes must be at most 300 characters.");

        var now = clock.UtcNow;
        TenancyRecord? existing = null;
        if (!string.IsNullOrWhiteSpace(request.TenancyId))
        {
            existing = await tenancyRepository.GetByIdAsync(request.TenancyId.Trim(), cancellationToken)
                ?? throw new KeyNotFoundException("The requested tenancy could not be found.");
        }

        var tenancy = existing ?? new TenancyRecord
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = target.Id,
            FlatNumberNormalized = flatNumber,
            MoveInDate = moveInDate,
            CreatedAtUtc = now,
            Version = 0,
        };

        tenancy.UserId = target.Id;
        tenancy.FlatNumberNormalized = flatNumber;
        tenancy.MoveInDate = moveInDate;
        tenancy.MoveOutDate = moveOutDate;
        tenancy.Status = status;
        tenancy.Notes = notes;
        tenancy.UpdatedAtUtc = now;
        tenancy.Version += 1;

        await tenancyRepository.UpsertAsync(tenancy, cancellationToken);

        await AddAuditAsync(
            actor.Id,
            target.Id,
            "ADMIN_TENANCY",
            existing is null ? "CREATE_TENANCY" : "UPDATE_TENANCY",
            reason,
            $"tenancyId:{tenancy.Id};flatNumber:{tenancy.FlatNumberNormalized};status:{tenancy.Status}",
            cancellationToken);

        return new AdminActionResultResponse
        {
            UserId = target.Id,
            Message = $"Tenancy {tenancy.Id} saved successfully.",
        };
    }

    public async Task<TenantGapAllocationListResponse> GetTenantGapAllocationsAsync(
        string? flatNumber,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<TenantGapAllocation> gaps;
        if (!string.IsNullOrWhiteSpace(flatNumber))
        {
            gaps = await tenantGapRepository.GetByFlatNumberAsync(NormalizeFlatNumber(flatNumber), cancellationToken);
        }
        else
        {
            gaps = await tenantGapRepository.GetAllAsync(cancellationToken);
        }

        var items = gaps
            .OrderByDescending(x => x.UpdatedAtUtc)
            .Take(300)
            .Select(x => new TenantGapAllocationSummaryItem
            {
                AllocationId = x.Id,
                FlatNumber = x.FlatNumberNormalized,
                FromDate = x.FromDate,
                ToDateExclusive = x.ToDateExclusive,
                AssignedUserId = x.AssignedUserId,
                Amount = x.Amount.ToString("0.00", CultureInfo.InvariantCulture),
                Reason = x.Reason,
                Status = x.Status,
                UpdatedAtUtc = x.UpdatedAtUtc.ToString("O"),
            })
            .ToList();

        return new TenantGapAllocationListResponse
        {
            Count = items.Count,
            Items = items,
        };
    }

    public async Task<AdminActionResultResponse> UpsertTenantGapAllocationAsync(
        UserAccount actor,
        UpsertTenantGapAllocationRequest request,
        CancellationToken cancellationToken)
    {
        var flatNumber = NormalizeFlatNumber(request.FlatNumber);
        var target = await GetTargetUserAsync(request.AssignedUserId, cancellationToken);
        var reason = ValidateReason(request.Reason, nameof(request.Reason));
        var fromDate = ParseIsoDate(request.FromDate, "From date must use yyyy-MM-dd format.")
            .ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var toDateExclusive = ParseIsoDate(request.ToDateExclusive, "To-date exclusive must use yyyy-MM-dd format.")
            .ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        if (string.CompareOrdinal(toDateExclusive, fromDate) <= 0)
        {
            throw new InvalidOperationException("To-date exclusive must be after from date.");
        }

        if (!decimal.TryParse(request.Amount, NumberStyles.Number, CultureInfo.InvariantCulture, out var amount) || amount < 0m)
        {
            throw new InvalidOperationException("Amount must be a valid non-negative decimal value.");
        }

        var status = string.IsNullOrWhiteSpace(request.Status)
            ? "Open"
            : RequireLength(request.Status, 3, 20, nameof(request.Status), "Gap status must be 3 to 20 characters.");

        var existing = (await tenantGapRepository.GetByFlatNumberAsync(flatNumber, cancellationToken))
            .FirstOrDefault(x =>
                string.Equals(x.FromDate, fromDate, StringComparison.Ordinal)
                && string.Equals(x.ToDateExclusive, toDateExclusive, StringComparison.Ordinal));

        var now = clock.UtcNow;
        var allocation = existing ?? new TenantGapAllocation
        {
            Id = Guid.NewGuid().ToString("N"),
            FlatNumberNormalized = flatNumber,
            FromDate = fromDate,
            ToDateExclusive = toDateExclusive,
            AssignedUserId = target.Id,
            Reason = reason,
            CreatedAtUtc = now,
            Version = 0,
        };

        allocation.FlatNumberNormalized = flatNumber;
        allocation.FromDate = fromDate;
        allocation.ToDateExclusive = toDateExclusive;
        allocation.AssignedUserId = target.Id;
        allocation.Amount = decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
        allocation.Reason = reason;
        allocation.Status = status;
        allocation.UpdatedAtUtc = now;
        allocation.Version += 1;

        await tenantGapRepository.UpsertAsync(allocation, cancellationToken);

        await AddAuditAsync(
            actor.Id,
            target.Id,
            "ADMIN_GAP",
            existing is null ? "CREATE_GAP_ALLOCATION" : "UPDATE_GAP_ALLOCATION",
            reason,
            $"allocationId:{allocation.Id};flatNumber:{allocation.FlatNumberNormalized};amount:{allocation.Amount.ToString("0.00", CultureInfo.InvariantCulture)}",
            cancellationToken);

        return new AdminActionResultResponse
        {
            UserId = target.Id,
            Message = $"Tenant gap allocation {allocation.Id} saved successfully.",
        };
    }

    public async Task<AdminUserSearchResponse> SearchUsersAsync(
        string? query,
        string? status,
        CancellationToken cancellationToken)
    {
        var users = await userRepository.GetAllAsync(cancellationToken);
        IEnumerable<UserAccount> filtered = users;

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<UserAccountStatus>(status, true, out var parsedStatus))
            {
                throw new ArgumentException("status must be a valid user status.", nameof(status));
            }

            filtered = filtered.Where(x => x.Status == parsedStatus);
        }

        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim();
            filtered = filtered.Where(x =>
                x.EmailNormalized.Contains(q, StringComparison.OrdinalIgnoreCase)
                || x.EmailDisplay.Contains(q, StringComparison.OrdinalIgnoreCase)
                || x.Id.Contains(q, StringComparison.OrdinalIgnoreCase)
                || (x.FlatNumberNormalized?.Contains(q, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var items = filtered
            .OrderByDescending(x => x.UpdatedAtUtc)
            .Take(200)
            .Select(x => new AdminUserSummaryItem
            {
                UserId = x.Id,
                Email = x.EmailDisplay,
                Role = x.Role.ToString(),
                Status = x.Status.ToString(),
                FlatNumber = x.FlatNumberNormalized,
                UpdatedAtUtc = x.UpdatedAtUtc.ToString("O"),
            })
            .ToList();

        return new AdminUserSearchResponse
        {
            Count = items.Count,
            Items = items,
        };
    }

    public async Task<AdminBillingContextResponse> GetBillingContextAsync(
        string targetUserId,
        string? onDate,
        CancellationToken cancellationToken)
    {
        var user = await GetTargetUserAsync(targetUserId, cancellationToken);

        var utilitySetup = await utilitySetupRepository.GetByUserIdAsync(user.Id, cancellationToken);
        var latestReading = await readingSubmissionRepository.GetLatestByUserIdAsync(user.Id, cancellationToken);
        var lookupDate = string.IsNullOrWhiteSpace(onDate)
            ? DateOnly.FromDateTime(clock.UtcNow.UtcDateTime).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)
            : ParseIsoDate(onDate, "onDate must use yyyy-MM-dd format.").ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        TariffVersion? activeTariff = await tariffVersionRepository.GetActiveByUserAndDateAsync(user.Id, lookupDate, cancellationToken);
        var latestPayment = await paymentRepository.GetLatestByUserIdAsync(user.Id, cancellationToken);

        return new AdminBillingContextResponse
        {
            UserId = user.Id,
            LatestReadingDate = latestReading?.ReadingDate,
            LatestColdWaterReading = latestReading?.ColdWaterReading.ToString("0.###", CultureInfo.InvariantCulture),
            LatestHotWaterReading = latestReading?.HotWaterReading.ToString("0.###", CultureInfo.InvariantCulture),
            LatestElectricityReading = latestReading?.ElectricityReading.ToString("0.###", CultureInfo.InvariantCulture),
            ActiveTariffEffectiveFromDate = activeTariff?.EffectiveFromDate,
            WaterTariffPerUnit = activeTariff?.WaterTariffPerUnit.ToString("0.######", CultureInfo.InvariantCulture),
            WaterStandingChargePerDay = activeTariff?.WaterStandingChargePerDay.ToString("0.######", CultureInfo.InvariantCulture),
            WaterVatPercent = activeTariff?.WaterVatPercent.ToString("0.######", CultureInfo.InvariantCulture),
            ElectricityTariffPerUnit = activeTariff?.ElectricityTariffPerUnit.ToString("0.######", CultureInfo.InvariantCulture),
            ElectricityStandingChargePerDay = activeTariff?.ElectricityStandingChargePerDay.ToString("0.######", CultureInfo.InvariantCulture),
            ElectricityVatPercent = activeTariff?.ElectricityVatPercent.ToString("0.######", CultureInfo.InvariantCulture),
            LatestPaymentId = latestPayment?.Id,
            LatestPaymentAmount = latestPayment?.Amount.ToString("0.00", CultureInfo.InvariantCulture),
            LatestPaymentDate = latestPayment?.PaymentDate,
            LatestPaymentMethod = latestPayment?.Method,
            MoveInDate = utilitySetup?.MoveInDate,
            BoilerKwhPerCubicMeter = utilitySetup?.BoilerKwhPerCubicMeter.ToString("0.######", CultureInfo.InvariantCulture),
            BoilerEfficiencyPercent = utilitySetup?.BoilerEfficiencyPercent.ToString("0.######", CultureInfo.InvariantCulture),
        };
    }

    public async Task<AdminActionResultResponse> DeleteLatestReadingAsync(
        UserAccount actor,
        string targetUserId,
        string reason,
        CancellationToken cancellationToken)
    {
        var target = await GetTargetUserAsync(targetUserId, cancellationToken);
        var trimmedReason = ValidateReason(reason, nameof(reason));

        var readings = await readingSubmissionRepository.GetByUserIdAsync(target.Id, cancellationToken);
        if (readings.Count == 0)
        {
            throw new InvalidOperationException("No readings exist to delete.");
        }

        var latest = readings[^1];

        if (readings.Count >= 2)
        {
            var previous = readings[^2];
            var payment = await paymentRepository.GetByUserAndPeriodAsync(
                target.Id,
                previous.ReadingDate,
                latest.ReadingDate,
                cancellationToken);

            if (payment is not null)
            {
                throw new InvalidOperationException("Latest reading closes a paid period. Delete linked payment first.");
            }
        }

        await readingSubmissionRepository.DeleteAsync(latest.Id, cancellationToken);

        await AddAuditAsync(
            actor.Id,
            target.Id,
            "ADMIN_BILLING",
            "DELETE_LATEST_READING",
            trimmedReason,
            $"readingId:{latest.Id};readingDate:{latest.ReadingDate}",
            cancellationToken);

        return new AdminActionResultResponse
        {
            UserId = target.Id,
            Message = "Latest reading deleted successfully.",
        };
    }

    public async Task<AdminActionResultResponse> UpsertTariffAsync(
        UserAccount actor,
        string targetUserId,
        AdminTargetedTariffRequest request,
        CancellationToken cancellationToken)
    {
        var target = await GetTargetUserAsync(targetUserId, cancellationToken);
        var effectiveFromDate = ParseIsoDate(request.EffectiveFromDate, "Effective-from date must use yyyy-MM-dd format.");
        var waterTariff = ParseDecimal(request.WaterTariffPerUnit, "Water tariff is invalid.");
        var waterStandingCharge = ParseDecimal(request.WaterStandingChargePerDay, "Water standing charge is invalid.");
        var waterVatPercent = ParseDecimal(request.WaterVatPercent, "Water VAT percent is invalid.");
        var electricityTariff = ParseDecimal(request.ElectricityTariffPerUnit, "Electricity tariff is invalid.");
        var electricityStandingCharge = ParseDecimal(request.ElectricityStandingChargePerDay, "Electricity standing charge is invalid.");
        var electricityVatPercent = ParseDecimal(request.ElectricityVatPercent, "Electricity VAT percent is invalid.");
        var trimmedReason = ValidateReason(request.Reason, nameof(request.Reason));

        if (waterTariff <= 0m || electricityTariff <= 0m)
        {
            throw new InvalidOperationException("Water and electricity tariffs must be greater than zero.");
        }

        if (waterVatPercent > 100m || electricityVatPercent > 100m)
        {
            throw new InvalidOperationException("VAT percent cannot exceed 100.");
        }

        var effectiveFrom = effectiveFromDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var existing = await tariffVersionRepository.GetByUserAndEffectiveFromDateAsync(target.Id, effectiveFrom, cancellationToken);
        if (existing is not null)
        {
            throw new InvalidOperationException("A tariff entry already exists for this effective-from date.");
        }

        var now = clock.UtcNow;
        var version = new TariffVersion
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = target.Id,
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

        await AddAuditAsync(
            actor.Id,
            target.Id,
            "ADMIN_BILLING",
            "UPSERT_TARIFF",
            trimmedReason,
            $"effectiveFromDate:{effectiveFrom};waterUnit:{waterTariff.ToString("0.######", CultureInfo.InvariantCulture)};electricityUnit:{electricityTariff.ToString("0.######", CultureInfo.InvariantCulture)}",
            cancellationToken);

        return new AdminActionResultResponse
        {
            UserId = target.Id,
            Message = "Target tariff version saved successfully.",
        };
    }

    public async Task<AdminActionResultResponse> UpdateBoilerAssumptionsAsync(
        UserAccount actor,
        string targetUserId,
        AdminTargetedBoilerAssumptionsRequest request,
        CancellationToken cancellationToken)
    {
        var target = await GetTargetUserAsync(targetUserId, cancellationToken);
        var trimmedReason = ValidateReason(request.Reason, nameof(request.Reason));

        var utilitySetup = await utilitySetupRepository.GetByUserIdAsync(target.Id, cancellationToken)
            ?? throw new InvalidOperationException("Utility setup must exist before boiler assumptions can be changed.");

        var boilerKwh = ParseDecimal(request.BoilerKwhPerCubicMeter, "Boiler conversion (kWh per cubic meter) is invalid.");
        var boilerEfficiency = ParseDecimal(request.BoilerEfficiencyPercent, "Boiler efficiency percent is invalid.");

        if (boilerEfficiency is <= 0m or > 100m)
        {
            throw new InvalidOperationException("Boiler efficiency percent must be greater than 0 and at most 100.");
        }

        utilitySetup.BoilerKwhPerCubicMeter = boilerKwh;
        utilitySetup.BoilerEfficiencyPercent = boilerEfficiency;
        utilitySetup.UpdatedAtUtc = clock.UtcNow;
        utilitySetup.Version += 1;

        await utilitySetupRepository.UpsertAsync(utilitySetup, cancellationToken);

        await AddAuditAsync(
            actor.Id,
            target.Id,
            "ADMIN_BILLING",
            "UPDATE_BOILER_ASSUMPTIONS",
            trimmedReason,
            $"boilerKwhPerM3:{boilerKwh.ToString("0.######", CultureInfo.InvariantCulture)};boilerEfficiencyPercent:{boilerEfficiency.ToString("0.######", CultureInfo.InvariantCulture)}",
            cancellationToken);

        return new AdminActionResultResponse
        {
            UserId = target.Id,
            Message = "Boiler assumptions updated successfully.",
        };
    }

    public async Task<TermsVersionListResponse> GetTermsVersionsAsync(CancellationToken cancellationToken)
    {
        var versions = await termsVersionRepository.GetAllAsync(cancellationToken);
        var items = versions
            .OrderByDescending(x => x.PublishedAtUtc)
            .Select(x => new TermsVersionSummaryItem
            {
                VersionId = x.Id,
                VersionLabel = x.VersionLabel,
                Title = x.Title,
                EffectiveFromUtc = x.EffectiveFromUtc.ToString("O"),
                PublishedAtUtc = x.PublishedAtUtc.ToString("O"),
                IsActive = x.IsActive,
            })
            .ToList();

        return new TermsVersionListResponse
        {
            Count = items.Count,
            Items = items,
        };
    }

    public async Task<PublishTermsVersionResponse> PublishTermsVersionAsync(
        UserAccount actor,
        PublishTermsVersionRequest request,
        CancellationToken cancellationToken)
    {
        if (actor.Role != UserRole.SuperAdmin)
        {
            throw new InvalidOperationException("Only super admins can publish terms versions.");
        }

        var versionLabel = RequireLength(request.VersionLabel, 2, 40, nameof(request.VersionLabel), "Version label must be 2 to 40 characters.");
        var title = RequireLength(request.Title, 3, 120, nameof(request.Title), "Title must be 3 to 120 characters.");
        var content = RequireLength(request.ContentMarkdown, 20, 20000, nameof(request.ContentMarkdown), "Content markdown must be 20 to 20000 characters.");
        var effectiveFrom = ParseDateTimeOffset(request.EffectiveFromUtc, "effectiveFromUtc must be an ISO-8601 timestamp.");
        var reason = ValidateReason(request.Reason, nameof(request.Reason));

        var now = clock.UtcNow;
        var all = await termsVersionRepository.GetAllAsync(cancellationToken);
        foreach (var existing in all.Where(x => x.IsActive))
        {
            existing.IsActive = false;
            existing.UpdatedAtUtc = now;
            existing.Version += 1;
            await termsVersionRepository.UpsertAsync(existing, cancellationToken);
        }

        var version = new TermsVersion
        {
            Id = Guid.NewGuid().ToString("N"),
            VersionLabel = versionLabel,
            Title = title,
            ContentMarkdown = content,
            EffectiveFromUtc = effectiveFrom,
            PublishedAtUtc = now,
            IsActive = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        };

        await termsVersionRepository.UpsertAsync(version, cancellationToken);

        await AddAuditAsync(
            actor.Id,
            actor.Id,
            "TERMS",
            "PUBLISH_TERMS_VERSION",
            reason,
            $"versionId:{version.Id};versionLabel:{version.VersionLabel}",
            cancellationToken);

        return new PublishTermsVersionResponse
        {
            VersionId = version.Id,
            VersionLabel = version.VersionLabel,
            Message = "Terms version published successfully.",
        };
    }

    public async Task<TermsAcceptanceListResponse> GetTermsAcceptancesAsync(
        string? userId,
        string? termsVersionId,
        CancellationToken cancellationToken)
    {
        var all = await termsAcceptanceRepository.GetAllAsync(cancellationToken);
        var filtered = all.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(userId))
        {
            filtered = filtered.Where(x => string.Equals(x.UserId, userId.Trim(), StringComparison.Ordinal));
        }

        if (!string.IsNullOrWhiteSpace(termsVersionId))
        {
            filtered = filtered.Where(x => string.Equals(x.TermsVersionId, termsVersionId.Trim(), StringComparison.Ordinal));
        }

        var items = filtered
            .OrderByDescending(x => x.AcceptedAtUtc)
            .Take(500)
            .Select(x => new TermsAcceptanceSummaryItem
            {
                AcceptanceId = x.Id,
                UserId = x.UserId,
                TermsVersionId = x.TermsVersionId,
                AcceptedAtUtc = x.AcceptedAtUtc.ToString("O"),
                AcceptedFromIp = x.AcceptedFromIp,
            })
            .ToList();

        return new TermsAcceptanceListResponse
        {
            Count = items.Count,
            Items = items,
        };
    }

    public async Task<AuditLogListResponse> GetAuditLogsAsync(
        string? actorUserId,
        string? targetUserId,
        string? scope,
        string? category,
        string? action,
        CancellationToken cancellationToken)
    {
        var all = await auditLogRepository.GetAllAsync(cancellationToken);
        var filtered = all.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(scope))
        {
            var normalizedScope = scope.Trim().ToLowerInvariant();
            if (normalizedScope != "support-lifecycle")
            {
                throw new ArgumentException("scope must be one of: support-lifecycle.", nameof(scope));
            }

            var lifecycleActions = new HashSet<string>(StringComparer.Ordinal)
            {
                "SUSPEND",
                "MOVE_TO_ONBOARDING",
                "REINSTATE_APPROVED",
                "ARCHIVE",
            };

            filtered = filtered.Where(x =>
                (string.Equals(x.Category, "ADMIN_SUPPORT", StringComparison.Ordinal)
                 && string.Equals(x.Action, "START_DELEGATED_SESSION", StringComparison.Ordinal))
                || (string.Equals(x.Category, "ADMIN_APPROVAL", StringComparison.Ordinal)
                    && lifecycleActions.Contains(x.Action)));
        }

        if (!string.IsNullOrWhiteSpace(actorUserId))
        {
            filtered = filtered.Where(x => string.Equals(x.ActorUserId, actorUserId.Trim(), StringComparison.Ordinal));
        }

        if (!string.IsNullOrWhiteSpace(targetUserId))
        {
            filtered = filtered.Where(x => string.Equals(x.TargetUserId, targetUserId.Trim(), StringComparison.Ordinal));
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            var c = category.Trim();
            filtered = filtered.Where(x => x.Category.Contains(c, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            var a = action.Trim();
            filtered = filtered.Where(x => x.Action.Contains(a, StringComparison.OrdinalIgnoreCase));
        }

        var items = filtered
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(500)
            .Select(x => new AuditLogSummaryItem
            {
                AuditId = x.Id,
                ActorUserId = x.ActorUserId,
                TargetUserId = x.TargetUserId,
                Category = x.Category,
                Action = x.Action,
                Reason = x.Reason,
                Metadata = x.Metadata,
                CreatedAtUtc = x.CreatedAtUtc.ToString("O"),
            })
            .ToList();

        return new AuditLogListResponse
        {
            Count = items.Count,
            Items = items,
        };
    }

    public async Task<HardDeleteUserResponse> HardDeleteUserAsync(
        UserAccount actor,
        string targetUserId,
        HardDeleteUserRequest request,
        CancellationToken cancellationToken)
    {
        if (actor.Role != UserRole.SuperAdmin)
        {
            throw new InvalidOperationException("Only SuperAdmin users can hard delete user accounts.");
        }

        var target = await GetTargetUserAsync(targetUserId, cancellationToken);
        if (string.Equals(actor.Id, target.Id, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("SuperAdmin cannot hard delete their own account.");
        }

        if (target.Role is UserRole.Admin or UserRole.SuperAdmin)
        {
            throw new InvalidOperationException("Admin and SuperAdmin accounts cannot be hard deleted via this operation.");
        }

        if (target.Status != UserAccountStatus.Archived)
        {
            throw new InvalidOperationException("Account must be archived before hard deletion.");
        }

        var reason = ValidateReason(request.Reason, nameof(request.Reason));
        var expectedConfirmation = $"DELETE {target.Id}";
        var providedConfirmation = request.ConfirmationText?.Trim() ?? string.Empty;
        if (!string.Equals(providedConfirmation, expectedConfirmation, StringComparison.Ordinal))
        {
            throw new ArgumentException(
                $"Confirmation text must exactly match '{expectedConfirmation}'.",
                nameof(request.ConfirmationText));
        }

        var summary = await adminUserPurgeRepository.PurgeUserDataAsync(
            target.Id,
            target.EmailNormalized,
            cancellationToken);

        await AddAuditAsync(
            actor.Id,
            target.Id,
            "ADMIN_USER",
            "HARD_DELETE_USER",
            reason,
            BuildHardDeleteMetadata(summary),
            cancellationToken);

        return new HardDeleteUserResponse
        {
            UserId = target.Id,
            DeletedRecordCount = summary.TotalDeleted,
            Message = "User account and linked records were permanently deleted.",
        };
    }

    private async Task<UserAccount> GetTargetUserAsync(string targetUserId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(targetUserId))
        {
            throw new ArgumentException("A valid target user id is required.", nameof(targetUserId));
        }

        var target = await userRepository.GetByIdAsync(targetUserId.Trim(), cancellationToken)
            ?? throw new KeyNotFoundException("The target user could not be found.");

        return target;
    }

    private async Task AddAuditAsync(
        string actorUserId,
        string targetUserId,
        string category,
        string action,
        string reason,
        string metadata,
        CancellationToken cancellationToken)
    {
        await auditLogRepository.AddAsync(
            new AuditLogEntry
            {
                Id = Guid.NewGuid().ToString("N"),
                ActorUserId = actorUserId,
                TargetUserId = targetUserId,
                Category = category,
                Action = action,
                Reason = reason,
                Metadata = metadata,
                CreatedAtUtc = clock.UtcNow,
                Version = 1,
            },
            cancellationToken);
    }

    private static string ValidateReason(string reason, string paramName)
    {
        var trimmed = reason?.Trim() ?? string.Empty;
        if (trimmed.Length < 3)
        {
            throw new ArgumentException("Reason must be at least 3 characters.", paramName);
        }

        if (trimmed.Length > 300)
        {
            throw new ArgumentException("Reason must not exceed 300 characters.", paramName);
        }

        return trimmed;
    }

    private static string RequireLength(string value, int min, int max, string paramName, string message)
    {
        var trimmed = value?.Trim() ?? string.Empty;
        if (trimmed.Length < min || trimmed.Length > max)
        {
            throw new ArgumentException(message, paramName);
        }

        return trimmed;
    }

    private static string NormalizeFlatNumber(string flatNumber)
    {
        var normalized = flatNumber?.Trim().ToUpperInvariant() ?? string.Empty;
        if (normalized.Length == 0 || normalized.Length > 20)
        {
            throw new ArgumentException("Flat number must be 1 to 20 characters.", nameof(flatNumber));
        }

        return normalized;
    }

    private static DateOnly ParseIsoDate(string rawValue, string errorMessage)
    {
        if (!DateOnly.TryParseExact(rawValue, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var value))
        {
            throw new InvalidOperationException(errorMessage);
        }

        return value;
    }

    private static DateTimeOffset ParseDateTimeOffset(string rawValue, string errorMessage)
    {
        if (!DateTimeOffset.TryParse(rawValue, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var value))
        {
            throw new ArgumentException(errorMessage, nameof(rawValue));
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

    private static string BuildHardDeleteMetadata(AdminUserPurgeSummary summary)
    {
        return string.Join(';',
        [
            $"users:{summary.UsersDeleted}",
            $"sessions:{summary.SessionsDeleted}",
            $"otpChallenges:{summary.OtpChallengesDeleted}",
            $"termsAcceptances:{summary.TermsAcceptancesDeleted}",
            $"utilitySetups:{summary.UtilitySetupsDeleted}",
            $"tariffs:{summary.TariffsDeleted}",
            $"readings:{summary.ReadingsDeleted}",
            $"calculationSnapshots:{summary.CalculationSnapshotsDeleted}",
            $"payments:{summary.PaymentsDeleted}",
            $"statementExports:{summary.StatementExportsDeleted}",
            $"pushSubscriptions:{summary.PushSubscriptionsDeleted}",
            $"notificationPreferences:{summary.NotificationPreferencesDeleted}",
            $"reminderJobs:{summary.ReminderJobsDeleted}",
            $"tenancies:{summary.TenanciesDeleted}",
            $"tenantGaps:{summary.TenantGapsDeleted}",
        ]);
    }
}
