using BaleAnchorUtility.Server.Application.Abstractions;

namespace BaleAnchorUtility.Server.Tests.TestDoubles;

internal sealed class FakeSystemClock : ISystemClock
{
    public DateTimeOffset UtcNow { get; set; }
}
