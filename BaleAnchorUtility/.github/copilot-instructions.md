# BaleAnchor Utility Copilot Instructions

## Project mission

Build and evolve BaleAnchor Utility as a production-ready resident utility portal using React + TypeScript + ASP.NET Core, following the full specification in ProjectDouments/CLAUDE.md.

## Source of truth

- Treat ProjectDouments/CLAUDE.md as authoritative for product, architecture, security, and calculation rules.
- If existing code conflicts with CLAUDE.md, propose and implement changes toward CLAUDE.md unless explicitly instructed otherwise.
- Never copy third-party branding, legal text, IDs, assumptions, colors, or billing logic from template/demo files.

## Stack and architecture expectations

- Frontend: React, TypeScript strict mode, Vite, React Router, typed API client, schema-validated forms, accessible UI, PWA-ready.
- Backend: ASP.NET Core controller APIs, service/repository layering, DTO boundaries, structured logging, health checks, rate limiting, and centralized error handling.
- Persistence strategy: keep domain/application logic independent from storage mechanism; JSON storage is implementation detail, not domain model.

## Non-negotiable coding standards

- Prioritize correctness over convenience.
- Use decimal-safe approaches for money/rates/usage calculations; do not use binary floating-point for billing.
- Keep business logic deterministic, testable, and isolated from framework plumbing.
- Preserve auditability for financially relevant actions.
- Do not overwrite historical records for tariffs, calculations, statements, terms, or audit events.
- Protect tenancy isolation and never leak one resident's data to another.
- Enforce full validation at all trust boundaries and fail fast on invalid data.
- Implement clear, consistent, and actionable error messages for both API consumers and end users.

## Implementation style

- Prefer small cohesive services/functions with explicit inputs/outputs.
- Use meaningful names and avoid hidden side effects.
- Validate on server as authority; client validation is UX only.
- Keep a consistent error contract: stable error codes, clear messages, and field-level details for validation failures.
- Never return stack traces or sensitive implementation details to clients.
- Add or update tests with behavior changes (unit first, then integration when crossing boundaries).
- Keep commits and patches focused; avoid unrelated refactors.

## API error schema standard

- Use RFC 7807 ProblemDetails as the canonical error response format.
- Required fields: type, title, status, detail, instance.
- Required extensions: errorCode, traceId, timestampUtc.
- Validation failures must include errors as field -> string[] and return HTTP 400.
- Use consistent status mapping: 400 validation/input, 401 unauthenticated, 403 unauthorized, 404 not found, 409 conflict, 422 domain rule violation, 429 rate limit, 500 unexpected.
- Keep detail messages clear and actionable for users; keep sensitive diagnostics in logs only.

## Template integration guidance

- Use ProjectTemplate/skodash as visual/layout inspiration only.
- Extract reusable layout patterns and components into typed React components.
- Remove template-only demo dependencies and dead pages during migration.
- Keep performance and accessibility in scope while adapting template UI.

## Future-readiness

- Design APIs and models so storage can migrate later to SQL Server or MongoDB.
- Add extension points for reminders/notifications, statement generation, and admin operations without breaking contracts.
- Document key decisions in README or docs when introducing new architectural patterns.
