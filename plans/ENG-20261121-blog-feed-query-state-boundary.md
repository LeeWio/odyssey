# ENG-20261121 Blog Feed Query State Boundary

## Requirement

Remove the last feature-local query read from the embedded Blog Feed so URL
state is consumed through the shared `useQueryState` boundary.

## Current problem

Blog Feed already writes keyword, category, and page changes through
`useQueryState`, but its browser-history listener reparses
`window.location.search`. That creates two query-read paths and makes the
controlled search field depend on a browser-global event rather than the Next
router state.

## Design

- Derive the committed keyword from `useQueryState().searchParams`.
- Keep the raw input locally controlled so trailing whitespace is not removed
  while the user is typing.
- Track the last keyword written by the input and only synchronize local input
  when the URL changes externally, including back/forward navigation.
- Remove the feature-local `popstate` listener and `URLSearchParams` read.

## Acceptance criteria

- Blog Feed has one query read/write boundary.
- Search input remains controlled and preserves its current typing behavior.
- Back/forward navigation still restores the URL keyword.
- Search, topic, and pagination updates retain existing query semantics.

## Verification

- Run formatting, lint, typecheck, unit tests, focused Blog Feed browser checks,
  preflight, and production build.
- Review, merge, deploy with Docker, and verify the served revision.
