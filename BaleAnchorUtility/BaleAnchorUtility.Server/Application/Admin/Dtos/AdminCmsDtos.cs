namespace BaleAnchorUtility.Server.Application.Admin.Dtos;

public sealed class AdminUserSummaryItem
{
    public string UserId { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? FlatNumber { get; init; }
    public string UpdatedAtUtc { get; init; } = string.Empty;
}

public sealed class AdminUserSearchResponse
{
    public int Count { get; init; }
    public List<AdminUserSummaryItem> Items { get; init; } = [];
}

public sealed class AdminBillingContextResponse
{
    public string UserId { get; init; } = string.Empty;
    public string? LatestReadingDate { get; init; }
    public string? LatestColdWaterReading { get; init; }
    public string? LatestHotWaterReading { get; init; }
    public string? LatestElectricityReading { get; init; }
    public string? ActiveTariffEffectiveFromDate { get; init; }
    public string? WaterTariffPerUnit { get; init; }
    public string? WaterStandingChargePerDay { get; init; }
    public string? WaterVatPercent { get; init; }
    public string? ElectricityTariffPerUnit { get; init; }
    public string? ElectricityStandingChargePerDay { get; init; }
    public string? ElectricityVatPercent { get; init; }
    public string? LatestPaymentId { get; init; }
    public string? LatestPaymentAmount { get; init; }
    public string? LatestPaymentDate { get; init; }
    public string? LatestPaymentMethod { get; init; }
    public string? MoveInDate { get; init; }
    public string? BoilerKwhPerCubicMeter { get; init; }
    public string? BoilerEfficiencyPercent { get; init; }
}

public sealed class AdminTargetedTariffRequest
{
    public string EffectiveFromDate { get; init; } = string.Empty;
    public string WaterTariffPerUnit { get; init; } = string.Empty;
    public string WaterStandingChargePerDay { get; init; } = string.Empty;
    public string WaterVatPercent { get; init; } = string.Empty;
    public string ElectricityTariffPerUnit { get; init; } = string.Empty;
    public string ElectricityStandingChargePerDay { get; init; } = string.Empty;
    public string ElectricityVatPercent { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
}

public sealed class AdminTargetedBoilerAssumptionsRequest
{
    public string BoilerKwhPerCubicMeter { get; init; } = string.Empty;
    public string BoilerEfficiencyPercent { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
}

public sealed class AdminActionResultResponse
{
    public string UserId { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}

public sealed class HardDeleteUserRequest
{
    public string Reason { get; init; } = string.Empty;
    public string ConfirmationText { get; init; } = string.Empty;
}

public sealed class HardDeleteUserResponse
{
    public string UserId { get; init; } = string.Empty;
    public int DeletedRecordCount { get; init; }
    public string Message { get; init; } = string.Empty;
}

public sealed class PublishTermsVersionRequest
{
    public string VersionLabel { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string ContentMarkdown { get; init; } = string.Empty;
    public string EffectiveFromUtc { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
}

public sealed class TermsVersionSummaryItem
{
    public string VersionId { get; init; } = string.Empty;
    public string VersionLabel { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string EffectiveFromUtc { get; init; } = string.Empty;
    public string PublishedAtUtc { get; init; } = string.Empty;
    public bool IsActive { get; init; }
}

public sealed class TermsVersionListResponse
{
    public int Count { get; init; }
    public List<TermsVersionSummaryItem> Items { get; init; } = [];
}

public sealed class PublishTermsVersionResponse
{
    public string VersionId { get; init; } = string.Empty;
    public string VersionLabel { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
}

public sealed class TermsAcceptanceSummaryItem
{
    public string AcceptanceId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string TermsVersionId { get; init; } = string.Empty;
    public string AcceptedAtUtc { get; init; } = string.Empty;
    public string AcceptedFromIp { get; init; } = string.Empty;
}

public sealed class TermsAcceptanceListResponse
{
    public int Count { get; init; }
    public List<TermsAcceptanceSummaryItem> Items { get; init; } = [];
}

public sealed class AuditLogSummaryItem
{
    public string AuditId { get; init; } = string.Empty;
    public string ActorUserId { get; init; } = string.Empty;
    public string TargetUserId { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string Action { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string Metadata { get; init; } = string.Empty;
    public string CreatedAtUtc { get; init; } = string.Empty;
}

public sealed class AuditLogListResponse
{
    public int Count { get; init; }
    public List<AuditLogSummaryItem> Items { get; init; } = [];
}

public sealed class FlatSummaryItem
{
    public string FlatNumber { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public string UpdatedAtUtc { get; init; } = string.Empty;
}

public sealed class FlatListResponse
{
    public int Count { get; init; }
    public List<FlatSummaryItem> Items { get; init; } = [];
}

public sealed class UpsertFlatRequest
{
    public string FlatNumber { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public bool IsActive { get; init; } = true;
    public string Reason { get; init; } = string.Empty;
}

public sealed class TenancySummaryItem
{
    public string TenancyId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string FlatNumber { get; init; } = string.Empty;
    public string MoveInDate { get; init; } = string.Empty;
    public string? MoveOutDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public string UpdatedAtUtc { get; init; } = string.Empty;
}

public sealed class TenancyListResponse
{
    public int Count { get; init; }
    public List<TenancySummaryItem> Items { get; init; } = [];
}

public sealed class UpsertTenancyRequest
{
    public string? TenancyId { get; init; }
    public string UserId { get; init; } = string.Empty;
    public string FlatNumber { get; init; } = string.Empty;
    public string MoveInDate { get; init; } = string.Empty;
    public string? MoveOutDate { get; init; }
    public string? Status { get; init; }
    public string? Notes { get; init; }
    public string Reason { get; init; } = string.Empty;
}

public sealed class TenantGapAllocationSummaryItem
{
    public string AllocationId { get; init; } = string.Empty;
    public string FlatNumber { get; init; } = string.Empty;
    public string FromDate { get; init; } = string.Empty;
    public string ToDateExclusive { get; init; } = string.Empty;
    public string AssignedUserId { get; init; } = string.Empty;
    public string Amount { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string UpdatedAtUtc { get; init; } = string.Empty;
}

public sealed class TenantGapAllocationListResponse
{
    public int Count { get; init; }
    public List<TenantGapAllocationSummaryItem> Items { get; init; } = [];
}

public sealed class UpsertTenantGapAllocationRequest
{
    public string FlatNumber { get; init; } = string.Empty;
    public string FromDate { get; init; } = string.Empty;
    public string ToDateExclusive { get; init; } = string.Empty;
    public string AssignedUserId { get; init; } = string.Empty;
    public string Amount { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string? Status { get; init; }
}
