# PERF-003: homepage and series reading intent

Status: READY_FOR_REVIEW. Measurement baseline: Odyssey `bd05e35`. Start from the performance review of the live `ee1a4af` revision. No Nexus source change; the local Nexus Docker backend supplies the read-only production-build comparison.

## Requirement and design

- The homepage starts Featured Writing, Projects, and Friends queries even if the visitor never leaves the first screen. Gate their subscriptions on the existing viewport observer and leave section headings, anchors, placeholders, and retry controls in their current layout. Split Featured Writing's carousel into a demand chunk and reserve one responsive row rather than reserving a grid for a carousel.
- A series article starts a column catalog request even when its context rail is hidden by the narrow layout. Retain the series summary from the article and start enrichment only near the visible rail or the article footer. Keep the public count from the column endpoint and let RTK Query share the cache with adjacent-article navigation.
- Replace hand-rolled paint/event/shift accumulation with the Next.js Web Vitals hook. Collection is opt-in via the server runtime environment; payloads identify the initial document route group and deployed revision. Do not send individual article slugs, search parameters, credentials, or referrers. No new storage service or CI gate is included.

## Acceptance and rollback

Check that cold homepage visits start none of the three queries and scrolling loads each once. Compare separate production builds against the same Nexus Docker data and verify carousel navigation, retry, keyboard focus, direct anchors, and responsive layout. Verify that mobile series articles don't request the column before nearing the footer while the desktop rail still receives the published count. Exercise the metric payload through a configured local test receiver. Revert this change to restore eager loading and the old instrumentation; no data migration is needed.

## Verification

- PASS: `bun run preflight` (formatter, lint, TypeScript, and 453 unit tests).
- PASS: 25 Chromium cases in `article-entrance`, `home-density`, `home-visitor`, `home-friends`, and `web-vitals`. The narrow series reader starts zero column requests and fetches once near the footer; the wide reader populates its visible context with one request. Homepage showcases still resolve, resize, and retry on demand.
- PASS: `OPENAPI_FILE=contracts/nexus-openapi.operations.json bun run api:coverage` (316 matched, zero missing) and both `bun run build` runs. The local runtime uses Next.js 16.2.11 for both builds; GitHub runs the frozen dependency graph.
- PASS: Cold homepage comparison on 390 × 844 and 1440 × 900 at 2× CPU throttling, six fresh Chromium contexts per build and viewport in alternating order. The three initial browser GETs become zero. Decoded JS drops from 2,440,490 to 2,403,971 bytes (−1.5%) and from 44 to 43 script requests. LCP medians are 192 → 194 ms on mobile and 214 → 208 ms on desktop, with no layout shifts. These differences do not establish a meaningful LCP improvement. Local evidence: `/tmp/odyssey-perf-round4/paired-home.jsonl`; true field metrics require a configured receiver.

AI self-review checked request lifetimes, cached retries, the mobile/desktop context split, and the no-credential metric envelope. No new package, Nexus API, or production config was changed. PR approval and production verification remain pending.
