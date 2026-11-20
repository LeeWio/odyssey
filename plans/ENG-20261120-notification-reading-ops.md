# ENG-20261120 — Notification, reading and release hardening

State: READY_FOR_REVIEW

## Scope

- Align the pinned Nexus OpenAPI provenance with the merged backend revision.
- Verify the canonical public destination for category-publication
  notifications and keep review destinations dashboard-only.
- Expand public performance auditing to the reading and moments surfaces while
  preserving the existing server-first rendering boundary.
- Make Lighthouse production audits deterministic by starting the standalone
  server with the existing article API fixture.

## Acceptance

- OpenAPI operation coverage remains complete against the merged Nexus
  artifact.
- Notification presentation tests cover canonical reader, external and
  authorized dashboard destinations.
- Preflight, production build, Lighthouse and focused notification/browser
  checks pass.

## Boundary

Production Flyway history reconciliation is an operationally gated activity.
This phase adds the read-only Docker validation command and runbook but does
not access, repair or rewrite the production database.

## Verification evidence

- `bun run preflight`: PASS — 87 test files and 455 tests passed.
- `bun run build`: PASS — 51 routes generated successfully.
- `OPENAPI_FILE=contracts/nexus-openapi.operations.json bun run api:coverage`:
  PASS — 313/313 operations matched at merged Nexus revision `a021656`.
- Generated Nexus OpenAPI projection comparison: PASS — 313 operations match
  the pinned contract projection exactly.
- `bunx playwright test tests/e2e/notification-lists.spec.ts --project=chromium`:
  PASS — 16 tests passed, including the canonical category-publication route.
- Lighthouse production collection/assertion: PASS — 12 runs across `/`,
  `/single`, `/single/design-foundation`, and `/moments`; all category
  thresholds passed. Temporary public upload was blocked by an external
  network timeout after local assertions completed.
- `node --check scripts/start-lighthouse-server.mjs`: PASS.
