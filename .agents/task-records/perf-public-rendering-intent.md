# PERF-002 follow-up: public content and visitor intent

Status: READY_FOR_REVIEW. Delivery stays in [PR #92](https://github.com/LeeWio/odyssey/pull/92), which covers the same public critical paths. Implementation and Git operations are local, with Docker Nexus used read-only.

## Discovery and scope

- The homepage loads MapLibre even though its map is several sections below the fold. Keep the interactive map and footprint summary, but reserve the map's dimensions and initialize it near the viewport.
- The homepage mounts interactive Moments cards, so a read-only preview loads rich-text parsing, gallery and account controls. Render the successful payload as a server slot with the existing rich-text schema, keep masonry, thumbnails and anchor links, and isolate the client retry path. Real links inside the document remain independently usable.
- The article mounts the closed comments sheet and queries the continuation list and archive neighbors on hydration, even on phones that show them only at the bottom. Load comments on first open, defer footer queries until near the footer, and keep the genuinely visible desktop recommendation rail responsive.
- The homepage inserts the visitor orientation after hydration because its dismissal lives in local storage. Read a one-year dismissal cookie during the initial render so the first-visit layout and the returning-visit layout are both available without a post-hydration insertion. Older local-storage dismissals are not migrated.

## Acceptance and rollback

- Compare separate production builds with the same local backend, browser viewport, CPU and data. Record decoded script bytes, requests and layout; do not infer a field performance gain from a single local sample.
- Verify navigation, mobile and desktop map, homepage failure/retry, comment keyboard opening, and recommendation intent. Do not add CI gates, change API contracts or write any persistent data.
- Revert the scoped implementation commit to restore eager behavior. No backend or deployment migration is required.

## Verification

- PASS: `bun run preflight` (formatter, ESLint, TypeScript, 454 unit tests).
- PASS: `API_URL=http://127.0.0.1:3188 NEXT_PUBLIC_API_BASE_URL= bun run build` with the locally installed Next.js 16.2.11. Both benchmark builds use that same version; the GitHub gate uses the frozen lockfile.
- PASS: `OPENAPI_FILE=contracts/nexus-openapi.operations.json bun run api:coverage` (316 operations matched, none missing).
- PASS: 33 scoped Chromium cases across `home-moments-masonry`, `home-orientation`, `home-visitor`, `footprints`, `article-entrance`, `article-mobile`, and `comments`. They cover preview layout and embedded links, initial and returning HTML, one-retry recovery, map load after scrolling with unchanged height, viewport-specific article requests, and keyboard comment opening.

### Production-build comparison

Baseline `f1466ff` and rebased PR parent `dadf7e1` have the same Git tree. Compare separate builds using `PERF_RUNS=5 PERF_VIEWPORT=<mobile|desktop> node scripts/measure-public-reading.mjs <dist-dir> 123123-123123123123 <route>`. Each row uses the median of five fresh Chromium contexts at 2× CPU throttling, with the same Docker Nexus data and third-party resources blocked. Sample 390 × 844 and 1440 × 900 viewports in alternating build order by route. Local raw results: `/tmp/odyssey-perf-round3/final-*.jsonl`.

- Home, both viewports: 3,946,277 → 2,440,490 decoded JS bytes (−38.2%), 48 → 44 script requests. Mobile LCP 212 → 200 ms and layout shift 0.047 → 0; desktop LCP 232 → 232 ms and layout shift 0.033 → 0.
- Article, both viewports: 2,748,571 → 2,021,884 decoded JS bytes (−26.4%), 49 → 44 script requests, and 2 → 0 initial browser API reads. Both render the same 3,226 characters. Mobile LCP 224 → 196 ms; desktop LCP 220 → 200 ms; layout shift stays at 0. The 1600 px recommendation rail is verified separately in the browser cases.
- Home moves rendering to the server rather than dropping content: decoded HTML grows from 202,374 to 222,711 bytes. The hero markup still arrives within 24 ms in the mobile runs with 700 ms injected Moments-list delay. Decoded byte counts are not network transfer sizes; local LCP medians are not production field metrics.

### AI self-review

Reviewed the scoped diff against `f1466ff`: rendering and bundle ownership, anonymous GET behavior, navigation from Moment rich text, map placeholder height, keyboard comment opening, responsive continuation, and cookie scope. No blocking findings in the reviewed scope. No changes to Nexus, dependencies, contracts, CI or deployment rules. Production verification still requires the existing GitHub merge, release and deployment gates.
