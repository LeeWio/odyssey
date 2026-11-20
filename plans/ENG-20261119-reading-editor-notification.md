# ENG-20261119 — Reading, editing and notification journeys

State: READY_FOR_REVIEW

## Discovery and authorization

Odyssey base: `7618f1e`; Nexus base: `d0a4772`. Both worktrees were clean. Target: `main`; implementation branch: `feature/reading-editor-notification` in each repository. The user authorizes local development, commits, pushes, PR delivery and deployment. This overrides the server-only Git instructions. Backend builds and tests run in Docker. Keep all existing review, CI and environment gates.

## Requirements and acceptance

- P1: pending reading checkpoints are isolated by account and article and survive reloads. A late acknowledgement cannot delete a newer checkpoint. Newer reading positions may move backwards, while highest progress and completion remain monotonic. Concurrent first writes produce one history record. Delayed events cannot replace a newer position.
- P2: database editor drafts are the single autosave source. Remove unused Redis autosave endpoints and fallback. Separate publication transitions and public reads from editing commands, retaining authorization, transaction boundaries, cache behavior and revision conflict detection.
- P3: verify actual Nexus payloads with Odyssey schemas and exercise persisted reading, notification preferences, destinations and failed-delivery recovery using disposable Docker infrastructure. Retain the existing mocked browser suites for UI failure states.

## Design and delivery

Use account/article local checkpoints with an observation timestamp; persist before sending and acknowledge only an identical checkpoint. Serialize server writes through the owner row and order positions by observation time. Store current and furthest progress separately. Keep the first completion time. Validate observation times and bound anchor lengths.

Extract existing publication and query behavior into focused services rather than changing workflow policy. Remove the obsolete autosave API and its DTOs after checking every reference. Test stale editor revisions and successful draft consumption.

Run focused checks, then frontend preflight/build/browser checks and backend Docker verify/MySQL migration checks. Review both diffs independently, publish linked PRs, pass required checks, merge through platform-permitted routes, deploy backend before frontend and verify served revisions plus read-only smoke checks. Do not weaken gates or alter production historical data. Roll back application images through existing workflows; do not reverse schema migrations.

## Evidence

- `bun run preflight` passed. Prettier, ESLint, TypeScript, and 454 unit tests passed across 87 test files.
- `bun run build` passed and generated all 51 static pages successfully.
- `OPENAPI_FILE=contracts/nexus-openapi.operations.json bun run api:coverage` passed with 313 matched frontend and backend operations and no missing operations.
- Focused Playwright coverage passed 10/10 tests across library history, reading resume, search concurrency, and failure recovery. Chromium was installed locally because the required executable was absent.
- The frontend contract is pinned to Nexus revision `4f8ec5dc1ff2f3418280919c1a54fe869297ca0b` and includes the new reading response fields and draft operations.
- AI self-review covered account-scoped checkpoints, stale acknowledgements, reduced progress with monotonic completion, notification routing, generated API name collisions, responsive library flows, and secret scanning. No blocking findings remain.
