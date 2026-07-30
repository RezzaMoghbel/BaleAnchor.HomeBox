using BaleAnchorUtility.Server.Application.Admin.Dtos;
using BaleAnchorUtility.Server.Application.Abstractions;
using BaleAnchorUtility.Server.Application.Auth;
using BaleAnchorUtility.Server.Domain.Users;

namespace BaleAnchorUtility.Server.Application.Admin;

public sealed class AdminSupportAccessService
{
    private readonly IUserRepository userRepository;
    private readonly AuthService authService;

    public AdminSupportAccessService(IUserRepository userRepository, AuthService authService)
    {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    public async Task<(StartDelegatedSupportSessionResponse Response, string RawToken)> StartDelegatedSessionAsync(
        UserAccount actor,
        StartDelegatedSupportSessionRequest request,
        string deviceSummary,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TargetUserId))
        {
            throw new ArgumentException("A valid target user id is required.", nameof(request.TargetUserId));
        }

        var target = await userRepository.GetByIdAsync(request.TargetUserId.Trim(), cancellationToken)
            ?? throw new KeyNotFoundException("The target user could not be found.");

        ValidateVerificationSignals(target, request);

        var (rawToken, expiresAtUtc) = await authService.StartDelegatedSessionAsync(
            actor,
            target,
            request.Reason,
            deviceSummary,
            cancellationToken);

        var response = new StartDelegatedSupportSessionResponse
        {
            SwitchedUserId = target.Id,
            SwitchedUserEmailMasked = MaskEmail(target.EmailNormalized),
            ExpiresAtUtc = expiresAtUtc.ToString("O"),
            Message = "Delegated support session started successfully.",
        };

        return (response, rawToken);
    }

    private static void ValidateVerificationSignals(UserAccount target, StartDelegatedSupportSessionRequest request)
    {
        var hasSignal = !string.IsNullOrWhiteSpace(request.ExpectedEmail)
            || !string.IsNullOrWhiteSpace(request.ExpectedFlatNumber)
            || !string.IsNullOrWhiteSpace(request.ExpectedDateOfBirth);

        if (!hasSignal)
        {
            throw new ArgumentException(
                "At least one verification signal is required: expectedEmail, expectedFlatNumber, or expectedDateOfBirth.",
                nameof(request));
        }

        if (!string.IsNullOrWhiteSpace(request.ExpectedEmail))
        {
            var expected = AuthService.NormalizeEmail(request.ExpectedEmail);
            if (!string.Equals(expected, target.EmailNormalized, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Target verification failed for expectedEmail.");
            }
        }

        if (!string.IsNullOrWhiteSpace(request.ExpectedFlatNumber))
        {
            var expected = request.ExpectedFlatNumber.Trim().ToUpperInvariant();
            var actual = (target.FlatNumberNormalized ?? string.Empty).Trim().ToUpperInvariant();
            if (!string.Equals(expected, actual, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Target verification failed for expectedFlatNumber.");
            }
        }

        if (!string.IsNullOrWhiteSpace(request.ExpectedDateOfBirth))
        {
            var expected = request.ExpectedDateOfBirth.Trim();
            var actual = (target.DateOfBirth ?? string.Empty).Trim();
            if (!string.Equals(expected, actual, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Target verification failed for expectedDateOfBirth.");
            }
        }
    }

    private static string MaskEmail(string normalizedEmail)
    {
        var parts = normalizedEmail.Split('@');
        if (parts.Length != 2 || parts[0].Length < 2)
        {
            return "***";
        }

        return $"{parts[0][0]}***{parts[0][^1]}@{parts[1].ToLowerInvariant()}";
    }
}
