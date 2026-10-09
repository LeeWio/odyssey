# Project Roadmap

## Scope And Baseline (2026-10-09)

This roadmap covers the two application repositories in the workspace:

- **Odyssey** is the Next.js frontend and owns the user experience, navigation,
  client-side state, and browser-level verification.
- **Nexus** is the Spring Boot backend and owns business rules, persistence,
  authorization, delivery, and API contracts.

Both repositories currently have substantial notification work in progress.
Odyssey already contains a notification center, category filters, six-category
delivery preferences, and support for structured notification context. Nexus
contains the corresponding preference, context, delivery-recovery, and admin
operations APIs. The next product increment should finish and verify this
cross-repository workflow before adding another notification family or a new
content module.

Quality checks run during planning on October 9, 2026:

- Odyssey `bun run preflight`: passed; 236 unit tests passed.
- Nexus `mvn test` in the Java 21 Docker image: 400 tests passed, 0 failed,
  2 skipped.
- Nexus `mvn spotless:check` in Docker: passed.
- Odyssey Footprints Playwright suite: 3 tests passed after correcting the
  expected entry count from 7 to 8 to include the newly added Huizhou record.

These checks validate the current workspace snapshot only. They do not prove
production migration compatibility or deployment readiness.

## Product Priorities

1. Keep existing production workflows reliable and make errors recoverable.
2. Complete one coherent notification workflow across Nexus and Odyssey.
3. Improve the discover-read-save-return loop for published writing.
4. Reduce operational risk in migrations, mail delivery, and release checks.
5. Add new product modules only after ownership, lifecycle, and cross-linking
   behavior are defined.

## Delivery Plan

### Phase 1: Stabilize The Current Change Set

- Keep the passing Footprints count assertion aligned with the actual fixture
  and retain the existing map, popup, and year-filter coverage.
- Re-run the Odyssey preflight and Footprints browser tests after any related
  frontend changes.
- Run Nexus tests and Spotless through the repository's Java 21 Docker image.
- Review the full notification diff as one change set: event identity,
  transactional boundaries, deduplication, retries, admin authorization, and
  migrations must agree.

**Exit criteria:** both repository quality gates pass; all changed migrations
are ordered and compatible with the intended deployment path; no notification
payload exposes recipient addresses, message bodies, credentials, or dedup keys
through admin delivery APIs.

### Phase 2: Complete The Notification Journey

- Verify each notification category and structured context from its Nexus
  business event through the Odyssey API schema and rendered notification row.
- Make supported destinations explicit. Public content should open its public
  route; moderation and report contexts should open the relevant authorized
  admin workflow. Do not infer permissions from a notification context ID.
- Connect preference editing to Nexus's effective six-category values,
  including inherited values, save confirmation, retry behavior, and session
  changes.
- Verify read, save, complete, reopen, delete, unread count, category filtering,
  and pagination against the actual backend contract.
- Keep external friend-link decision email separate from account notification
  preferences; document that boundary in the UI and operations notes.
- Verify email delivery recovery, manual retry auditing, and redaction using
  tests and non-production infrastructure only.

**Exit criteria:** a browser-level end-to-end path covers a real notification
response, category filtering, preference update, and correct destination or
moderation action; backend integration tests cover authorization, persistence,
and retry idempotency.

### Phase 3: Protect The Reading Loop

- Align article actions across discovery cards, article pages, saved items,
  reading history, and the personal library.
- Preserve reading position and useful return paths through navigation and
  authentication transitions.
- Audit core routes for loading, empty, failure, and permission states, with a
  retry or recovery action where appropriate.
- Add cross-page browser coverage for discover, read, save, revisit, and return.

**Exit criteria:** core journeys work at mobile and desktop sizes, and state
does not silently disappear on route changes or sign-in transitions.

### Phase 4: Operational Confidence

- Validate notification migrations against a production-like MySQL schema in
  Docker before rollout; exercise upgrade and documented recovery procedures.
- Define retention and cleanup for delivery history, retry audit records, and
  deduplication keys before introducing scheduled cleanup.
- Measure category-publication recipient volume and define a threshold for
  batching rather than expanding all recipients in one transaction.
- Keep frontend preflight and backend Docker test/format checks consistent in
  CI and deployment gates.
- Keep secrets out of images, logs, test artifacts, and committed files.

**Exit criteria:** an operator can determine delivery backlog and failure
state, retry an eligible delivery without exposing recipient data, and follow a
tested migration and rollback/recovery runbook.

### Phase 5: Product Expansion

- Complete or clearly label existing dashboard placeholders before implying
  persistence or live data.
- Expand module documentation for stock, timeline, profile, and editor where
  those areas are next changed.
- Consider notes or references only after documenting ownership, lifecycle,
  search, permissions, and links to articles and sources.

**Exit criteria:** a new module has a defined user problem, API/data owner,
permission model, empty/error states, focused tests, and a documented
connection to the existing content graph.

## Product Decisions Required Before UI Finalization

- Which notification actions should navigate directly to public content, and
  which should open an admin console? Confirm the intended destinations for
  comment review, post review, reports, friend-link applications, and user
  review.
- Are notification emails sent immediately for every opted-in category, or are
  any categories intended to be digest-only?
- Does “delete” permanently remove a notification, or should the primary
  cleanup action archive it while preserving history?
- Should a notification action mark the item read before navigation, and should
  an authorized moderation action automatically complete it only after the
  business mutation succeeds?

Until these decisions are confirmed, preserve the existing API behavior and
avoid silently changing delivery timing, deletion semantics, or moderation
state transitions.

## Release Gates

- Odyssey: `bun run preflight`, focused Playwright tests for changed journeys,
  and the full E2E suite before a frontend release.
- Nexus: Java 21 Docker `mvn test` and `mvn spotless:check`; run migration
  compatibility checks when schema changes are included.
- Cross-repository API changes: update both contract/schema validation and
  document deployment order and compatibility expectations.
- Production releases, commits, and pushes follow each repository's
  `AGENTS.md`; this local plan does not authorize deployment or remote changes.
