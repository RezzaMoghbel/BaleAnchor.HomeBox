using BaleAnchorUtility.Server.Domain.Users;
using BaleAnchorUtility.Server.Infrastructure.Persistence.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;

namespace BaleAnchorUtility.Server.Tests;

public sealed class JsonCollectionStoreTests : IDisposable
{
    private readonly string root;

    public JsonCollectionStoreTests()
    {
        root = Path.Combine(Path.GetTempPath(), "bau-json-store-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
    }

    [Fact]
    public async Task GetAllAsync_QuarantinesCorruptDocuments()
    {
        var contentRoot = Path.Combine(root, "Server");
        Directory.CreateDirectory(contentRoot);
        var collectionsRoot = Path.Combine(root, "Database", "Collections");

        var collectionPath = Path.Combine(root, "Database", "Collections", "users");
        Directory.CreateDirectory(collectionPath);
        await File.WriteAllTextAsync(Path.Combine(collectionPath, "bad.json"), "{ not-valid-json", CancellationToken.None);

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Persistence:Json:CollectionsRootPath"] = collectionsRoot,
            })
            .Build();

        var store = new JsonCollectionStore(
            new FakeWebHostEnvironment { ContentRootPath = contentRoot },
            configuration,
            NullLogger<JsonCollectionStore>.Instance);

        var records = await store.GetAllAsync<UserAccount>("users", CancellationToken.None);

        Assert.Empty(records);
        Assert.False(File.Exists(Path.Combine(collectionPath, "bad.json")));
        Assert.NotEmpty(Directory.GetFiles(Path.Combine(collectionPath, "_quarantine"), "*.corrupt.json"));
    }

    [Fact]
    public async Task UpsertAsync_CleansTemporaryFiles_OnCompletion()
    {
        var contentRoot = Path.Combine(root, "Server");
        Directory.CreateDirectory(contentRoot);
        var collectionsRoot = Path.Combine(root, "Database", "Collections");

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Persistence:Json:CollectionsRootPath"] = collectionsRoot,
            })
            .Build();

        var store = new JsonCollectionStore(
            new FakeWebHostEnvironment { ContentRootPath = contentRoot },
            configuration,
            NullLogger<JsonCollectionStore>.Instance);

        await store.UpsertAsync("users", "u-1", new UserAccount
        {
            Id = "u-1",
            EmailDisplay = "a@example.com",
            EmailNormalized = "A@EXAMPLE.COM",
            Status = UserAccountStatus.Active,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
            Version = 1,
        }, CancellationToken.None);

        var collectionPath = Path.Combine(root, "Database", "Collections", "users");
        var leftovers = Directory.GetFiles(collectionPath, "*.tmp", SearchOption.TopDirectoryOnly);
        Assert.Empty(leftovers);
    }

    public void Dispose()
    {
        if (Directory.Exists(root))
        {
            Directory.Delete(root, recursive: true);
        }
    }

    private sealed class FakeWebHostEnvironment : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "BaleAnchorUtility.Server.Tests";
        public string WebRootPath { get; set; } = string.Empty;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
