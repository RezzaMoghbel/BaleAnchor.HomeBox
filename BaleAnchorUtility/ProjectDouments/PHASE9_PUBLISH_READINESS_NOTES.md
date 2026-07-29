# Phase 9 Publish Readiness Notes

## Scope delivered

Phase 9 converts the project from implementation-complete to publish-rehearsal ready by introducing a complete operational documentation and gate set.

## Publish readiness assets added

- Production configuration matrix and environment mapping.
- Environment variables and secrets handling specification.
- Deployment runbook for server and client release builds.
- Backup and restore operational runbook for JSON persistence.
- Incident and support triage checklist.
- Seed-data production removal checklist.
- Go-live verification checklist.
- Publish gate script that performs safety checks and release rehearsal commands.

## Gate-driven approach

Phase 9 keeps the same gating discipline as Phase 8:

1. Run all existing quality gates.
2. Enforce production safety invariants.
3. Rehearse release artifact generation.
4. Verify required operational documents exist.
5. Restore `Database` from a pre-run snapshot so gate execution does not leave mutable JSON persistence changes in the working tree.

## Required entry-point

Run from repository root context:

- `ProjectDouments/phase9-publish-gates.ps1`

## Phase 9 exit criteria mapping

- Publish rehearsal can be executed without guesswork.
- Development-only seed shortcuts are explicitly excluded from production settings.
- Production secret-handling policy is explicit and validated.
- Deployment, backup/restore, incident handling, and go-live checks are documented and runnable.

## Final verification record (2026-07-29)

- Executed `ProjectDouments/phase9-publish-gates.ps1` from client workspace context.
- Phase 8 quality gates passed inside Phase 9 gate flow.
- Server tests: 94 passed, 0 failed.
- Client tests: 40 passed, 0 failed.
- Client production build passed.
- Release publish rehearsal passed and produced server artifacts under `artifacts/publish/server`.
- Post-run working tree remained free of generated `Database/Collections` runtime artifacts due to snapshot/restore gate behavior.

Known residual warnings (non-blocking):

- `Microsoft.OpenApi` advisory warning (NU1903).
- `react-router` and `react-router-dom` advisory warnings from JS SDK tooling.
