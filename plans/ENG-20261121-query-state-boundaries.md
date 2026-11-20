# ENG-20261121 Query State Boundaries

## Requirement

Use one URL state contract for public discovery surfaces so filters, pagination,
search, and view changes preserve unrelated query parameters without repeating
`URLSearchParams` and router mutation logic in each feature.

## Scope

- Migrate Explore, Archive, and Journal to `useQueryState`.
- Preserve each route's pathname, push/replace behavior, scroll behavior, and
  page normalization semantics.
- Keep unrelated navigation actions on the existing router contract.

## Acceptance criteria

- No feature-local `URLSearchParams` mutation remains in these three surfaces.
- Search/filter/pagination behavior remains shareable and refresh-safe.
- Typecheck, lint, focused tests, and production build pass.
