using BaleAnchorUtility.Server.Application.Terms;
using BaleAnchorUtility.Server.Domain.Onboarding;
using BaleAnchorUtility.Server.Domain.Terms;
using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Tests.TestDoubles;
using Microsoft.Extensions.Logging.Abstractions;

namespace BaleAnchorUtility.Server.Tests;

public sealed class TermsServiceTests
{
    [Fact]
    public async Task AcceptAsync_AlreadyAccepted_ReconcilesTermsPendingToPendingApproval_WhenProfileAndUtilityAreComplete()
    {
        var users = new InMemoryUserRepository();
        users.Seed(new UserAccount
        {
            Id = "u-terms-sync",
            EmailDisplay = "resident@example.com",
            EmailNormalized = "RESIDENT@EXAMPLE.COM",
            Role = UserRole.Resident,
            Status = UserAccountStatus.TermsPending,
            SurnameNormalized = "SMITH",
            DateOfBirth = "1990-01-01",
            FlatNumberNormalized = "A12",
            MobileNumber = "07123456789",
            CreatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            UpdatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            Version = 1,
        });

        var utilitySetups = new InMemoryUtilitySetupRepository();
        utilitySetups.Seed(new UtilitySetupSubmission
        {
            Id = "setup-1",
            UserId = "u-terms-sync",
            MoveInDate = "2026-07-01",
            OpeningColdWaterReading = 100m,
            OpeningHotWaterReading = 50m,
            OpeningElectricityReading = 500m,
            InitialWaterTariffPerUnit = 1.2m,
            InitialWaterStandingChargePerDay = 0.1m,
            InitialWaterVatPercent = 5m,
            InitialElectricityTariffPerUnit = 0.3m,
            InitialElectricityStandingChargePerDay = 0.2m,
            InitialElectricityVatPercent = 20m,
            HotWaterTemperatureCelsius = 55m,
            HotWaterHeatCapacity = 4.186m,
            HotWaterDensity = 1000m,
            KiloJouleToKiloWattHourFactor = 3600m,
            BoilerKwhPerCubicMeter = 10.5m,
            BoilerEfficiencyPercent = 85m,
            CreatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            UpdatedAtUtc = DateTimeOffset.Parse("2026-07-20T00:00:00Z"),
            Version = 1,
        });

        var termsVersions = new InMemoryTermsVersionRepository();
        await termsVersions.UpsertAsync(new TermsVersion
        {
            Id = "terms-v1",
            VersionLabel = "v1.0.0",
            Title = "Terms",
            ContentMarkdown = "Terms body",
            EffectiveFromUtc = DateTimeOffset.Parse("2026-07-28T00:00:00Z"),
            PublishedAtUtc = DateTimeOffset.Parse("2026-07-28T00:00:00Z"),
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.Parse("2026-07-28T00:00:00Z"),
            UpdatedAtUtc = DateTimeOffset.Parse("2026-07-28T00:00:00Z"),
            Version = 1,
        }, CancellationToken.None);

        var termsAcceptances = new InMemoryTermsAcceptanceRepository();
        await termsAcceptances.AddAsync(new TermsAcceptance
        {
            Id = "accept-1",
            UserId = "u-terms-sync",
            TermsVersionId = "terms-v1",
            AcceptedAtUtc = DateTimeOffset.Parse("2026-07-29T10:00:00Z"),
            AcceptedFromIp = "127.0.0.1",
            AcceptedUserAgent = "test",
            CreatedAtUtc = DateTimeOffset.Parse("2026-07-29T10:00:00Z"),
            UpdatedAtUtc = DateTimeOffset.Parse("2026-07-29T10:00:00Z"),
            Version = 1,
        }, CancellationToken.None);

        var service = new TermsService(
            termsVersions,
            termsAcceptances,
            users,
            utilitySetups,
            new FakeSystemClock { UtcNow = DateTimeOffset.Parse("2026-07-30T10:00:00Z") },
            NullLogger<TermsService>.Instance);

        var response = await service.AcceptAsync(
            "u-terms-sync",
            "terms-v1",
            "127.0.0.1",
            "test-agent",
            CancellationToken.None);

        Assert.Equal("Terms are already accepted for the active version.", response.Message);

        var updatedUser = await users.GetByIdAsync("u-terms-sync", CancellationToken.None);
        Assert.NotNull(updatedUser);
        Assert.Equal(UserAccountStatus.PendingApproval, updatedUser!.Status);
    }
}
