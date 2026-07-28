# CLAUDE.md — Independent Utility Billing & Resident Portal

> **Status:** Authoritative product and engineering specification  
> **Audience:** Claude Code and any engineer working on the project  
> **Target:** Production-ready React TypeScript + ASP.NET Core application for approximately 300 initial residents  
> **Locale:** `en-GB`  
> **Currency:** GBP (£)  
> **User-facing date format:** `dd/MM/yyyy`  
> **Machine/API date format:** ISO 8601  
> **Default time zone:** Europe/London  
> **Important:** Do not shorten, omit, or silently reinterpret any requirement in this file.

---

## 1. Product purpose

Build a complete resident utility portal that allows tenants to:

- Register with email OTP authentication.
- Be linked to one flat and one tenancy.
- Enter cold-water, hot-water, and apartment-electricity readings together.
- Maintain dated water and electricity tariffs.
- Calculate their own utility costs independently.
- See transparent equations and all calculation inputs.
- Record one payment/direct debit per calculation period.
- View period totals, all-time totals, payments, and balances.
- Export independent PDF statements.
- Receive email and PWA reminders.
- Retain access to their own historical tenancy after moving out.

The system is an independent resident calculation and record-keeping platform. It is not an energy supplier, payment processor, property manager, or official invoice issuer.

Any supplied third-party bill, screenshot, or PDF is reference material only. Do not copy third-party branding, legal text, identifiers, assumptions, colours, or calculation logic. The rules in this file are authoritative.

---

## 2. Non-negotiable principles

1. Correctness before convenience.
2. Every displayed monetary value must be reproducible from stored raw inputs.
3. Use decimal arithmetic for readings, rates, VAT, allocations, and money.
4. Never use binary floating-point for billing.
5. Every estimate must be clearly labelled.
6. Never overwrite historical tariffs, terms, statements, or audit records.
7. Never expose one tenant’s personal information to another.
8. Every financially relevant administrative change must be audited.
9. JSON is the first persistence provider, not the domain model.
10. Business logic must not depend directly on file I/O.
11. The system must be easy to migrate later to SQL Server or MongoDB.
12. The app must be mobile-first, responsive, accessible, and installable as a PWA.
13. Private resident/admin routes must never be indexed.
14. Server-side validation is authoritative.
15. This is a release-ready product, not a prototype.

---

## 3. Required stack and architecture

### Frontend

Use:

- React.
- TypeScript in strict mode.
- Vite.
- React Router.
- Typed API client.
- Server-state query/cache layer.
- Form library with schema validation.
- Accessible components.
- CSS variables/design tokens.
- PWA manifest and service worker.
- Web Push.
- Print/PDF-friendly views.

Do not make the browser the only source of calculation truth. The server calculation engine is authoritative. The client may show previews, but saved results must come from the backend.

### Backend

Use:

- ASP.NET Core Web API.
- Controller-based endpoints.
- Dependency injection.
- Domain services.
- Application services.
- Repository interfaces.
- JSON repository implementations.
- Background hosted services.
- SMTP abstraction.
- Web Push abstraction.
- PDF generation abstraction.
- Structured logging.
- Health checks.
- Rate limiting.
- Secure cookie sessions.
- Anti-forgery/CSRF protection.
- Centralised exception handling.
- OpenAPI in development or protected production environments.

### Suggested solution structure

```text
/
├── CLAUDE.md
├── README.md
├── Database/
│   ├── README.md
│   ├── Collections/
│   │   ├── Users/
│   │   ├── Flats/
│   │   ├── Tenancies/
│   │   ├── ReadingSubmissions/
│   │   ├── Tariffs/
│   │   ├── BoilerAssumptions/
│   │   ├── CalculationSnapshots/
│   │   ├── Payments/
│   │   ├── TenantGaps/
│   │   ├── TermsVersions/
│   │   ├── TermsAcceptances/
│   │   ├── Sessions/
│   │   ├── OtpChallenges/
│   │   ├── Notifications/
│   │   ├── PushSubscriptions/
│   │   ├── AuditLogs/
│   │   ├── CmsPages/
│   │   └── SystemSettings/
│   ├── Indexes/
│   ├── Locks/
│   ├── Backups/
│   ├── Corrupt/
│   └── Temp/
├── src/
│   ├── Client/
│   ├── Server/
│   ├── Domain/
│   ├── Application/
│   ├── Infrastructure/
│   └── Contracts/
├── tests/
│   ├── Unit/
│   ├── Integration/
│   ├── Contract/
│   ├── EndToEnd/
│   ├── Accessibility/
│   ├── Security/
│   └── Load/
└── docs/
    ├── architecture/
    ├── calculations/
    ├── api/
    ├── security/
    ├── operations/
    └── decisions/
```

Recommended projects:

```text
IndependentBilling.Domain
IndependentBilling.Application
IndependentBilling.Infrastructure
IndependentBilling.Api
IndependentBilling.Client
```

---

## 4. JSON persistence

### General design

All first-release data, including authentication data, is stored as JSON files under the root `Database` folder.

Use one document per record:

```text
Database/Collections/Users/{userId}.json
Database/Collections/ReadingSubmissions/{submissionId}.json
```

Do not use one huge array file for all users or all readings.

### Repository abstraction

Create interfaces such as:

```text
IUserRepository
IFlatRepository
ITenancyRepository
IReadingSubmissionRepository
ITariffRepository
IPaymentRepository
IAuditLogRepository
ITermsRepository
ISessionRepository
```

Domain and application layers depend on interfaces. JSON-specific classes remain inside Infrastructure.

IDs must be database-neutral strings, preferably GUIDs. Do not make file paths business identifiers.

### Atomicity and concurrency

Implement:

- Per-record or per-aggregate asynchronous locks.
- Optimistic concurrency with a `version` or `etag`.
- `createdAtUtc` and `updatedAtUtc`.
- Atomic save:
  1. Write to temp file.
  2. Flush.
  3. Validate deserialisation.
  4. Atomically replace/rename target.
- Backup before destructive replacement.
- Recovery of orphaned temp files.
- Corrupt-document quarantine.
- Startup integrity checks.
- Application-level transaction locks for operations updating several records.
- Protection against two simultaneous active tenancies for one flat.
- Protection against two simultaneous “latest” readings.

### Indexes

Maintain rebuildable indexes for:

- Normalised email → user ID.
- Normalised flat number → flat ID.
- Active tenancy by flat.
- Active tenancy by user.
- Readings by tenancy/date.
- Payments by tenancy/period/date.
- Active terms version.
- Active sessions.
- Pending registrations.
- Audit logs by actor, target, category, date.

Indexes are derived data and must be rebuildable.

### Backups

Provide:

- Scheduled snapshots.
- Retention settings.
- Manual Super Admin backup.
- Controlled restore.
- Restore dry run.
- Integrity report.
- Audit records for backup/restore.

### Sensitive data

Never store plaintext:

- OTP codes.
- Session tokens.
- SMTP passwords.
- Push private keys.
- Encryption master keys.

Store only secure hashes of OTPs and session tokens. Secrets belong in environment variables, development user secrets, or a deployment secret store.

Protect DOB and other sensitive fields. Logs must redact personal and authentication data.

---

## 5. Roles and permissions

### Resident

May:

- Complete onboarding.
- Accept required Terms & Conditions.
- View only their own tenancy data.
- Update mobile/WhatsApp number.
- Add combined meter submissions.
- Add independent water/electricity rate changes.
- Edit valid readings.
- Delete only the latest eligible reading.
- Add one payment per period.
- Edit payments.
- Delete only the latest eligible payment.
- View dashboard/history/calculations.
- Export statements.
- Manage notifications.
- Mark move-out reading.
- View anonymised flat averages where allowed.

Cannot directly edit:

- Email.
- Surname.
- DOB.
- Flat assignment.
- Approval status.
- Role.
- Audit logs.
- Previous-tenant private records.

### Admin

Uses a CMS-style interface with granular permissions for:

- Residents.
- Flats.
- Tenancies.
- Readings.
- Tariffs.
- Payments.
- Notifications.
- CMS content.
- Reports.

Admins cannot create/promote Admins or Super Admins unless explicitly permitted by a Super Admin.

### Super Admin

May:

- View all users, flats, tenancies, readings, tariffs, calculations, payments, balances, notifications, terms, and audit logs.
- Create residents.
- Create Admins.
- Create Super Admins through a highly protected workflow.
- Approve/reject accounts.
- Change roles/permissions.
- Correct locked identity fields with mandatory reason.
- Create/edit/close tenancies.
- Add missing or move-out readings.
- Resolve flat conflicts.
- Manage tariffs and boiler assumptions.
- Manage tenant-gap responsibility.
- Recalculate periods.
- Manage terms/declarations.
- Manage CMS/SEO content.
- Manage notification templates.
- Generate statements.
- Run integrity checks/backups.
- View immutable audits.

### Administrative account access

When an Admin/Super Admin opens a resident account:

- Show a permanent admin-context banner.
- Default to read-only.
- Require explicit edit mode.
- Require reasons for sensitive changes.
- Audit access and edits.
- Never make an admin action look like a resident action.

---

## 6. Registration and authentication

### Account states

Use an explicit state machine:

```text
EmailUnverified
EmailVerified
TermsPending
ProfileIncomplete
UtilitySetupIncomplete
PendingApproval
Active
Rejected
Suspended
MovedOut
Archived
```

### First registration

1. User enters email.
2. Normalise email.
3. Send SMTP OTP.
4. User enters OTP.
5. Verify OTP.
6. Require active Terms & Conditions acceptance.
7. Collect:
   - Surname.
   - DOB.
   - Flat number.
   - Mobile/WhatsApp number.
8. Normalise surname and flat number.
9. Check active/pending flat conflicts.
10. Collect:
    - Move-in date.
    - Opening cold-water reading.
    - Opening hot-water reading.
    - Opening electricity reading.
    - Initial water tariff.
    - Initial electricity tariff.
    - Boiler conversion assumptions.
11. Save pending onboarding.
12. Show a neutral message such as:
    - “Your account details are being checked.”
13. Do not reveal the private operational detail that the Super Admin may meet the resident.
14. Super Admin approves or rejects.
15. Approved account becomes active.

### Pending user

May use email OTP to:

- Review status.
- Complete allowed onboarding.
- Update mobile.
- Accept newer required terms.

No full resident dashboard before approval.

### Returning active login

1. Enter email, surname, DOB.
2. Case-insensitive surname match.
3. Exact DOB match.
4. Do not reveal which field failed.
5. Send email OTP.
6. Verify OTP.
7. Create server-side session.
8. Set Secure, HttpOnly, SameSite cookie.
9. Session lasts 24 hours.
10. Logout, suspension, or admin action may revoke it.

Email OTP is the proof of control. Surname and DOB are matching factors only.

### OTP controls

- Short configurable expiry.
- Single use.
- Hash only.
- Maximum attempts.
- Resend cooldown.
- Send limits.
- IP/account rate limiting.
- Generic responses against enumeration.
- Audit success/failure without OTP.
- Invalidate older challenges when policy requires.

### Sessions

- 24-hour absolute expiry.
- Secure cookie.
- HttpOnly.
- SameSite.
- Server-side JSON session.
- Hashed token.
- Last-used time.
- Device summary.
- Revocation timestamp.
- “Sign out all sessions”.
- CSRF protection.

### Profile fields

Residents cannot edit email, surname, DOB.

Residents may edit mobile/WhatsApp and notification preferences.

Admin changes to locked fields require permission, confirmation, reason, audit, and security review.

---

## 7. Terms, declarations, privacy, consent

### Terms presentation

Support:

- Full Terms & Conditions page.
- Downloadable terms file.
- Array of declaration text.
- Required and optional checkboxes.
- Final declaration.
- Mandatory “I agree” action.

Terms can change over time.

### Versioning

Store:

- Version ID.
- Version number.
- Title.
- Summary.
- Full text.
- Optional document reference.
- Declaration items.
- Published date.
- Effective date.
- Material-change flag.
- Reacceptance flag.
- Status: Draft, Published, Retired.
- Content hash.

Published versions are immutable. Changes require a new version.

### Acceptance record

Store immutably:

- User ID.
- Tenancy ID where relevant.
- Terms version ID.
- Content hash.
- Checkbox/declaration responses.
- Accepted time.
- IP summary where appropriate.
- User-agent/device summary.
- Acceptance method.
- Locale.
- Audit correlation ID.

Do not silently treat old acceptance as acceptance of every future version. Material changes may require reacceptance and may block private features until completed.

### Public legal/information pages

Create CMS-ready pages for:

- Terms & Conditions.
- Privacy Notice.
- Cookie Notice.
- Accessibility Statement.
- Contact.
- Calculation Method.
- Independent Statement Disclaimer.

Legal wording will be supplied/reviewed later. Use marked placeholders rather than invented definitive legal copy.

---

## 8. Flats and tenancies

### Flat numbers

Examples:

```text
1906
B206
```

Normalise by trimming and uppercasing letters. Preserve display value. Treat `b206`, `B206`, and ` B206 ` as the same flat.

Do not over-restrict future formats.

### One active tenancy per flat

A flat may have many historical tenancies but at most:

- One active tenancy.
- One pending registration claim unless resolved.

No second resident may register until move-out closure or Super Admin resolution.

### Privacy

Former tenants see only their own records.

New tenants see only their own records plus optional anonymised flat averages. They must not see former tenant identity, contact details, DOB, exact payments, or statements.

### Move-in date

The move-in date is the calculation start.

It may be edited while no later dependent data exists. Once later readings, tariffs, payments, or calculations depend on it, editing is restricted and must trigger validation, recalculation, and audit.

### Opening readings

Capture:

- Cold Water m³.
- Hot Water m³.
- Apartment Electricity kWh.

Opening readings are a special combined submission.

If a previous tenant has a move-out reading, new opening readings:

- May equal it.
- May be higher.
- May never be lower.

### Tenant gap

Example:

```text
Previous move-out electricity: 200 kWh
New move-in electricity:      205 kWh
Gap:                            5 kWh
```

Default:

- Assign gap to landlord/void period.
- Do not charge new tenant.
- Do not automatically charge previous tenant.

Super Admin may reassign gap to previous tenant, with reason, before/after values, recalculation, and audit.

Apply independently to cold water, hot water, electricity.

### Move-out

A combined submission can be marked:

```text
This is my move-out reading
```

It:

- Closes final period.
- Ends tenancy.
- Does not open a new period for that tenant.
- Stops future normal submissions.
- Makes flat eligible for new tenancy after checks.
- Remains visible to former tenant.

Super Admin can add a missing move-out reading and close tenancy.

---

## 9. Combined reading submissions

After onboarding, every submission contains all three meters together:

- Cold Water.
- Hot Water.
- Apartment Electricity.

Fields:

- ID.
- Tenancy ID.
- Reading date.
- Cold reading.
- Hot reading.
- Electricity reading.
- Notes.
- Optional water tariff change.
- Optional electricity tariff change.
- Move-out flag.
- Source.
- Timestamps.
- Version.

The user enters only current readings. The system automatically uses the previous submission as start date/readings.

Each new submission closes one period and opens the next unless it is move-out.

### Date validation

New:

```text
new date > previous date
new date <= today
```

Historical edit:

```text
previous date < edited date < next date
```

### Meter validation

New:

```text
new reading >= previous reading
```

Historical edit:

```text
previous reading <= edited reading <= next reading
```

Apply separately to all three meters.

Meter replacement/rollover must later use a separate audited workflow, not silent lower values.

### Recommended date

Default to the first day of the next calendar month.

Examples:

- 22 March → 1 April.
- 1 April → 1 May.

If default date was not actively confirmed, ask:

> “Your reading date is set to 01/05/2026. Is this the date on which you took these readings?”

### Period boundaries

Technical period:

```text
[startReadingDate, endReadingDate)
days = endDate - startDate
```

Example:

```text
Start: 01/01/2026
End:   01/02/2026
Days:  31
```

Display as:

```text
January 2026
01/01/2026 to 31/01/2026
```

Do not add one day.

### Form

Ask for:

- Reading date.
- Cold Water reading.
- Hot Water reading.
- Electricity reading.
- Optional notes.
- Water rates changed?
- Electricity rates changed?
- Move-out reading?

Show previous values read-only or expandable.

Show calculated preview before save.

### CRUD feedback

Create success:

> “Your meter reading was added successfully.”

Dirty cancel:

> “You have unsaved information. Leaving now will discard the details you entered.”

Update warning:

> “Updating this reading may recalculate this period and other affected periods.”

Delete success:

> “The latest reading was deleted successfully.”

Use toasts, inline validation, and confirmation dialogs.

### Deletion

Only the latest combined reading may be deleted.

- Opening only: editable/deletable.
- Opening + later reading:
  - Opening editable, not deletable.
  - Latest editable/deletable.
- Deleting latest makes previous latest.

A reading linked to a payment cannot be deleted until the linked eligible payment is deleted.

---

## 10. Tariffs

### Independent histories

Maintain separate histories for:

- Water.
- Electricity.
- Boiler assumptions.

A water change does not alter electricity. An electricity change does not alter water.

### Water tariff

- Effective date.
- Unit rate per m³.
- Standing/day.
- VAT.
- Note/source.
- Creator.
- Version/status.

Example:

```text
Unit:       £3.06820/m³
Standing:   £0.01900/day
VAT:        0.00%
```

### Electricity tariff

- Effective date.
- Unit rate per kWh.
- Standing/day.
- VAT.
- Note/source.
- Creator.
- Version/status.

Example:

```text
Unit:       £0.24796/kWh
Standing:   £0.72626/day
VAT:        5.00%
```

### Rate-change UI

Default:

> “Using your current rates.”

Controls:

```text
+ My water rates have changed
+ My electricity rates have changed
```

Fields:

- Unit rate.
- Standing/day.
- VAT.
- Effective date.
- Optional note/source.

Effective date:

- Not future.
- Not after submission date.
- Usually first of month.
- If not first, confirm.
- May equal reading date.
- May fall inside current period.

Never overwrite old tariffs.

### Change between readings

If tariff changes without a meter reading on that date:

1. Calculate total period usage.
2. Split by tariff-day segments.
3. Allocate usage proportionally by days.
4. Label as estimated.
5. Ensure segment usage sums exactly to total.
6. Apply each segment’s unit and standing rates.
7. Explain method in UI/PDF.

Formula:

```text
Estimated segment usage
= total period usage × (segment days / total period days)
```

Use full precision. Put rounding residue in final segment.

Boundary convention:

```text
[segmentStart, segmentEnd)
```

A tariff effective on the end reading date applies to the next period.

Label:

> “Estimated tariff allocation — no meter reading was available on the tariff-change date.”

If a reading exists on the tariff-change date, split is exact.

### Overrides

Manual arbitrary tariff override should normally be Admin/Super Admin only, require a reason, display warning, audit, and preserve automatic resolution for comparison.

---

## 11. Calculation engine

Create a pure deterministic domain calculation service.

Inputs:

- Previous/current readings.
- Dates.
- Dated tariffs.
- Boiler assumptions.
- Gap assignments.
- Precision/rounding policy.

Outputs:

- Component lines.
- Tariff segments.
- Estimate flags.
- Equations.
- Human-readable steps.
- Totals.
- Diagnostics.
- Calculation version.
- Input hash.

Persist immutable calculation snapshots for statements and auditing.

### Decimal precision

Use .NET `decimal`.

Preserve at least:

- Water readings: 3 decimals.
- Electricity readings: 3 decimals.
- Unit rates: 5 decimals.
- Standing rates: 5 decimals.
- VAT: adequate decimal precision.
- Boiler kWh: high precision.
- Display money: 2 decimals.

Do not round each multiplication too early. Define one central rounding policy and test it.

### Consumption

```text
Cold used = cold end − cold start
Hot used = hot end − hot start
Apartment electricity used = electricity end − electricity start
```

### Standing-charge rules

Water standing charge appears once only, under Cold Water.

Hot-water volume has no water standing charge.

Electricity standing charge appears once only, under Apartment Electricity.

Boiler electricity has no electricity standing charge.

### Cold Water

```text
subtotal = (cold m³ × water unit rate) + (days × water standing/day)
VAT = subtotal × water VAT rate
total = subtotal + VAT
```

### Hot-water volume

```text
subtotal = hot m³ × water unit rate
VAT = subtotal × water VAT rate
total = subtotal + VAT
```

Standing is zero.

### Boiler conversion

```text
Boiler kWh
= Hot Water m³
× Temperature increase ΔT °C
× Specific heat capacity kJ/kg°C
× Water density kg/m³
÷ Conversion factor kJ/kWh
```

Defaults/configuration:

```text
Heat capacity:       4.186
Density:             1000
Conversion factor:   3600
Temperature increase: configurable and explicit
```

`3600` converts kJ to kWh.

Do not ambiguously call a target temperature “temperature increase”. Support either:

- Direct ΔT.
- Target temperature minus inlet temperature.

Simple onboarding may prefill a building/default ΔT. Advanced details expose the meaning.

Assumptions are dated, versioned, configurable, displayed, included in PDF, and audited.

### Boiler cost

```text
subtotal = boiler kWh × electricity unit rate
VAT = subtotal × electricity VAT rate
total = subtotal + VAT
```

Standing is zero.

If electricity tariff changes inside the period without a boundary reading, proportionally estimate the derived boiler allocation by days and label it.

### Apartment Electricity

```text
subtotal = (apartment kWh × electricity unit rate)
         + (days × electricity standing/day)
VAT = subtotal × electricity VAT rate
total = subtotal + VAT
```

### Combined totals

```text
Total Water Usage = Cold m³ + Hot m³
Total Water Cost = Cold total + Hot-volume total

Total Electricity Usage = Apartment kWh + Boiler kWh
Total Electricity Cost = Apartment total + Boiler total

Period Total = Total Water Cost + Total Electricity Cost
```

Do not include boiler in Water Cost.

### Integrity rules

```text
end − start = total meter consumption
sum tariff segment usage = total consumption
sum usage lines = usage subtotal
sum standing lines = standing total
subtotal + VAT = total
water = cold + hot
electricity = apartment + boiler
overall = water + electricity
```

Do not save a result that fails invariants.

### Calculation version

Store:

- Engine version.
- Input IDs/versions.
- Input hash.
- Generated date.
- Estimate/override flags.
- Rounding version.
- Equations/lines.

---

## 12. Payments/direct debits

Each combined period may have at most one payment.

Fields:

- ID.
- Tenancy.
- Period.
- Amount.
- Payment date.
- Method/type.
- Reference.
- Notes.
- Source.
- Verification status.
- Timestamps/version.

Unless independently verified, label:

> “Payment recorded by resident”

### Payment CRUD

- Create one per period.
- Edit valid records.
- Delete only latest payment in tenancy history.
- Earlier payments editable, not deletable.
- Deleting latest may make previous eligible.
- Audit all actions.
- Provide confirmations/toasts.

### Reading dependency

A paid period’s defining reading cannot be deleted until linked payment is deleted.

### Balance

```text
Balance = Total calculated charges − Total recorded payments
```

Display:

- Positive: Amount outstanding / Underpaid.
- Negative: Credit balance / In credit.
- Zero: Paid in full.

Avoid ambiguous signed figures without status text.

---

## 13. Resident dashboard

### All-time summary

Show near top:

```text
Total Paid
£1,434.49

Total Calculated Charges
£1,745.06

Amount Outstanding
£310.57

Status
Underpaid
```

Use “Total Calculated Charges” or “Total Usage Cost”, not “Total Usage” for money.

### Latest/selected period

Example:

```text
September 2026
01/09/2026 to 30/09/2026

Water Usage: 34.70 m³                    £106.45
Cold:       20.96 m³                     £68.20
Hot:        13.75 m³                     £38.25

Electricity Usage: 5,039.08 kWh        £1,325.80
Apartment:        2,500.08 kWh           £680.40
Boiler:           2,539.00 kWh           £645.40

Period Total:                             £1,432.25
Payment recorded:                          £100.00
Period difference:                       £1,332.25
```

Hot price in Water is water-volume cost only. Boiler appears in Electricity only.

### Actions

- Add reading.
- View all readings.
- Record/view payment.
- Export statement.
- View details.
- Manage notifications.
- View profile.
- View terms/privacy.
- Move-out reading.

### Next-reading card

```text
Next recommended reading
01/10/2026

We will remind you 7 days before, 2 days before, and on the day.
```

### Pending dashboard

Show verification status, flat, editable mobile, onboarding completeness, terms status, support route. Do not expose private approval method.

---

## 14. Readings history

### Desktop

Newest first, grouped by period.

Columns may include:

- Period.
- Utility/component.
- Unit rate.
- Standing.
- VAT.
- Start.
- End.
- Units.
- Days.
- Usage cost.
- Standing total.
- VAT.
- Total.
- Estimate status.
- Actions.

### Mobile

Use cards/accordions instead of wide tables.

Example:

```text
April 2026
Period total: £116.16
Payment: £100.00

Electricity: £70.26
Cold Water:  £27.26
Hot Water:   £18.64
```

Expanded details show readings, tariffs, equations, boiler conversion, estimates.

### Actions

- View always.
- Edit where valid.
- Delete only latest eligible combined submission.
- Explain disabled actions accessibly.

### Filters

- Page size.
- Pagination.
- Date range.
- Component.
- Estimate/exact.
- Payment status.
- Export.

---

## 15. Detailed calculation view

Show:

- Start/end dates.
- Period label.
- Days.
- Start/end readings.
- Units.
- Tariff segments.
- Rates.
- VAT.
- Estimate labels.
- Usage cost.
- Standing total.
- Subtotal.
- VAT amount.
- Total.
- Equation.
- Substituted calculation.
- Boiler assumptions.
- Notes.
- Source.
- Last update.
- Support/reference ID.

Every value must be reproducible.

---

## 16. Reminders, SMTP, PWA

### Schedule

For recommended reading date:

- 7 days before.
- 2 days before.
- On the day.

Channels:

- Email.
- PWA push if subscribed.

Cancel future reminders after submission.

### Backend jobs

Implement:

- Persistent JSON jobs.
- Background hosted service.
- Idempotency.
- Retries/backoff.
- Dead-letter/error status.
- Attempts/history.
- Template version.
- User preferences.
- Time-zone scheduling.

### SMTP

Use `IEmailSender`.

Credentials supplied later. Never commit secrets. Support development email capture.

### Web Push

Implement:

- Service worker.
- Push registration.
- Secret-managed VAPID keys.
- Permission handling.
- Subscription removal.
- Test notification.
- Deep link to reading form.

No duplicate reminders.

---

## 17. PDF statements

Generate independent PDF statements only from this system’s data.

Must not:

- Mention or imitate another company.
- Copy third-party branding.
- Claim to be an official supplier invoice.
- Copy unsupported legal text.

### Export options

- Selected period.
- Date range.
- Full tenancy.
- Current balance.

### Required content

- “Independent Utility Calculation Statement”.
- Resident display name.
- Flat.
- Tenancy dates.
- Generated date.
- Statement period.
- Unique reference.
- Clear disclaimer.
- Total charges.
- Total recorded payments.
- Balance/status.
- Payment history.
- Service summary:
  - Cold Water.
  - Hot Water Volume.
  - Apartment Electricity.
  - Boiler Electricity.
  - Combined Water.
  - Combined Electricity.
  - Overall total.
- Tariff periods.
- Readings/dates.
- Estimated allocation labels.
- Days.
- Rates.
- Standing.
- VAT.
- Equations.
- Boiler assumptions.
- Notes.
- Engine/version.
- Page numbers.

### Snapshot integrity

On generation:

- Create immutable statement snapshot.
- Store calculation snapshot IDs.
- Store statement hash.
- Preserve reproducibility.
- New data changes produce a new statement version/reference.
- Do not silently mutate old statements.

Use replaceable `IPdfStatementGenerator`.

---

## 18. Flat historical averages

Current residents may see anonymised flat averages.

Never reveal former tenant identity or exact records.

Possible metrics:

- Average monthly cold water.
- Average monthly hot water.
- Average apartment electricity.
- Average boiler electricity.
- Typical calculated monthly cost, clearly labelled.

Exclude void gaps unless explicitly included and labelled. Admin may disable averages where privacy/sample size is unsuitable.

---

## 19. Admin/Super Admin CMS

Must feel like a complete CMS:

- Dashboard.
- Search.
- Filters.
- Sorting.
- Pagination.
- Status badges.
- Responsive tables/cards.
- Forms.
- Confirmation dialogs.
- Toasts.
- Audit links.
- Role-aware navigation.
- Keyboard accessibility.

### Modules

1. Overview.
2. Residents.
3. Admin users.
4. Flats.
5. Tenancies.
6. Pending approvals.
7. Readings.
8. Tariffs.
9. Boiler assumptions.
10. Calculations.
11. Tenant gaps.
12. Payments.
13. Balances.
14. Notifications.
15. Push subscriptions.
16. Terms/declarations.
17. Terms acceptances.
18. CMS/public pages.
19. SEO.
20. Statements.
21. Audit.
22. System settings.
23. Backup/integrity.
24. Operational errors.

### Approval screen

Show:

- User.
- Flat.
- Mobile.
- Submission date.
- Onboarding completeness.
- Terms acceptance.
- Flat conflict.
- Reading continuity.
- Approve/reject.
- Notes.
- Rejection reason.
- Audit link.

### Audit viewer

Support date, actor, role, action, entity, correlation ID, device/IP summary, before/after diff, export.

Audit records are append-only.

---

## 20. Audit logs

Audit at minimum:

- Registration.
- Email verification.
- Login/session.
- Terms acceptance/publication.
- Profile/mobile changes.
- Approval/rejection/suspension.
- Role/permission changes.
- Flat/tenancy changes.
- Reading CRUD.
- Tariff changes.
- Calculation/recalculation/failure.
- Payment CRUD.
- Gap creation/reassignment.
- Admin account access.
- PDF generation.
- Reminder scheduling/sending/failure.
- CMS/SEO changes.
- Backup/restore/integrity.
- Security setting changes.

Record:

- Audit ID.
- UTC timestamp.
- Actor ID/role.
- Admin context.
- Action.
- Category.
- Target type/ID.
- Redacted before/after.
- Reason.
- Correlation/request ID.
- IP summary.
- Device summary.
- Success/failure.
- Error code.

Never log OTP plaintext, session plaintext, SMTP secrets, full sensitive bodies, or unredacted DOB in ordinary logs.

---

## 21. Public site, SEO, errors

### Public routes

```text
/
/how-it-works
/calculation-method
/help
/terms
/privacy
/cookies
/accessibility
/contact
/login
/register
```

### Private routes

```text
/app/*
/admin/*
/super-admin/*
```

Private routes:

- Require auth/authorisation.
- Use `noindex, nofollow`.
- Use safe cache controls.
- Contain no personal data in URLs.

### SEO

Public pages require:

- Unique title.
- Meta description.
- Canonical URL.
- Open Graph/social metadata.
- Semantic headings.
- Descriptive links.
- Sitemap.
- Robots.
- Accurate structured data only.
- Fast loading.
- Accessible images.
- Static/pre-rendered public pages where practical.

### Error pages

Create:

- 404.
- 403.
- 500/general error.
- Offline PWA.
- Session expired.
- Maintenance.

404 must have correct status, clear message, home/login links, and no stack trace.

---

## 22. Accessibility and responsive design

Target WCAG 2.2 AA practices.

Requirements:

- Mobile-first.
- Touch-friendly controls.
- Keyboard navigation.
- Visible focus.
- Screen-reader labels.
- Error summaries and field errors.
- Colour not sole status indicator.
- Good contrast.
- Reduced motion.
- Cards instead of unusable mobile tables.
- 200% zoom.
- Accessible modals/toasts.
- Focus restoration.
- Text/table alternatives for charts.
- PDF meaning not dependent on colour.

---

## 23. Security

Implement:

- HTTPS production.
- HSTS.
- Secure cookies.
- CSRF.
- Rate limiting.
- Input validation.
- Output encoding.
- CSP.
- Clickjacking protection.
- Referrer policy.
- Permissions policy.
- Restricted CORS.
- File-upload controls.
- Strong role checks.
- Confirmation/reauthentication for high-risk operations.
- Generic auth errors.
- Session revocation.
- Secret management.
- Dependency scanning.
- Security-header tests.
- No PII in URLs.
- No PII in analytics by default.
- Restricted backup access.

JSON storage does not reduce security requirements.

---

## 24. API design

Use `/api/v1`.

Groups:

```text
/auth
/registration
/terms
/profile
/flats
/tenancies
/readings
/tariffs
/calculations
/payments
/dashboard
/statements
/notifications
/admin
/audit
/cms
/system
```

Examples:

```text
POST   /api/v1/auth/request-code
POST   /api/v1/auth/verify-code
POST   /api/v1/auth/logout
GET    /api/v1/auth/session

GET    /api/v1/terms/active
POST   /api/v1/terms/{versionId}/accept

GET    /api/v1/profile
PATCH  /api/v1/profile/mobile

POST   /api/v1/registration/onboarding
GET    /api/v1/registration/status

GET    /api/v1/readings
POST   /api/v1/readings/preview
POST   /api/v1/readings
GET    /api/v1/readings/{id}
PUT    /api/v1/readings/{id}
DELETE /api/v1/readings/{id}

GET    /api/v1/calculations/{periodId}
GET    /api/v1/dashboard

POST   /api/v1/periods/{periodId}/payment
PUT    /api/v1/payments/{id}
DELETE /api/v1/payments/{id}

POST   /api/v1/statements/generate
GET    /api/v1/statements/{id}

POST   /api/v1/push/subscriptions
DELETE /api/v1/push/subscriptions/{id}

GET    /api/v1/admin/users
POST   /api/v1/admin/users
POST   /api/v1/admin/users/{id}/approve
POST   /api/v1/admin/users/{id}/reject
```

Use DTOs, never persistence documents directly.

Mutating endpoints need validation problem details, concurrency version, correlation ID, policy authorisation, and audit integration.

---

## 25. Core entities

At minimum:

### User

- ID.
- Email display/normalised.
- Surname display/normalised.
- Protected DOB.
- Mobile.
- Role.
- Status.
- Approval metadata.
- Preferences.
- Timestamps/version.

### Flat

- ID.
- Display/normalised number.
- Status.
- Timestamps/version.

### Tenancy

- ID.
- User.
- Flat.
- Move-in/out.
- Status.
- Opening/move-out submission IDs.
- Approval metadata.
- Timestamps/version.

### ReadingSubmission

- ID.
- Tenancy.
- Date.
- Cold/Hot/Electric readings.
- Type.
- Move-out flag.
- Notes.
- Source.
- Tariff change references.
- Timestamps/version.

### Tariff

- ID.
- Scope.
- Utility family.
- Effective date.
- Unit rate.
- Standing/day.
- VAT.
- Source/note.
- Status.
- Creator.
- Timestamps/version.

### BoilerAssumptionVersion

- ID.
- Effective date.
- ΔT or target/inlet.
- Heat capacity.
- Density.
- Conversion factor.
- Notes/source.
- Timestamps/version.

### CalculationSnapshot

- ID.
- Tenancy/period.
- Inputs.
- Segments.
- Totals.
- Flags.
- Engine/rounding version.
- Input hash.
- Timestamp.

### Payment

- ID.
- Tenancy.
- Period.
- Amount/date/type/reference/notes.
- Source.
- Verification.
- Timestamps/version.

### TenantGap

- ID.
- Flat.
- Previous/next tenancy.
- Date range.
- Cold/Hot/Electric gaps.
- Responsibility/reassignment.
- Reason.
- Effects.
- Timestamps/version.

### TermsVersion / TermsAcceptance

As defined above.

### AuditLog

Append-only.

---

## 26. State transitions and deletion

Model transitions explicitly:

```text
PendingApproval -> Active
PendingApproval -> Rejected
Active -> MovedOut
Active -> Suspended
Suspended -> Active
```

High-risk transitions require confirmation and reason.

Prefer archival/soft status for users, flats, tenancies, terms, statements.

Tail-only hard deletion applies only to eligible latest readings/payments.

Published terms and audit logs are never edited/deleted.

---

## 27. Testing

### Unit

Test:

- Date differences.
- Monotonic readings.
- Interior edit bounds.
- Tail deletion.
- Payment dependency.
- Water/electricity/boiler formulas.
- VAT.
- Single standing-charge rule.
- Tariff boundaries.
- Proportional estimate.
- Rounding residue.
- Multi-tariff periods.
- Tenant gaps.
- Balance.
- Terms state.
- Permissions.
- Normalisation.

### Invariant/property tests

Assert:

- No negative consumption.
- Segment sum equals total.
- Totals reconcile.
- Standing once per family.
- Deterministic results.
- Same inputs → same hash.

### Integration

Test:

- Atomic JSON writes.
- Concurrent submissions.
- Concurrent flat claims.
- OTP/session.
- Terms acceptance.
- Approval.
- Reminders.
- PDF snapshots.
- Audit.
- Corruption recovery.

### E2E

Test:

- Registration.
- Pending status.
- Approval.
- Login.
- Onboarding.
- Create/edit/delete reading.
- Rate changes.
- Estimated split.
- Payment.
- PDF.
- Move-out/new tenant.
- Admin correction.
- Terms reacceptance.
- Mobile.
- 404/offline.

### Accessibility/security/load

Test keyboard, screen reader, focus, CSRF, authorisation bypass, OTP brute-force, enumeration, XSS, path traversal, PII leakage, and approximately 300-user peak behaviour.

---

## 28. Operations and observability

Implement:

- Structured logs.
- Correlation IDs.
- Health/readiness.
- JSON integrity health.
- Background-job health.
- SMTP/push status.
- Error tracking abstraction.
- Failed notification queue.
- Disk-space warning.
- Backup age warning.
- Operational admin dashboard.

Do not log sensitive payloads.

---

## 29. Release checklist

Before launch:

- Legal text approved.
- Privacy/retention decisions approved.
- SMTP configured.
- Domain/TLS configured.
- PWA complete.
- Push keys configured.
- Backup/restore tested.
- Calculation fixtures checked independently.
- Accessibility/security/load tests passed.
- Error pages complete.
- SEO complete.
- Private indexing blocked.
- Roles reviewed.
- Super Admin bootstrap documented.
- Incident/rollback runbook written.
- JSON integrity tooling verified.
- PDF disclaimer approved.
- Terms published.
- Monitoring configured.

---

## 30. Implementation phases

### Phase 0 — Foundation

Architecture, JSON safety, CI, design system, tests, security headers.

### Phase 1 — Identity/onboarding

OTP, sessions, terms, profile, flat claim, approval CMS.

### Phase 2 — Tenancies/readings

Flats, tenancies, opening readings, combined submissions, move-out, gaps.

### Phase 3 — Tariffs/calculations

Water/electric tariffs, boiler assumptions, proportional estimates, snapshots.

### Phase 4 — Resident dashboard

Summary, history, payments, balances, mobile UX.

### Phase 5 — Admin CMS/audit

Modules, roles, admin context, audit viewer, integrity tools.

### Phase 6 — Notifications/PWA

Manifest, service worker, push, SMTP reminders.

### Phase 7 — PDF

Templates, snapshots, period/full statements.

### Phase 8 — Public/SEO/legal

Public pages, CMS, metadata, Terms/privacy/accessibility, 404/403/500/offline.

### Phase 9 — Hardening/release

Security, accessibility, concurrency, load, backup, deployment, operations.

Tests accompany every phase.

---

## 31. Definition of done

A feature is complete only when:

- Domain rule exists.
- API validation exists.
- UI validation exists.
- Authorisation exists.
- Audit event exists where relevant.
- Success/error UX exists.
- Mobile layout exists.
- Accessibility checked.
- Unit tests added.
- Integration/E2E tests added where relevant.
- Documentation updated.
- No direct JSON access outside Infrastructure.
- No sensitive logging.
- Migration-neutral repository boundary preserved.

---

## 32. Decisions still to be supplied

Use configurable placeholders and do not block the architecture:

- Final brand/product name.
- SMTP details.
- Approved Terms wording.
- Privacy Notice.
- PDF disclaimer.
- Final Admin permission matrix.
- Final default boiler ΔT/target/inlet assumptions.
- Deployment host/domain.
- Support contacts.
- Data retention.
- Analytics.
- Final PDF engine after deployment/licensing review.

Never invent legal, commercial, or scientific assumptions silently.

---

## 33. Claude Code rules

1. Read this entire file first.
2. Treat it as the primary source of truth.
3. Maintain a task plan with dependencies and acceptance criteria.
4. Do not implement UI-only mock logic where server logic is required.
5. Do not bypass repositories.
6. Do not use floating-point billing.
7. Do not weaken validation to pass tests.
8. Do not copy third-party branding or billing logic.
9. Add tests with every rule.
10. Separate public/private concerns.
11. Preserve British formatting.
12. Ask only for genuinely blocking decisions.
13. Record major architecture decisions.
14. Keep the app runnable after each phase.
15. Maintain export/migration documentation for SQL Server and MongoDB.
16. Before completion, produce:
    - Feature checklist.
    - Test report.
    - Known limitations.
    - Security checklist.
    - Release checklist.
    - JSON-to-SQL/Mongo migration notes.

---

## 34. Final standard

Build a complete product that is:

- Trustworthy.
- Transparent.
- Mathematically reproducible.
- Secure.
- Auditable.
- Mobile-friendly.
- Accessible.
- Maintainable.
- Ready for future database migration.
- Suitable for approximately 300 initial users.
- Expandable to more buildings without rewriting the core.
