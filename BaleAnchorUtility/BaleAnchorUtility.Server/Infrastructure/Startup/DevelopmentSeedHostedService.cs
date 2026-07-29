using BaleAnchorUtility.Server.Configuration;
using Microsoft.Extensions.Options;

namespace BaleAnchorUtility.Server.Infrastructure.Startup;

public sealed class DevelopmentSeedHostedService : IHostedService
{
    private readonly IServiceProvider serviceProvider;
    private readonly IHostEnvironment environment;
    private readonly SeedAccessOptions options;
    private readonly ILogger<DevelopmentSeedHostedService> logger;

    public DevelopmentSeedHostedService(
        IServiceProvider serviceProvider,
        IHostEnvironment environment,
        IOptions<SeedAccessOptions> options,
        ILogger<DevelopmentSeedHostedService> logger)
    {
        this.serviceProvider = serviceProvider;
        this.environment = environment;
        this.options = options.Value;
        this.logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!environment.IsDevelopment() || !options.Enabled || options.Accounts.Length == 0)
        {
            return;
        }

        using var scope = serviceProvider.CreateScope();
        var seedService = scope.ServiceProvider.GetRequiredService<DevelopmentSeedDataService>();
        var result = await seedService.EnsureSeedDataAsync(cancellationToken);

        logger.LogInformation(
            "Development seed access ensured on startup. {Message} Fixed OTP code for configured seed accounts: {FixedOtpCode}",
            result.Message,
            options.FixedOtpCode);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}