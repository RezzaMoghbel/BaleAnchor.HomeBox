using BaleAnchorUtility.Server.Application.Notifications;

namespace BaleAnchorUtility.Server.Infrastructure.Startup;

public sealed class ReminderDispatchHostedService : BackgroundService
{
    private readonly IServiceProvider serviceProvider;
    private readonly ILogger<ReminderDispatchHostedService> logger;

    public ReminderDispatchHostedService(IServiceProvider serviceProvider, ILogger<ReminderDispatchHostedService> logger)
    {
        this.serviceProvider = serviceProvider;
        this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var dispatchService = scope.ServiceProvider.GetRequiredService<ReminderDispatchService>();
                var sent = await dispatchService.DispatchDueAsync(40, stoppingToken);

                if (sent > 0)
                {
                    logger.LogInformation("Reminder dispatch worker delivered {SentCount} reminder job(s).", sent);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Reminder dispatch worker iteration failed.");
            }

            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }
}
