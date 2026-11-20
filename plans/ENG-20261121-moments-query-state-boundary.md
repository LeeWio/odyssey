# ENG-20261121 Moments Query State Boundary

## Requirement

Make `/moments` use the shared URL state contract so topic filters, pagination,
view mode, anchor recovery, and page normalization have one routing boundary.

## Current problem

Moments directly mutates `window.history` in multiple callbacks and effects. The
duplicated URL construction hardcodes the route, makes query preservation
implicit, and leaves router state outside Next's navigation contract.

## Design

- Use `useQueryState` for reading `topic`, `page`, and `view`.
- Extend `updateQuery` with an explicit `hash` option for fragment-preserving
  anchor transitions; an empty hash intentionally clears the fragment.
- Keep user pagination and topic selection as push navigation.
- Keep anchor pagination and server-total page normalization as replace
  navigation.
- Preserve unrelated query parameters and route prefixes through the shared
  hook.

## Acceptance criteria

- Moments has no feature-local `URLSearchParams` mutation or `history` writes.
- Pagination, topic selection, view switching, anchor recovery, and page
  normalization preserve their existing push/replace and hash semantics.
- Feed layout changes retain unrelated query parameters and the current anchor.
- The shared hook remains the only query URL mutation boundary for migrated
  frontend surfaces.

## Verification

- Run formatting, lint, typecheck, unit tests, preflight, and production build.
- Review the final diff and verify the PR, merge, deployment revision, and
  health check through the repository delivery workflow.
