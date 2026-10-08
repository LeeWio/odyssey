# Roadmap

## Baseline (2026-10-08)

The production-facing application is broad and currently has a healthy quality
baseline: formatting, lint, type checks, 226 unit tests, and a substantial
Playwright suite are already present. The next stage should improve product
coherence and operational confidence before introducing another major content
type.

The main product loop is:

```text
discover -> read -> save or revisit -> return -> create or respond
```

Current implementation is strongest in discovery, reading, comments, and the
personal library. Dashboard navigation is broad, but several views are still
static or placeholders. That surface should remain clearly labeled until it is
connected to real contracts.

## Now

- Keep production surfaces honest: real footprints, real GitHub telemetry, Demo labels on experimental pages.
- Maintain homepage, blog, comments, and reading experiences already in production use.
- Hold CI and deploy gates to the same `preflight` command as local development.
- Protect the core loop with browser tests for discovery, reading, saving, and returning.

## Next

- Complete Footprints visit years and memory notes.
- Graduate the reading loop: connect article progress, reading-list actions, history, and library entry points with one consistent action model.
- Expand remaining stub module docs (`stock`, `timeline`, `profile`, `editor`).
- Split oversized navbar / library surfaces when those areas are next edited.
- Define the first wave of future-facing modules only after the core loop has stable analytics and error recovery.

## Later

- Formalize content strategy and information architecture.
- Add experiment notes for motion, layout, and editorial patterns.
- Keep a changelog that summarizes product-level changes, not just code merges.
- Create a stable framework for introducing new module types without rewriting the IA.

## Delivery Sequence

### Phase 1: Production confidence

- Keep `preflight` as the single static-quality command in local development,
  CI, and deploy workflows.
- Add browser coverage for the most valuable cross-page journeys and for failed
  API recovery, not only isolated component states.
- Audit production routes for missing loading, empty, error, and permission
  states.

### Phase 2: Reading loop

- Make article actions consistent across article cards, article pages, and the
  reading library.
- Preserve reading progress and history across navigation and authentication
  transitions.
- Improve discovery with related content and explicit return paths from saved
  items, history, and collections.

### Phase 3: Capture and knowledge

- Introduce one new content type, preferably notes or references, only after its
  ownership, lifecycle, search behavior, and rendering contract are documented.
- Cross-link articles, notes, projects, and sources instead of creating another
  isolated feed.

### Phase 4: Private operations

- Replace dashboard mock or placeholder views with real APIs in priority order:
  analytics, tracker, settings, then governance surfaces.
- Keep non-production data visibly labeled and avoid implying persistence where
  none exists.

## Acceptance Criteria

- Every production route has explicit loading, empty, failure, and permission
  behavior where applicable.
- Core discovery and reading journeys pass at mobile and desktop breakpoints.
- CI and deploy invoke the same `bun run preflight` command.
- New modules ship with contracts, focused unit tests, browser coverage for the
  primary journey, and a short module document.
