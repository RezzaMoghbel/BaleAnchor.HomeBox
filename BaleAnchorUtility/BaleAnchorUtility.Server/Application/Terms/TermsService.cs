using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Terms.Dtos;
using BaleAnchorUtility.Server.Domain.Terms;

namespace BaleAnchorUtility.Server.Application.Terms;

public sealed class TermsService
{
    private readonly ITermsVersionRepository termsVersionRepository;
    private readonly ITermsAcceptanceRepository termsAcceptanceRepository;
    private readonly IUserRepository userRepository;
    private readonly ISystemClock clock;
    private readonly ILogger<TermsService> logger;

    public TermsService(
        ITermsVersionRepository termsVersionRepository,
        ITermsAcceptanceRepository termsAcceptanceRepository,
        IUserRepository userRepository,
        ISystemClock clock,
        ILogger<TermsService> logger)
    {
        this.termsVersionRepository = termsVersionRepository;
        this.termsAcceptanceRepository = termsAcceptanceRepository;
        this.userRepository = userRepository;
        this.clock = clock;
        this.logger = logger;
    }

    public async Task<ActiveTermsResponse?> GetActiveAsync(CancellationToken cancellationToken)
    {
        var active = await termsVersionRepository.GetActiveAsync(cancellationToken);
        if (active is null)
        {
            return null;
        }

        return new ActiveTermsResponse
        {
            VersionId = active.Id,
            VersionLabel = active.VersionLabel,
            Title = active.Title,
            ContentMarkdown = active.ContentMarkdown,
            EffectiveFromUtc = active.EffectiveFromUtc.ToString("O"),
            PublishedAtUtc = active.PublishedAtUtc.ToString("O"),
        };
    }

    public async Task<AcceptTermsResponse> AcceptAsync(
        string userId,
        string termsVersionId,
        string ipAddress,
        string userAgent,
        CancellationToken cancellationToken)
    {
        var active = await termsVersionRepository.GetActiveAsync(cancellationToken)
            ?? throw new InvalidOperationException("No active terms version is available.");

        if (!string.Equals(active.Id, termsVersionId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Only the active terms version can be accepted.");
        }

        var existing = await termsAcceptanceRepository.GetByUserAndVersionAsync(userId, active.Id, cancellationToken);
        if (existing is not null)
        {
            return new AcceptTermsResponse
            {
                TermsVersionId = existing.TermsVersionId,
                AcceptedAtUtc = existing.AcceptedAtUtc.ToString("O"),
                Message = "Terms are already accepted for the active version.",
            };
        }

        var now = clock.UtcNow;
        var acceptance = new TermsAcceptance
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            TermsVersionId = active.Id,
            AcceptedAtUtc = now,
            AcceptedFromIp = NormalizeLimit(ipAddress, 128),
            AcceptedUserAgent = NormalizeLimit(userAgent, 512),
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        };

        await termsAcceptanceRepository.AddAsync(acceptance, cancellationToken);
        await AdvanceUserStatusAfterAcceptanceAsync(userId, cancellationToken);

        logger.LogInformation(
            "Terms accepted. UserId={UserId}, TermsVersionId={TermsVersionId}",
            userId,
            active.Id);

        return new AcceptTermsResponse
        {
            TermsVersionId = active.Id,
            AcceptedAtUtc = now.ToString("O"),
            Message = "Terms accepted successfully.",
        };
    }

    private async Task AdvanceUserStatusAfterAcceptanceAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return;
        }

        if (user.Status is not (Domain.Users.UserAccountStatus.TermsPending or Domain.Users.UserAccountStatus.EmailVerified))
        {
            return;
        }

        user.Status = Domain.Users.UserAccountStatus.ProfileIncomplete;
        user.UpdatedAtUtc = clock.UtcNow;
        user.Version += 1;
        await userRepository.UpsertAsync(user, cancellationToken);
    }

    private static string NormalizeLimit(string value, int maxLength)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? "unknown" : value.Trim();
        return normalized.Length <= maxLength ? normalized : normalized[..maxLength];
    }
}
