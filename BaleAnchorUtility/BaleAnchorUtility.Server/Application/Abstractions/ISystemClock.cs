namespace BaleAnchorUtility.Server.Application.Abstractions;

public interface ISystemClock
{
    DateTimeOffset UtcNow { get; }
}
