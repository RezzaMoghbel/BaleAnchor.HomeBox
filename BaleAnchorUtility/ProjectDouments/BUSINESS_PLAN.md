# Business Plan — Independent Utility Billing Transparency Platform

> **Working document:** Initial business plan based on the confirmed product scope  
> **Currency:** GBP (£)  
> **Initial deployment:** Approximately 300 residents  
> **Commercial status:** Pre-launch/pilot  
> **Important:** Pricing, legal structure, external market sizing, and financial forecasts require validation before use with investors, lenders, grant bodies, or commercial partners.

---

## 1. Executive summary

The Independent Utility Billing Transparency Platform is a mobile-first resident portal that lets tenants record meter readings, maintain tariff histories, calculate utility charges independently, record payments, and export transparent utility statements.

The initial use case is a residential development with approximately 300 potential users. Residents need a reliable way to understand charges relating to:

- Cold-water consumption.
- Hot-water volume.
- Apartment electricity.
- Electricity attributed to heating hot water.
- Daily standing charges.
- VAT.
- Tariff changes.
- Recorded payments.
- Outstanding or credit balances.

The platform does not replace an energy supplier, collect utility payments, or issue official supplier invoices. Its purpose is to create an independent, resident-controlled calculation and evidence layer.

The first release will use React TypeScript, ASP.NET Core, and JSON document storage. The architecture will permit later migration to SQL Server or MongoDB without rewriting the core business logic.

The recommended commercial strategy is to launch first as a controlled resident pilot, prove calculation accuracy and adoption, then decide whether the long-term paying customer should be residents, a resident association, a landlord, a managing agent, or a building operator.

---

## 2. Vision

To make complex communal utility billing understandable, reproducible, and auditable for ordinary residents.

The long-term ambition is to become a trusted transparency platform for residents and property operators in buildings where utility charges are calculated from sub-meters, communal services, changing tariffs, or non-standard heating arrangements.

---

## 3. Mission

The platform’s mission is to help residents:

- Keep an independent record of their meter readings.
- Understand exactly how charges are calculated.
- Identify estimates and tariff changes.
- Retain evidence throughout their tenancy.
- Compare calculated statements with separately received bills.
- Reduce confusion when raising billing questions.
- Avoid inheriting unexplained usage from a previous tenant.

---

## 4. The problem

Residents in multi-occupancy buildings may receive utility charges that are difficult to reproduce.

Typical difficulties include:

- Bills covering long or irregular periods.
- Missing or estimated meter readings.
- Unit rates changing during a period.
- Standing charges being difficult to trace.
- Hot-water volume requiring conversion into electricity.
- Residents not knowing which assumptions were used.
- Separate payments and usage totals without a clear balance.
- New tenants moving into flats with existing meter values.
- Residents storing readings across emails, photographs, spreadsheets, and messages.
- Limited access to a transparent calculation history.
- Difficulty preparing a clear evidence pack when raising a query.

Even when a final amount is correct, a lack of transparent working can damage trust.

The opportunity is therefore not only to calculate costs, but to provide continuity, explanation, evidence, and resident ownership of the data.

---

## 5. The solution

The platform creates a secure account for each approved resident and links it to a flat and tenancy.

Residents submit all three readings at the same time:

- Cold Water.
- Hot Water.
- Apartment Electricity.

The system then:

- Uses the previous reading automatically.
- Closes the current period.
- Opens the next period.
- Applies the appropriate dated water tariff.
- Applies the appropriate dated electricity tariff.
- Calculates hot-water heating electricity.
- Applies one water standing charge.
- Applies one electricity standing charge.
- Splits tariff periods when rates change.
- Labels proportional splits as estimated.
- Calculates VAT.
- Shows equations and substituted figures.
- Links one payment to the period.
- Updates the all-time balance.
- Produces an independent PDF statement.

Administrators can approve residents, manage tenancies, correct missing information, manage terms, and review complete audit logs.

---

## 6. Product principles

### 6.1 Transparency

Every total must be supported by:

- Meter readings.
- Dates.
- Days.
- Unit rates.
- Standing charges.
- VAT.
- Boiler assumptions.
- Equations.
- Calculation steps.

### 6.2 Independence

The system calculates from its own stored data. It does not reproduce another provider’s result or branding.

### 6.3 Continuity

Each reading closes one period and opens the next. The physical meter chain remains coherent across tenants.

### 6.4 Privacy

A resident can access only their own tenancy. New residents do not receive former residents’ personal data.

### 6.5 Auditability

Important changes are versioned and logged.

### 6.6 Simplicity

A resident should normally need to remember only:

- Their current reading date.
- Their current three meter readings.
- Whether their water or electricity rates changed.

---

## 7. Initial target users

### Primary users

- Residents in the initial development.
- Approximately 300 potential users.
- Residents who use mobile devices as their main access point.
- Residents who want independent records and calculations.
- Residents who need evidence for comparison or queries.

### Administrative users

- Project owner/Super Admin.
- Trusted resident/building administrators.
- Future support staff.

### Future user groups

Subject to validation:

- Other build-to-rent developments.
- Resident associations.
- Leaseholder groups.
- Managing agents.
- Landlords with communal utilities.
- Developments using heat networks.
- Consumer-support organisations.
- Property operators seeking a transparent resident-facing layer.

---

## 8. Value proposition

### For residents

- One place for readings, rates, calculations, payments, and statements.
- No need to remember previous meter values.
- Clear equations instead of unexplained totals.
- Independent evidence.
- Monthly reminders.
- Mobile/PWA access.
- Historical tenancy archive.
- Protection from unexplained previous-tenant consumption.
- Clear underpaid/in-credit status.

### For administrators

- Controlled approval.
- Complete account history.
- Structured tenant changes.
- Full audit logs.
- Clear correction workflows.
- Missing-reading management.
- Terms and declaration management.
- Searchable CMS.
- Reduced reliance on informal spreadsheets.

### For future building operators

- Better reading consistency.
- Reduced resident confusion.
- Clearer support evidence.
- Transparent void-period handling.
- A structured audit trail.
- Potential reduction in repetitive billing support.

---

## 9. Product scope

### Resident application

- Passwordless email OTP.
- Email, surname, and DOB account match.
- 24-hour sessions.
- T&C acceptance.
- Flat/tenancy onboarding.
- Opening readings.
- Combined reading submissions.
- Independent tariff histories.
- Boiler conversion.
- Calculation previews.
- Reading history.
- Payments.
- All-time balance.
- PDF exports.
- Email reminders.
- PWA push.
- Move-out flow.
- Historical flat averages.

### Admin/Super Admin CMS

- User creation.
- Resident approval.
- Admin creation.
- Roles/permissions.
- Flat management.
- Tenancy management.
- Reading corrections.
- Tariff management.
- Boiler assumptions.
- Payment management.
- Tenant-gap allocation.
- Statements.
- Terms/declarations.
- Public content.
- SEO.
- Notifications.
- Audit logs.
- Backups.
- Integrity checks.

### Public website

- Home.
- How it works.
- Calculation method.
- Help.
- Terms.
- Privacy.
- Cookies.
- Accessibility.
- Contact.
- 404 and error pages.
- SEO foundations.

---

## 10. Competitive positioning

The platform sits between:

- A resident spreadsheet.
- A generic meter-reading application.
- A property-management portal.
- A utility billing portal.
- A document archive.

Its differentiation is the combination of:

- Resident-controlled readings.
- Water and electricity tariff histories.
- Boiler-energy calculation.
- Transparent equations.
- Estimated tariff allocation labels.
- One continuous tenancy reading chain.
- Void-period allocation.
- Payment comparison.
- Independent PDF evidence.
- Full audit logs.
- Mobile-first design.

The product should not compete by claiming to be a supplier. It should compete on transparency, trust, continuity, and evidence.

---

## 11. Business model options

The first launch may operate as a pilot without an immediate commercial fee.

### Option A — Resident subscription

Residents pay a small monthly or annual fee.

Potential benefits:

- Direct alignment with resident needs.
- Independence from property operators.
- Predictable recurring revenue if adopted.

Potential challenges:

- Residents may resist another charge.
- Individual billing and support increase administration.
- Some residents may use the service only during disputes.

### Option B — Building licence

A landlord, resident association, managing agent, or operator pays one annual licence.

Potential benefits:

- Simpler procurement and invoicing.
- All residents receive access.
- Predictable revenue.
- Easier onboarding.

Potential challenges:

- The buyer may request influence over wording or data.
- Independence and resident privacy must be protected contractually.
- Sales cycles may be longer.

### Option C — Freemium

Free:

- Readings.
- Basic calculations.
- Latest-period dashboard.

Paid:

- Full archive.
- Advanced PDF packs.
- Multiple properties.
- Enhanced analytics.
- Admin collaboration.
- Data import/export.

### Option D — Setup and support fees

Charge separately for:

- Building setup.
- Tariff configuration.
- Resident onboarding.
- Historical data import.
- Training.
- Support.
- Custom branding.

### Option E — White-label SaaS

Offer the platform to additional developments under controlled branding.

The calculation engine and transparency standards should remain consistent.

### Recommended initial approach

1. Launch the first building as a controlled pilot.
2. Do not process utility payments.
3. Measure real support and infrastructure costs.
4. Identify the economic buyer.
5. Test a building-level licence before charging individual residents.
6. Keep optional setup/support fees for more complex deployments.

---

## 12. Go-to-market plan

### Phase 1 — Small pilot group

Recruit a limited number of residents.

Objectives:

- Confirm onboarding is understandable.
- Validate calculations manually.
- Test mobile forms.
- Identify confusing language.
- Test reminder timing.
- Test PDF usefulness.
- Confirm admin workload.

### Phase 2 — Full initial building

Expand to the approximately 300-user community.

Promotion methods:

- QR codes in communal spaces.
- Resident WhatsApp/community groups.
- Short live demonstrations.
- Simple posters.
- Resident guide.
- Reading-day reminders.
- Clear explanation of independent status.

Core message:

> Record three readings, understand every calculation, and keep independent evidence.

### Phase 3 — Case study

Collect anonymised evidence:

- Registration rate.
- Reading completion rate.
- Missed-reading reduction.
- PDF exports.
- Resident satisfaction.
- Calculation discrepancies identified.
- Time saved.
- Support patterns.

### Phase 4 — Additional buildings

Potential outreach:

- Resident associations.
- Build-to-rent communities.
- Managing agents.
- Landlords.
- Consumer groups.
- Property technology partners.

Lead with transparency and trust, not conflict with any named billing company.

---

## 13. Operations plan

### Initial operating model

The project owner acts as Super Admin.

Responsibilities:

- Resident verification.
- Flat conflict resolution.
- Missing move-out handling.
- Terms publication.
- Calculation-default management.
- Audit review.
- Backup review.
- Support.

### Support categories

- OTP/login.
- Approval status.
- Wrong flat.
- Reading correction.
- Tariff question.
- Payment record.
- PDF.
- Push/email reminder.
- Move-out.
- New-tenant opening reading.
- Privacy/data request.

Create internal runbooks and response templates.

### Data operations

- Scheduled JSON backups.
- Integrity checks.
- Corrupt-file quarantine.
- Controlled restore testing.
- Audit review.
- Disk-space monitoring.
- Export/migration tools.

### Service expectations

Before public launch, define:

- Support hours.
- Response targets.
- Maintenance windows.
- Incident communication.
- Backup recovery objective.
- System availability expectations.

Do not promise enterprise service levels without staffing and infrastructure.

---

## 14. Technology strategy

### Initial platform

- React TypeScript PWA.
- ASP.NET Core API.
- JSON document storage.
- SMTP.
- Web Push.
- PDF generation.
- CMS.
- Audit logging.

### Why JSON initially

Benefits:

- Fast initial setup.
- Easy inspection.
- Simple backup/export.
- Low infrastructure cost.

Risks:

- Concurrent write conflicts.
- Corruption.
- Limited querying.
- Operational complexity as data grows.

Mitigation:

- One document per file.
- Atomic writes.
- Locks.
- Optimistic concurrency.
- Rebuildable indexes.
- Backups.
- Integrity tooling.
- Repository abstraction.

### Migration path

1. Stabilise schemas.
2. Add schema versioning.
3. Build validated export.
4. Implement SQL Server or MongoDB repositories.
5. Run migration tests.
6. Import.
7. Reconcile counts and hashes.
8. Switch by configuration.
9. Retain read-only backup.

---

## 15. Security, privacy, and trust

Trust is a core commercial asset.

Required controls:

- Email OTP.
- Rate limiting.
- Secure cookie sessions.
- Terms versioning.
- Role-based access.
- Resident isolation.
- Audit logs.
- Protected JSON storage.
- Secure backups.
- Secret management.
- Redacted logs.
- Clear payment labels.
- Clear estimate labels.
- Independent statement disclaimers.
- No third-party branding.

Obtain legal/privacy review before launch for:

- Terms.
- Privacy Notice.
- Data retention.
- Data-subject requests.
- Admin access.
- Notifications.
- PDF wording.
- Cookies/analytics.
- Liability limitations.

---

## 16. Financial plan framework

A reliable forecast requires confirmed hosting, legal, support, and development costs.

### Cost categories

#### One-off development

- Product design.
- Frontend/backend development.
- Calculation validation.
- Testing.
- Accessibility.
- Security review.
- Legal drafting/review.
- Branding.

#### Recurring technology

- Hosting.
- Domain.
- Email delivery.
- Monitoring.
- Backup storage.
- PDF infrastructure.
- Push infrastructure.
- Error tracking.
- SSL/TLS-related services.

#### Operations

- Resident approval.
- Support.
- Data corrections.
- Incident response.
- Training.
- Legal/accounting.
- Insurance.
- Commercial sales.

### Revenue formulas

Building licence:

```text
Annual revenue
= buildings × annual licence
+ setup fees
+ support/customisation
```

Resident subscription:

```text
Monthly recurring revenue
= active paid residents × monthly fee
```

Break-even:

```text
Break-even active residents
= monthly fixed costs ÷ contribution per resident
```

Do not insert invented pricing before user research.

---

## 17. Key performance indicators

### Adoption

- Registrations.
- Approvals.
- Monthly active users.
- Occupied flats represented.
- Registration completion.

### Data quality

- Complete three-meter submissions.
- On-time reading rate.
- Estimated tariff splits.
- Admin corrections.
- Flat conflicts.
- Missing move-out readings.

### Engagement

- Dashboard visits.
- Reading submissions.
- PDF exports.
- Push opt-in.
- Reminder conversion.
- Statement views.

### Trust/usefulness

- Resident satisfaction.
- Improved understanding.
- Discrepancies identified.
- Support queries per user.
- Resolution time.

### Operations

- OTP success.
- Notification delivery.
- Backup success.
- Integrity failures.
- Calculation failures.
- PDF failures.
- Approval time.

### Commercial

- Cost per active resident.
- Support cost per building.
- Revenue per building.
- Renewal.
- Pilot-to-paid conversion.

---

## 18. Risks and mitigation

### Calculation error

Mitigation:

- Decimal arithmetic.
- Deterministic engine.
- Independent fixtures.
- Invariants.
- Versioned snapshots.
- Transparent assumptions.

### JSON corruption/concurrency

Mitigation:

- Atomic writes.
- Locks.
- Optimistic concurrency.
- Backups.
- Integrity checks.
- Database migration path.

### Statements mistaken for official invoices

Mitigation:

- “Independent Utility Calculation Statement”.
- Clear disclaimer.
- No supplier branding.
- Data-source labels.

### Personal-data exposure

Mitigation:

- Strict tenancy isolation.
- Role policies.
- Audit logs.
- Admin-context banner.
- Security tests.
- No PII in URLs.

### Low resident adoption

Mitigation:

- Mobile-first design.
- OTP login.
- Combined submission.
- Reminders.
- Demonstrations.
- Immediate dashboard value.

### High admin workload

Mitigation:

- CMS workflows.
- Search/filter.
- Automated reminders.
- Validation.
- Runbooks.
- Delegated Admin roles.

### Disputed tenant-gap allocation

Mitigation:

- Default landlord/void assignment.
- Reassignment only by Super Admin.
- Mandatory reason.
- Audit and statement annotation.

### Terms changes

Mitigation:

- Versioned immutable terms.
- Material-change flags.
- Reacceptance.
- Legal review.

### Incorrect default boiler assumptions

Mitigation:

- Configurable values.
- Explicit ΔT meaning.
- Versioning.
- Display equations.
- Do not hide assumptions.

---

## 19. Development and launch milestones

### Milestone 1 — Foundation

- Architecture.
- JSON layer.
- CI/testing.
- Design system.
- Security baseline.

### Milestone 2 — Onboarding

- OTP.
- Terms.
- Flat claim.
- Profile.
- Approval CMS.

### Milestone 3 — Reading chain

- Tenancies.
- Opening readings.
- Combined submissions.
- Validation.
- Move-out.
- Tenant gaps.

### Milestone 4 — Calculation engine

- Tariffs.
- Boiler conversion.
- Estimates.
- Snapshots.
- Tests.

### Milestone 5 — Resident portal

- Dashboard.
- History.
- Payments.
- Balance.
- Mobile UX.

### Milestone 6 — Administration

- CMS modules.
- Roles.
- Audit.
- Integrity tools.

### Milestone 7 — Notifications/PWA

- Email.
- Push.
- Scheduling.
- Offline.

### Milestone 8 — PDF

- Period/full statements.
- Snapshot integrity.
- Print testing.

### Milestone 9 — Public website/legal/SEO

- Public pages.
- Terms/privacy.
- 404/errors.
- SEO.

### Milestone 10 — Pilot

- Small group.
- Feedback.
- Reconciliation.
- Security/accessibility fixes.

### Milestone 11 — Full initial launch

- Approximately 300 users.
- Support process.
- Monitoring.
- Backups.
- Reporting.

### Milestone 12 — Commercial validation

- Case study.
- Pricing interviews.
- Additional-building pilots.
- Database decision.

---

## 20. Pilot success criteria

The pilot succeeds when:

- Registration/approval works without manual database editing.
- Reading chains remain valid.
- Calculations can be independently reproduced.
- Tariff splits are correct and labelled.
- Standing charges are not duplicated.
- PDFs reconcile.
- Admin actions are audited.
- No cross-tenant data leakage occurs.
- Backup/restore is tested.
- Mobile usability is acceptable.
- First-of-month concurrency is handled.
- Residents report improved understanding.

---

## 21. Ownership and governance decisions

Before commercial launch, confirm:

- Legal entity.
- Intellectual-property ownership.
- Data-controller/processor roles.
- Liability limits.
- Insurance needs.
- Governance of formula changes.
- Whether building operators can access resident data.
- Open-source/proprietary policy.
- Support obligations.
- Commercial contracting model.

---

## 22. Long-term roadmap

Potential later features:

- SQL Server or MongoDB.
- Multiple buildings.
- Additional occupants.
- Meter photographs.
- OCR-assisted readings with confirmation.
- Building comparisons.
- Anomaly detection.
- Support tickets.
- Bill upload and side-by-side comparison.
- Automated difference report.
- Meter-system APIs.
- Bank/payment verification.
- Multi-language support.
- White-label configuration.
- Native mobile wrapper.

Do not add these until the core calculation and trust model is stable.

---

## 23. Strategic recommendation

The first release should remain focused on one clear promise:

> Record your readings, understand every calculation, and keep independent evidence of your utility costs.

The initial approximately 300 residents provide a strong real-world pilot. The priority is not rapid feature expansion. The priority is:

- Correct calculations.
- Mobile adoption.
- Privacy.
- Auditability.
- Reliable reminders.
- Useful PDF statements.
- Safe administration.
- Measurable resident value.

Commercial expansion should follow evidence that the product reduces confusion and creates a trusted record, followed by a clear decision about who pays for the service.
