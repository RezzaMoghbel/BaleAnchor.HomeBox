using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class FakeHostEnvironment : IHostEnvironment
{
    public string EnvironmentName { get; set; } = "Development";
    public string ApplicationName { get; set; } = "BaleAnchorUtility.Server.Tests";
    public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
}
