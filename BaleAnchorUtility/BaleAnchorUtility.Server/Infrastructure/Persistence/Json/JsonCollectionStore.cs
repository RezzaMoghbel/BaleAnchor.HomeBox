using System.Collections.Concurrent;
using System.Text.Json;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonCollectionStore
{
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> CollectionLocks = new();

    private readonly JsonSerializerOptions serializerOptions;
    private readonly string rootPath;

    public JsonCollectionStore(IWebHostEnvironment environment)
    {
        rootPath = Path.GetFullPath(Path.Combine(environment.ContentRootPath, "..", "Database", "Collections"));
        serializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true,
        };
    }

    public async Task<IReadOnlyList<T>> GetAllAsync<T>(string collectionName, CancellationToken cancellationToken)
    {
        var collectionPath = EnsureCollectionPath(collectionName);
        if (!Directory.Exists(collectionPath))
        {
            return [];
        }

        var files = Directory.GetFiles(collectionPath, "*.json", SearchOption.TopDirectoryOnly);
        var results = new List<T>(files.Length);

        foreach (var file in files)
        {
            await using var stream = File.OpenRead(file);
            var document = await JsonSerializer.DeserializeAsync<T>(stream, serializerOptions, cancellationToken);
            if (document is not null)
            {
                results.Add(document);
            }
        }

        return results;
    }

    public async Task UpsertAsync<T>(string collectionName, string id, T model, CancellationToken cancellationToken)
    {
        var collectionPath = EnsureCollectionPath(collectionName);
        var filePath = Path.Combine(collectionPath, $"{id}.json");
        var tempPath = Path.Combine(collectionPath, $"{id}.{Guid.NewGuid():N}.tmp");
        var backupPath = Path.Combine(collectionPath, $"{id}.bak");

        var gate = CollectionLocks.GetOrAdd(collectionName, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken);
        try
        {
            Directory.CreateDirectory(collectionPath);

            await using (var stream = File.Create(tempPath))
            {
                await JsonSerializer.SerializeAsync(stream, model, serializerOptions, cancellationToken);
                await stream.FlushAsync(cancellationToken);
            }

            await using (var validationStream = File.OpenRead(tempPath))
            {
                _ = await JsonSerializer.DeserializeAsync<T>(validationStream, serializerOptions, cancellationToken)
                    ?? throw new InvalidOperationException("Serialized document failed validation.");
            }

            if (File.Exists(filePath))
            {
                File.Replace(tempPath, filePath, backupPath, ignoreMetadataErrors: true);
                if (File.Exists(backupPath))
                {
                    File.Delete(backupPath);
                }
            }
            else
            {
                File.Move(tempPath, filePath);
            }
        }
        finally
        {
            if (File.Exists(tempPath))
            {
                File.Delete(tempPath);
            }

            gate.Release();
        }
    }

    public async Task DeleteAsync(string collectionName, string id, CancellationToken cancellationToken)
    {
        var collectionPath = EnsureCollectionPath(collectionName);
        var filePath = Path.Combine(collectionPath, $"{id}.json");
        if (!File.Exists(filePath))
        {
            return;
        }

        var gate = CollectionLocks.GetOrAdd(collectionName, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken);
        try
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
        finally
        {
            gate.Release();
        }
    }

    private string EnsureCollectionPath(string collectionName)
    {
        return Path.Combine(rootPath, collectionName);
    }
}
