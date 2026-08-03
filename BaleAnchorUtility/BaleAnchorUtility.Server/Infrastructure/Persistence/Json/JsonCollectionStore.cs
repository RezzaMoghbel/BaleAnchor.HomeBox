using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BaleAnchorUtility.Server.Infrastructure.Persistence.Json;

public sealed class JsonCollectionStore
{
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> CollectionLocks = new();
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, string>> CollectionIndexes = new();
    private static readonly TimeSpan TempFileGracePeriod = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan ReadRetryDelay = TimeSpan.FromMilliseconds(20);
    private const int ReadRetryCount = 5;
    private const string CollectionsRootConfigKey = "Persistence:Json:CollectionsRootPath";

    private readonly JsonSerializerOptions serializerOptions;
    private readonly string rootPath;
    private readonly ILogger<JsonCollectionStore> logger;

    public JsonCollectionStore(IWebHostEnvironment environment, IConfiguration configuration, ILogger<JsonCollectionStore> logger)
    {
        this.logger = logger;
        rootPath = ResolveRootPath(environment.ContentRootPath, configuration[CollectionsRootConfigKey]);
        Directory.CreateDirectory(rootPath);
        this.logger.LogInformation("JsonCollectionStore using collections root path: {CollectionsRootPath}", rootPath);

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
                await using var stream = await OpenReadSharedWithRetryAsync(file, cancellationToken);
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
            catch (IOException)
            {
                // Ignore files that remain locked after retries; read is best-effort.
            }
            catch (UnauthorizedAccessException)
            {
                // Ignore inaccessible files; they can be read in a subsequent request.
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
        var path = Path.Combine(rootPath, collectionName);
        Directory.CreateDirectory(path);
        return path;
    }

    private static string ResolveRootPath(string contentRootPath, string? configuredRootPath)
    {
        if (!string.IsNullOrWhiteSpace(configuredRootPath))
        {
            return Path.GetFullPath(
                Path.IsPathRooted(configuredRootPath)
                    ? configuredRootPath
                    : Path.Combine(contentRootPath, configuredRootPath));
        }

        var siteLocalPath = Path.GetFullPath(Path.Combine(contentRootPath, "Database", "Collections"));
        var legacyParentPath = Path.GetFullPath(Path.Combine(contentRootPath, "..", "Database", "Collections"));

        if (Directory.Exists(siteLocalPath))
        {
            return siteLocalPath;
        }

        if (Directory.Exists(legacyParentPath))
        {
            return legacyParentPath;
        }

        return siteLocalPath;
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
            using var stream = new FileStream(
                filePath,
                FileMode.Open,
                FileAccess.Read,
                FileShare.ReadWrite | FileShare.Delete);
            _ = JsonDocument.Parse(stream);
            return false;
        }
        catch (JsonException)
        {
            return true;
        }
        catch (IOException)
        {
            // Transient file lock; do not classify as corrupt.
            return false;
        }
        catch (UnauthorizedAccessException)
        {
            // Inaccessible file; do not classify as corrupt.
            return false;
        }
    }

    private static async Task<FileStream> OpenReadSharedWithRetryAsync(string path, CancellationToken cancellationToken)
    {
        for (var attempt = 0; ; attempt++)
        {
            try
            {
                return new FileStream(
                    path,
                    FileMode.Open,
                    FileAccess.Read,
                    FileShare.ReadWrite | FileShare.Delete);
            }
            catch (IOException) when (attempt < ReadRetryCount)
            {
                await Task.Delay(ReadRetryDelay, cancellationToken);
            }
            catch (UnauthorizedAccessException) when (attempt < ReadRetryCount)
            {
                await Task.Delay(ReadRetryDelay, cancellationToken);
            }
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
