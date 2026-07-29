using BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

namespace BaleAnchorUtility.Server.Infrastructure.Startup;

public sealed class JsonIndexRebuildHostedService : IHostedService
{
    private readonly JsonCollectionStore jsonCollectionStore;
    private readonly ILogger<JsonIndexRebuildHostedService> logger;

    public JsonIndexRebuildHostedService(JsonCollectionStore jsonCollectionStore, ILogger<JsonIndexRebuildHostedService> logger)
    {
        this.jsonCollectionStore = jsonCollectionStore;
        this.logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        logger.LogInformation("Starting JSON collection index rebuild.");
        jsonCollectionStore.RebuildIndexes();
        logger.LogInformation("Completed JSON collection index rebuild.");
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
