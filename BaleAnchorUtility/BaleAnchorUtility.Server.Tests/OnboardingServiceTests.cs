using BaleAnchorUtility.Server.Application.Onboarding;
using BaleAnchorUtility.Server.Application.Onboarding.Dtos;
using BaleAnchorUtility.Server.Domain.Terms;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.Extensions.Logging.Abstractions;

namespace BaleAnchorUtility.Server.Tests;

public sealed class OnboardingServiceTests
{
    [Fact]
    public async Task CompleteUtilitySetupAsync_TermsPendingWithoutActiveTerms_TransitionsToPendingApproval()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateResident(
            userId: "u-termspending",
            status: UserAccountStatus.TermsPending,
            surname: "SMITH",
            dateOfBirth: "1990-01-01",
            flatNumber: "A12",
            mobileNumber: "07123456789"));

        var utilitySetups = new InMemoryUtilitySetupRepository();
        var service = new OnboardingService(
            users,
            utilitySetups,
            new InMemoryTermsAcceptanceRepository(),
            new InMemoryTermsVersionRepository(),
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-30T09:00:00Z") },
            NullLogger<OnboardingService>.Instance);

        var result = await service.CompleteUtilitySetupAsync(
            "u-termspending",
            CreateValidUtilitySetupRequest(),
            CancellationToken.None);

        Assert.Equal("PendingApproval", result.Status);

        var user = await users.GetByIdAsync("u-termspending", CancellationToken.None);
        Assert.NotNull(user);
        Assert.Equal(UserAccountStatus.PendingApproval, user!.Status);
    }

    [Fact]
    public async Task CompleteUtilitySetupAsync_RequiresTermsAcceptance_WhenActiveTermsExist()
    {
        var users = new InMemoryUserRepository();
        users.Seed(CreateResident(
            userId: "u-no-terms-acceptance",
            status: UserAccountStatus.TermsPending,
            surname: "SMITH",
            dateOfBirth: "1990-01-01",
            flatNumber: "A12",
            mobileNumber: "07123456789"));

        var termsVersions = new InMemoryTermsVersionRepository();
        await termsVersions.UpsertAsync(new TermsVersion
        {
            Id = "terms-v1",
            VersionLabel = "v1",
            Title = "Terms",
            ContentMarkdown = "Terms",
            EffectiveFromUtc = DateTimeOffset.Parse("2026-07-01T00:00:00Z"),
            PublishedAtUtc = DateTimeOffset.Parse("2026-07-01T00:00:00Z"),
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.Parse("2026-07-01T00:00:00Z"),
            UpdatedAtUtc = DateTimeOffset.Parse("2026-07-01T00:00:00Z"),
            Version = 1,
        }, CancellationToken.None);

        var service = new OnboardingService(
            users,
            new InMemoryUtilitySetupRepository(),
            new InMemoryTermsAcceptanceRepository(),
            termsVersions,
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-30T09:00:00Z") },
            NullLogger<OnboardingService>.Instance);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CompleteUtilitySetupAsync(
                "u-no-terms-acceptance",
                CreateValidUtilitySetupRequest(),
                CancellationToken.None));

        Assert.Equal("Accept terms before utility setup.", exception.Message);
    }

    private static UserAccount CreateResident(
        string userId,
        UserAccountStatus status,
        string surname,
        string dateOfBirth,
        string flatNumber,
        string mobileNumber)
    {
        var now = DateTimeOffset.Parse("2026-07-20T00:00:00Z");

        return new UserAccount
        {
            Id = userId,
            EmailDisplay = $"{userId}@example.com",
            EmailNormalized = $"{userId}@example.com".ToUpperInvariant(),
            Role = UserRole.Resident,
            Status = status,
            SurnameNormalized = surname,
            DateOfBirth = dateOfBirth,
            FlatNumberNormalized = flatNumber,
            MobileNumber = mobileNumber,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        };
    }

    private static CompleteUtilitySetupRequest CreateValidUtilitySetupRequest()
    {
        return new CompleteUtilitySetupRequest
        {
            MoveInDate = "2026-07-01",
            OpeningColdWaterReading = "100.000",
            OpeningHotWaterReading = "50.000",
            OpeningElectricityReading = "500.000",
            InitialWaterTariffPerUnit = "1.234567",
            InitialWaterStandingChargePerDay = "0.123456",
            InitialWaterVatPercent = "5",
            InitialElectricityTariffPerUnit = "0.456789",
            InitialElectricityStandingChargePerDay = "0.234567",
            InitialElectricityVatPercent = "20",
            HotWaterTemperatureCelsius = "55",
            HotWaterHeatCapacity = "4.186",
            HotWaterDensity = "1000",
            KiloJouleToKiloWattHourFactor = "3600",
            BoilerKwhPerCubicMeter = "10.500000",
            BoilerEfficiencyPercent = "85",
        };
    }
}
