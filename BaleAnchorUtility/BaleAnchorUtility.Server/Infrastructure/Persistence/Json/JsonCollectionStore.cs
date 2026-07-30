using System.Collections.Concurrent;
using System.Text.Json;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonCollectionStore
{
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> CollectionLocks = new();
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, string>> CollectionIndexes = new();
    private static readonly TimeSpan TempFileGracePeriod = TimeSpan.FromMinutes(2);

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

        CleanupTemporaryFiles(collectionPath);

        var files = Directory.GetFiles(collectionPath, "*.json", SearchOption.TopDirectoryOnly);
        var results = new List<T>(files.Length);
        var index = CollectionIndexes.GetOrAdd(collectionName, _ => new ConcurrentDictionary<string, string>(StringComparer.Ordinal));
        index.Clear();

        foreach (var file in files)
        {
            try
            {
                await using var stream = File.OpenRead(file);
                var document = await JsonSerializer.DeserializeAsync<T>(stream, serializerOptions, cancellationToken);
                if (document is not null)
                {
                    results.Add(document);
                    index[Path.GetFileNameWithoutExtension(file)] = file;
                }
            }
            catch (JsonException)
            {
                QuarantineCorruptFile(file);
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
            CleanupTemporaryFiles(collectionPath);

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

            var index = CollectionIndexes.GetOrAdd(collectionName, _ => new ConcurrentDictionary<string, string>(StringComparer.Ordinal));
            index[id] = filePath;
        }
        finally
        {
            if (File.Exists(tempPath))
            {
                TryDeleteFile(tempPath);
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

            if (CollectionIndexes.TryGetValue(collectionName, out var index))
            {
                _ = index.TryRemove(id, out _);
            }
        }
        finally
        {
            gate.Release();
        }
    }

    public void RebuildIndexes()
    {
        if (!Directory.Exists(rootPath))
        {
            return;
        }

        foreach (var collectionPath in Directory.GetDirectories(rootPath))
        {
            CleanupTemporaryFiles(collectionPath);

            var collectionName = Path.GetFileName(collectionPath);
            var index = CollectionIndexes.GetOrAdd(collectionName, _ => new ConcurrentDictionary<string, string>(StringComparer.Ordinal));
            index.Clear();

            foreach (var file in Directory.GetFiles(collectionPath, "*.json", SearchOption.TopDirectoryOnly))
            {
                if (IsCorruptJson(file))
                {
                    QuarantineCorruptFile(file);
                    continue;
                }

                index[Path.GetFileNameWithoutExtension(file)] = file;
            }
        }
    }

    private string EnsureCollectionPath(string collectionName)
    {
        return Path.Combine(rootPath, collectionName);
    }

    private static void CleanupTemporaryFiles(string collectionPath)
    {
        if (!Directory.Exists(collectionPath))
        {
            return;
        }

        var cutoffUtc = DateTime.UtcNow - TempFileGracePeriod;
        foreach (var temp in Directory.GetFiles(collectionPath, "*.tmp", SearchOption.TopDirectoryOnly))
        {
            try
            {
                var fileInfo = new FileInfo(temp);
                if (fileInfo.LastWriteTimeUtc > cutoffUtc)
                {
                    continue;
                }

                TryDeleteFile(temp);
            }
            catch (IOException)
            {
                // Ignore temporary files currently used by active writers.
            }
            catch (UnauthorizedAccessException)
            {
                // Ignore inaccessible temp files; they can be retried later.
            }
        }
    }

    private static void TryDeleteFile(string path)
    {
        try
        {
            File.Delete(path);
        }
        catch (IOException)
        {
            // Ignore when the file is locked by another operation/process.
        }
        catch (UnauthorizedAccessException)
        {
            // Ignore inaccessible files; cleanup is best-effort.
        }
    }

    private static bool IsCorruptJson(string filePath)
    {
        try
        {
            using var stream = File.OpenRead(filePath);
            _ = JsonDocument.Parse(stream);
            return false;
        }
        catch (JsonException)
        {
            return true;
        }
    }

    private static void QuarantineCorruptFile(string filePath)
    {
        var collectionPath = Path.GetDirectoryName(filePath) ?? throw new InvalidOperationException("Collection path is unavailable.");
        var quarantinePath = Path.Combine(collectionPath, "_quarantine");
        Directory.CreateDirectory(quarantinePath);

        var fileName = Path.GetFileNameWithoutExtension(filePath);
        var target = Path.Combine(quarantinePath, $"{fileName}.{DateTimeOffset.UtcNow:yyyyMMddHHmmss}.corrupt.json");

        if (File.Exists(target))
        {
            target = Path.Combine(quarantinePath, $"{fileName}.{DateTimeOffset.UtcNow:yyyyMMddHHmmss}.{Guid.NewGuid():N}.corrupt.json");
        }

        File.Move(filePath, target);
    }
}
