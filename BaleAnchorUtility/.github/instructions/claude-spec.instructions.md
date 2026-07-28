---
applyTo: "baleanchorutility.client/src/**/*.{ts,tsx,css},BaleAnchorUtility.Server/**/*.cs,BaleAnchorUtility.Server/**/*.json"
description: "Apply CLAUDE.md product constraints and senior maintainability standards when modifying core client and server files."
---

When editing matching files for BaleAnchor Utility:

- Align behavior with ProjectDouments/CLAUDE.md requirements.
- Keep all billing and usage computations authoritative on the server.
- Treat decimal correctness, reproducibility, and auditability as mandatory.
- Keep user-facing formatting in en-GB style and currency in GBP where relevant.
- Enforce strict validation at API boundaries and return clear typed error contracts.
- Validate all incoming/outgoing critical data paths, including DTOs, route/query values, domain rules, and persistence preconditions.
- Use consistent error payloads with stable codes, clear human-readable messages, and field-level validation details.
- Keep user-facing error text actionable and non-technical while preserving internal diagnostics in logs only.
- Standardize non-2xx responses on RFC 7807 ProblemDetails with fields: type, title, status, detail, instance.
- Include extensions in API errors: errorCode, traceId, timestampUtc; include errors (field -> string[]) for validation failures.
- Use explicit HTTP status mapping for known failures: 400, 401, 403, 404, 409, 422, 429, 500.
- Preserve historical records; do not destructively overwrite financial history.
- Keep tenant boundaries explicit in query/filter logic.
- Keep code modular and migration-friendly for future database replacement.
- Add or update tests for business logic and API behavior when requirements change.

Template adoption rules:

- Reuse structure and visual concepts from ProjectTemplate, not copy-paste monolithic HTML pages into production React views.
- Replace static template snippets with typed, reusable components.
- Remove demo/sample content and hard-coded identities from user-facing flows.

Implementation checklist (apply before considering work done):

- Requirements traceable to a CLAUDE.md section.
- Input and domain validation covered for changed paths.
- API error responses conform to ProblemDetails shape and status mapping.
- Sensitive/internal diagnostics remain in logs only.
- Tests added or updated for business and API behavior changes.
