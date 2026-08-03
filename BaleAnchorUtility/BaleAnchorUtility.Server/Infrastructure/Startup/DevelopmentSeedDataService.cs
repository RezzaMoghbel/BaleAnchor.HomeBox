using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Billing;
using BaleAnchorUtility.Server.Application.Billing.Dtos;
using BaleAnchorUtility.Server.Application.Calculations;
using BaleAnchorUtility.Server.Application.Onboarding.Dtos;
using BaleAnchorUtility.Server.Configuration;
using BaleAnchorUtility.Server.Domain.Audit;
using BaleAnchorUtility.Server.Domain.Auth;
using BaleAnchorUtility.Server.Domain.Billing;
using BaleAnchorUtility.Server.Domain.Terms;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Infrastructure.Persistence.Json;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Infrastructure.Startup;

public sealed class DevelopmentSeedDataService
{
    private const string ActiveResidentEmail = "resident.active@baleanchor.local";
    private const string FirstReadingDate = "2026-05-01";
    private const string SecondReadingDate = "2026-06-01";
    private const string FirstTariffDate = "2026-05-01";
    private const string SecondTariffDate = "2026-05-16";

    private readonly IHostEnvironment environment;
    private readonly SeedAccessOptions options;
    private readonly IUserRepository userRepository;
    private readonly ITermsVersionRepository termsVersionRepository;
    private readonly ITermsAcceptanceRepository termsAcceptanceRepository;
    private readonly IUtilitySetupRepository utilitySetupRepository;
    private readonly IReadingSubmissionRepository readingSubmissionRepository;
    private readonly ITariffVersionRepository tariffVersionRepository;
    private readonly IBoilerAssumptionVersionRepository boilerAssumptionVersionRepository;
    private readonly ICalculationSnapshotRepository calculationSnapshotRepository;
    private readonly IPaymentRepository paymentRepository;
    private readonly IStatementExportRepository statementExportRepository;
    private readonly BillingInputService billingInputService;
    private readonly CalculationSnapshotService calculationSnapshotService;
    private readonly PaymentService paymentService;
    private readonly StatementPdfExportService statementPdfExportService;
    private readonly JsonCollectionStore store;
    private readonly ILogger<DevelopmentSeedDataService> logger;

    public DevelopmentSeedDataService(
        IHostEnvironment environment,
        IOptions<SeedAccessOptions> options,
        IUserRepository userRepository,
        ITermsVersionRepository termsVersionRepository,
        ITermsAcceptanceRepository termsAcceptanceRepository,
        IUtilitySetupRepository utilitySetupRepository,
        IReadingSubmissionRepository readingSubmissionRepository,
        ITariffVersionRepository tariffVersionRepository,
        IBoilerAssumptionVersionRepository boilerAssumptionVersionRepository,
        ICalculationSnapshotRepository calculationSnapshotRepository,
        IPaymentRepository paymentRepository,
        IStatementExportRepository statementExportRepository,
        BillingInputService billingInputService,
        CalculationSnapshotService calculationSnapshotService,
        PaymentService paymentService,
        StatementPdfExportService statementPdfExportService,
        JsonCollectionStore store,
        ILogger<DevelopmentSeedDataService> logger)
    {
        this.environment = environment;
        this.options = options.Value;
        this.userRepository = userRepository;
        this.termsVersionRepository = termsVersionRepository;
        this.termsAcceptanceRepository = termsAcceptanceRepository;
        this.utilitySetupRepository = utilitySetupRepository;
        this.readingSubmissionRepository = readingSubmissionRepository;
        this.tariffVersionRepository = tariffVersionRepository;
        this.boilerAssumptionVersionRepository = boilerAssumptionVersionRepository;
        this.calculationSnapshotRepository = calculationSnapshotRepository;
        this.paymentRepository = paymentRepository;
        this.statementExportRepository = statementExportRepository;
        this.billingInputService = billingInputService;
        this.calculationSnapshotService = calculationSnapshotService;
        this.paymentService = paymentService;
        this.statementPdfExportService = statementPdfExportService;
        this.store = store;
        this.logger = logger;
    }

    public bool IsAvailable => environment.IsDevelopment() && options.Enabled;

    public string FixedOtpCode => options.FixedOtpCode;

    public IReadOnlyList<string> SeedEmails => options.Accounts
        .Where(x => !string.IsNullOrWhiteSpace(x.Email))
        .Select(x => x.Email.Trim())
        .ToArray();

    public async Task<DevelopmentSeedOperationResult> EnsureSeedDataAsync(CancellationToken cancellationToken)
    {
        EnsureAvailable();

        var usersSeeded = await EnsureSeedUsersAsync(cancellationToken);
        var activeTerms = await termsVersionRepository.GetActiveAsync(cancellationToken)
            ?? throw new InvalidOperationException("Active terms are required before development demo data can be seeded.");

        var activeResident = await GetConfiguredSeedUserAsync(ActiveResidentEmail, cancellationToken)
            ?? throw new InvalidOperationException("The active resident seed account is not available.");

        var termsAcceptancesSeeded = await EnsureTermsAcceptanceAsync(activeResident.Id, activeTerms.Id, cancellationToken);
        var utilitySetupsSeeded = await EnsureUtilitySetupAsync(activeResident.Id, cancellationToken);
        var tariffsSeeded = await EnsureTariffsAsync(activeResident.Id, cancellationToken);
        await EnsureBoilerAssumptionsAsync(activeResident.Id, cancellationToken);
        var readingsSeeded = await EnsureReadingsAsync(activeResident.Id, cancellationToken);
        var snapshotsSeeded = await EnsureSnapshotAsync(activeResident.Id, cancellationToken);
        var paymentsSeeded = await EnsurePaymentAsync(activeResident.Id, cancellationToken);
        var exportsSeeded = await EnsureStatementExportAsync(activeResident.Id, cancellationToken);

        var result = new DevelopmentSeedOperationResult
        {
            Message = "Development seed data is ready.",
            UsersChanged = usersSeeded,
            TermsAcceptancesChanged = termsAcceptancesSeeded,
            UtilitySetupsChanged = utilitySetupsSeeded,
            TariffsChanged = tariffsSeeded,
            ReadingsChanged = readingsSeeded,
            CalculationSnapshotsChanged = snapshotsSeeded,
            PaymentsChanged = paymentsSeeded,
            StatementExportsChanged = exportsSeeded,
        };

        logger.LogInformation(
            "Development seed data ensured. Users={Users}, TermsAcceptances={TermsAcceptances}, UtilitySetups={UtilitySetups}, Tariffs={Tariffs}, Readings={Readings}, Snapshots={Snapshots}, Payments={Payments}, Exports={Exports}",
            result.UsersChanged,
            result.TermsAcceptancesChanged,
            result.UtilitySetupsChanged,
            result.TariffsChanged,
            result.ReadingsChanged,
            result.CalculationSnapshotsChanged,
            result.PaymentsChanged,
            result.StatementExportsChanged);

        return result;
    }

    public async Task<DevelopmentSeedOperationResult> ResetSeedDataAsync(CancellationToken cancellationToken)
    {
        EnsureAvailable();

        var seedUserIds = options.Accounts
            .Where(x => !string.IsNullOrWhiteSpace(x.Id))
            .Select(x => x.Id.Trim())
            .ToHashSet(StringComparer.Ordinal);

        var seedEmails = options.Accounts
            .Where(x => !string.IsNullOrWhiteSpace(x.Email))
            .Select(x => Application.Auth.AuthService.NormalizeEmail(x.Email))
            .ToHashSet(StringComparer.Ordinal);

        var result = new DevelopmentSeedOperationResult
        {
            Message = "Development seed data removed.",
            StatementExportsChanged = await DeleteByPredicateAsync<StatementExportRecord>("StatementExports", x => seedUserIds.Contains(x.UserId), x => x.Id, cancellationToken),
            PaymentsChanged = await DeleteByPredicateAsync<PaymentRecord>("Payments", x => seedUserIds.Contains(x.UserId), x => x.Id, cancellationToken),
            CalculationSnapshotsChanged = await DeleteByPredicateAsync<Domain.Calculations.CalculationSnapshot>("CalculationSnapshots", x => seedUserIds.Contains(x.UserId), x => x.Id, cancellationToken),
            ReadingsChanged = await DeleteByPredicateAsync<ReadingSubmission>("ReadingSubmissions", x => seedUserIds.Contains(x.UserId), x => x.Id, cancellationToken),
            TariffsChanged = await DeleteByPredicateAsync<TariffVersion>("Tariffs", x => seedUserIds.Contains(x.UserId), x => x.Id, cancellationToken),
            UtilitySetupsChanged = await DeleteByPredicateAsync<Domain.Onboarding.UtilitySetupSubmission>("UtilitySetups", x => seedUserIds.Contains(x.UserId), x => x.Id, cancellationToken),
            TermsAcceptancesChanged = await DeleteByPredicateAsync<TermsAcceptance>("TermsAcceptances", x => seedUserIds.Contains(x.UserId), x => x.Id, cancellationToken),
        };

        result.AuditLogsChanged = await DeleteByPredicateAsync<AuditLogEntry>(
            "AuditLogs",
            x => seedUserIds.Contains(x.ActorUserId) || seedUserIds.Contains(x.TargetUserId),
            x => x.Id,
            cancellationToken);

        await DeleteByPredicateAsync<Domain.Billing.BoilerAssumptionVersion>(
            "BoilerAssumptions",
            x => seedUserIds.Contains(x.UserId),
            x => x.Id,
            cancellationToken);

        result.SessionsChanged = await DeleteByPredicateAsync<AuthSession>(
            "Sessions",
            x => seedUserIds.Contains(x.UserId) || seedEmails.Contains(x.EmailNormalized),
            x => x.Id,
            cancellationToken);

        result.OtpChallengesChanged = await DeleteByPredicateAsync<OtpChallenge>(
            "OtpChallenges",
            x => seedEmails.Contains(x.EmailNormalized),
            x => x.Id,
            cancellationToken);

        result.UsersChanged = await DeleteByPredicateAsync<UserAccount>(
            "Users",
            x => seedUserIds.Contains(x.Id) || seedEmails.Contains(x.EmailNormalized),
            x => x.Id,
            cancellationToken);

        logger.LogInformation(
            "Development seed data removed. Users={Users}, Sessions={Sessions}, OtpChallenges={OtpChallenges}, TermsAcceptances={TermsAcceptances}, UtilitySetups={UtilitySetups}, Tariffs={Tariffs}, Readings={Readings}, Snapshots={Snapshots}, Payments={Payments}, Exports={Exports}, AuditLogs={AuditLogs}",
            result.UsersChanged,
            result.SessionsChanged,
            result.OtpChallengesChanged,
            result.TermsAcceptancesChanged,
            result.UtilitySetupsChanged,
            result.TariffsChanged,
            result.ReadingsChanged,
            result.CalculationSnapshotsChanged,
            result.PaymentsChanged,
            result.StatementExportsChanged,
            result.AuditLogsChanged);

        return result;
    }

    public async Task<DevelopmentSeedOperationResult> ReseedAsync(CancellationToken cancellationToken)
    {
        EnsureAvailable();
        var reset = await ResetSeedDataAsync(cancellationToken);
        var ensured = await EnsureSeedDataAsync(cancellationToken);

        return new DevelopmentSeedOperationResult
        {
            Message = "Development seed data reset and recreated.",
            UsersChanged = reset.UsersChanged + ensured.UsersChanged,
            SessionsChanged = reset.SessionsChanged,
            OtpChallengesChanged = reset.OtpChallengesChanged,
            TermsAcceptancesChanged = reset.TermsAcceptancesChanged + ensured.TermsAcceptancesChanged,
            UtilitySetupsChanged = reset.UtilitySetupsChanged + ensured.UtilitySetupsChanged,
            TariffsChanged = reset.TariffsChanged + ensured.TariffsChanged,
            ReadingsChanged = reset.ReadingsChanged + ensured.ReadingsChanged,
            CalculationSnapshotsChanged = reset.CalculationSnapshotsChanged + ensured.CalculationSnapshotsChanged,
            PaymentsChanged = reset.PaymentsChanged + ensured.PaymentsChanged,
            StatementExportsChanged = reset.StatementExportsChanged + ensured.StatementExportsChanged,
            AuditLogsChanged = reset.AuditLogsChanged,
        };
    }

    private void EnsureAvailable()
    {
        if (!IsAvailable)
        {
            throw new InvalidOperationException("Development seed access is not available in the current environment.");
        }
    }

    private async Task<int> EnsureSeedUsersAsync(CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var count = 0;

        foreach (var account in options.Accounts)
        {
            if (string.IsNullOrWhiteSpace(account.Id) || string.IsNullOrWhiteSpace(account.Email))
            {
                continue;
            }

            var normalizedEmail = Application.Auth.AuthService.NormalizeEmail(account.Email);
            var existing = await userRepository.GetByNormalizedEmailAsync(normalizedEmail, cancellationToken);

            var user = existing ?? new UserAccount
            {
                Id = account.Id.Trim(),
                EmailDisplay = account.Email.Trim(),
                EmailNormalized = normalizedEmail,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
                Version = 1,
            };

            user.EmailDisplay = account.Email.Trim();
            user.EmailNormalized = normalizedEmail;
            user.SurnameNormalized = string.IsNullOrWhiteSpace(account.Surname) ? null : account.Surname.Trim().ToUpperInvariant();
            user.DateOfBirth = string.IsNullOrWhiteSpace(account.DateOfBirth) ? null : account.DateOfBirth.Trim();
            user.FlatNumberNormalized = string.IsNullOrWhiteSpace(account.FlatNumber) ? null : account.FlatNumber.Trim().ToUpperInvariant();
            user.MobileNumber = string.IsNullOrWhiteSpace(account.MobileNumber) ? null : account.MobileNumber.Trim();
            user.Role = account.Role;
            user.Status = account.Status;
            user.UpdatedAtUtc = now;
            user.Version = existing is null ? 1 : user.Version + 1;

            await userRepository.UpsertAsync(user, cancellationToken);
            count += 1;
        }

        return count;
    }

    private async Task<UserAccount?> GetConfiguredSeedUserAsync(string email, CancellationToken cancellationToken)
    {
        return await userRepository.GetByNormalizedEmailAsync(
            Application.Auth.AuthService.NormalizeEmail(email),
            cancellationToken);
    }

    private async Task<int> EnsureTermsAcceptanceAsync(string userId, string termsVersionId, CancellationToken cancellationToken)
    {
        var existing = await termsAcceptanceRepository.GetByUserAndVersionAsync(userId, termsVersionId, cancellationToken);
        if (existing is not null)
        {
            return 0;
        }

        var now = DateTimeOffset.UtcNow;
        await termsAcceptanceRepository.AddAsync(
            new TermsAcceptance
            {
                Id = $"seed-terms-{userId}",
                UserId = userId,
                TermsVersionId = termsVersionId,
                AcceptedAtUtc = now,
                AcceptedFromIp = "127.0.0.1",
                AcceptedUserAgent = "development-seed",
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
                Version = 1,
            },
            cancellationToken);

        return 1;
    }

    private async Task<int> EnsureUtilitySetupAsync(string userId, CancellationToken cancellationToken)
    {
        var existing = await utilitySetupRepository.GetByUserIdAsync(userId, cancellationToken);
        if (existing is not null
            && existing.HotWaterTemperatureCelsius > 0m
            && existing.HotWaterHeatCapacity > 0m
            && existing.HotWaterDensity > 0m
            && existing.KiloJouleToKiloWattHourFactor > 0m)
        {
            return 0;
        }

        var now = DateTimeOffset.UtcNow;
        await utilitySetupRepository.UpsertAsync(
            new Domain.Onboarding.UtilitySetupSubmission
            {
                Id = $"seed-utility-{userId}",
                UserId = userId,
                MoveInDate = FirstReadingDate,
                OpeningColdWaterReading = 0m,
                OpeningHotWaterReading = 0m,
                OpeningElectricityReading = 0m,
                InitialWaterTariffPerUnit = 1.750000m,
                InitialElectricityTariffPerUnit = 0.280000m,
                HotWaterTemperatureCelsius = 55m,
                HotWaterHeatCapacity = 4.186m,
                HotWaterDensity = 1000m,
                KiloJouleToKiloWattHourFactor = 3600m,
                BoilerKwhPerCubicMeter = 10.500000m,
                BoilerEfficiencyPercent = 85.00m,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
                Version = 1,
            },
            cancellationToken);

        return existing is null ? 1 : 0;
    }

    private async Task<int> EnsureTariffsAsync(string userId, CancellationToken cancellationToken)
    {
        var count = 0;

        if (await tariffVersionRepository.GetByUserAndEffectiveFromDateAsync(userId, FirstTariffDate, cancellationToken) is null)
        {
            await billingInputService.UpsertTariffAsync(
                userId,
                new UpsertTariffRequest
                {
                    EffectiveFromDate = FirstTariffDate,
                    WaterTariffPerUnit = "1.750000",
                    WaterStandingChargePerDay = "0.180000",
                    WaterVatPercent = "5.00",
                    ElectricityTariffPerUnit = "0.280000",
                    ElectricityStandingChargePerDay = "0.420000",
                    ElectricityVatPercent = "5.00",
                },
                cancellationToken);
            count += 1;
        }

        if (await tariffVersionRepository.GetByUserAndEffectiveFromDateAsync(userId, SecondTariffDate, cancellationToken) is null)
        {
            await billingInputService.UpsertTariffAsync(
                userId,
                new UpsertTariffRequest
                {
                    EffectiveFromDate = SecondTariffDate,
                    WaterTariffPerUnit = "1.920000",
                    WaterStandingChargePerDay = "0.200000",
                    WaterVatPercent = "5.00",
                    ElectricityTariffPerUnit = "0.305000",
                    ElectricityStandingChargePerDay = "0.450000",
                    ElectricityVatPercent = "5.00",
                },
                cancellationToken);
            count += 1;
        }

        return count;
    }

    private async Task EnsureBoilerAssumptionsAsync(string userId, CancellationToken cancellationToken)
    {
        var existingVersions = (await boilerAssumptionVersionRepository.GetByUserUpToDateAsync(userId, "9999-12-31", cancellationToken))
            .ToList();

        foreach (var invalidVersionId in existingVersions
                     .Where(x => x.HotWaterTemperatureCelsius <= 0m
                                 || x.HotWaterHeatCapacity <= 0m
                                 || x.HotWaterDensity <= 0m
                                 || x.KiloJouleToKiloWattHourFactor <= 0m
                                 || x.BoilerKwhPerCubicMeter <= 0m
                                 || x.BoilerEfficiencyPercent <= 0m)
                     .Select(x => x.Id))
        {
            await store.DeleteAsync("BoilerAssumptions", invalidVersionId, cancellationToken);
        }

        var baselineVersion = await boilerAssumptionVersionRepository.GetByUserAndEffectiveFromDateAsync(
            userId,
            FirstReadingDate,
            cancellationToken);

        if (baselineVersion is not null)
        {
            return;
        }

        await billingInputService.UpsertBoilerAssumptionVersionAsync(
            userId,
            new UpsertBoilerAssumptionVersionRequest
            {
                EffectiveFromDate = FirstReadingDate,
                HotWaterTemperatureCelsius = "55",
                HotWaterHeatCapacity = "4.186",
                HotWaterDensity = "1000",
                KiloJouleToKiloWattHourFactor = "3600",
                BoilerKwhPerCubicMeter = "10.500000",
                BoilerEfficiencyPercent = "85.00",
            },
            cancellationToken);
    }

    private async Task<int> EnsureReadingsAsync(string userId, CancellationToken cancellationToken)
    {
        var existing = await readingSubmissionRepository.GetByUserIdAsync(userId, cancellationToken);
        var existingDates = existing.Select(x => x.ReadingDate).ToHashSet(StringComparer.Ordinal);
        var count = 0;

        if (!existingDates.Contains(FirstReadingDate))
        {
            await billingInputService.SubmitReadingsAsync(
                userId,
                new SubmitReadingsRequest
                {
                    ReadingDate = FirstReadingDate,
                    ColdWaterReading = "0.000",
                    HotWaterReading = "0.000",
                    ElectricityReading = "0.000",
                },
                cancellationToken);
            count += 1;
        }

        if (!existingDates.Contains(SecondReadingDate))
        {
            await billingInputService.SubmitReadingsAsync(
                userId,
                new SubmitReadingsRequest
                {
                    ReadingDate = SecondReadingDate,
                    ColdWaterReading = "12.400",
                    HotWaterReading = "8.200",
                    ElectricityReading = "145.700",
                },
                cancellationToken);
            count += 1;
        }

        return count;
    }

    private async Task<int> EnsureSnapshotAsync(string userId, CancellationToken cancellationToken)
    {
        var existing = await calculationSnapshotRepository.GetByUserAndPeriodAsync(
            userId,
            FirstReadingDate,
            SecondReadingDate,
            cancellationToken);

        if (existing is not null)
        {
            return 0;
        }

        await calculationSnapshotService.CalculateLatestPeriodAsync(userId, cancellationToken);
        return 1;
    }

    private async Task<int> EnsurePaymentAsync(string userId, CancellationToken cancellationToken)
    {
        var existing = await paymentRepository.GetByUserAndPeriodAsync(
            userId,
            FirstReadingDate,
            SecondReadingDate,
            cancellationToken);

        if (existing is not null)
        {
            return 0;
        }

        await paymentService.RecordLatestPeriodPaymentAsync(
            userId,
            new RecordLatestPeriodPaymentRequest
            {
                Amount = "120.50",
                PaymentDate = "2026-06-05",
                Method = "Direct Debit",
                Reference = "SEED-DEMO-001",
                Notes = "Development seed payment",
            },
            cancellationToken);

        return 1;
    }

    private async Task<int> EnsureStatementExportAsync(string userId, CancellationToken cancellationToken)
    {
        var snapshot = await calculationSnapshotRepository.GetByUserAndPeriodAsync(
            userId,
            FirstReadingDate,
            SecondReadingDate,
            cancellationToken);

        if (snapshot is null)
        {
            return 0;
        }

        var existing = await statementExportRepository.GetByUserIdAsync(userId, cancellationToken);
        if (existing.Any(x => string.Equals(x.SnapshotId, snapshot.Id, StringComparison.Ordinal)))
        {
            return 0;
        }

        await statementPdfExportService.ExportSelectedPeriodPdfAsync(
            userId,
            snapshot.Id,
            null,
            null,
            cancellationToken);

        return 1;
    }

    private async Task<int> DeleteByPredicateAsync<T>(
        string collectionName,
        Func<T, bool> predicate,
        Func<T, string> idSelector,
        CancellationToken cancellationToken)
    {
        var all = await store.GetAllAsync<T>(collectionName, cancellationToken);
        var ids = all.Where(predicate).Select(idSelector).Distinct(StringComparer.Ordinal).ToList();

        foreach (var id in ids)
        {
            await store.DeleteAsync(collectionName, id, cancellationToken);
        }

        return ids.Count;
    }
}

public sealed class DevelopmentSeedOperationResult
{
    public required string Message { get; set; }
    public int UsersChanged { get; set; }
    public int SessionsChanged { get; set; }
    public int OtpChallengesChanged { get; set; }
    public int TermsAcceptancesChanged { get; set; }
    public int UtilitySetupsChanged { get; set; }
    public int TariffsChanged { get; set; }
    public int ReadingsChanged { get; set; }
    public int CalculationSnapshotsChanged { get; set; }
    public int PaymentsChanged { get; set; }
    public int StatementExportsChanged { get; set; }
    public int AuditLogsChanged { get; set; }
}