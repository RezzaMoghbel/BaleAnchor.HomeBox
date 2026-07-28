using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Domain.Terms;

namespace BaleAnchorUtility.Server.Infrastructure.Startup;

public sealed class TermsSeedHostedService : IHostedService
{
    private readonly IServiceProvider serviceProvider;
    private readonly ILogger<TermsSeedHostedService> logger;

    public TermsSeedHostedService(IServiceProvider serviceProvider, ILogger<TermsSeedHostedService> logger)
    {
        this.serviceProvider = serviceProvider;
        this.logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = serviceProvider.CreateScope();
        var termsVersionRepository = scope.ServiceProvider.GetRequiredService<ITermsVersionRepository>();

        var active = await termsVersionRepository.GetActiveAsync(cancellationToken);
        if (active is not null)
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var seed = new TermsVersion
        {
            Id = Guid.NewGuid().ToString("N"),
            VersionLabel = "v1.0.0",
            Title = "BaleAnchor Utility Terms and Conditions",
            ContentMarkdown = "# BaleAnchor Utility Terms\n\nThis is the active baseline terms version for development. Replace with approved legal content before production.",
            EffectiveFromUtc = now,
            PublishedAtUtc = now,
            IsActive = true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
            Version = 1,
        };

        await termsVersionRepository.UpsertAsync(seed, cancellationToken);
        logger.LogInformation("Seeded default active terms version {VersionLabel}", seed.VersionLabel);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
