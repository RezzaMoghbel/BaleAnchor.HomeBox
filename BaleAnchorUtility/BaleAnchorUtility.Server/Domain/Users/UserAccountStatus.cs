namespace BaleAnchorUtility.Server.Domain.Users;

public enum UserAccountStatus
{
    EmailUnverified = 0,
    EmailVerified = 1,
    TermsPending = 2,
    ProfileIncomplete = 3,
    UtilitySetupIncomplete = 4,
    PendingApproval = 5,
    Active = 6,
    Rejected = 7,
    Suspended = 8,
    MovedOut = 9,
    Archived = 10,
}
