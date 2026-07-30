namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class StartDelegatedSupportSessionRequest
{
    public string TargetUserId { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string? ExpectedEmail { get; init; }
    public string? ExpectedFlatNumber { get; init; }
    public string? ExpectedDateOfBirth { get; init; }
}

public sealed class StartDelegatedSupportSessionResponse
{
    public string SwitchedUserId { get; init; } = string.Empty;
    public string SwitchedUserEmailMasked { get; init; } = string.Empty;
    public string ExpiresAtUtc { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}
