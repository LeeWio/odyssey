# ENG-20261121 Dashboard Feature Boundary

## Requirement

Move the admin Dashboard UI into its domain-owned feature boundary and keep
shared translation form primitives outside the Dashboard module.

## Current problem

Dashboard is a complete business surface with views, widgets, navigation,
portal state, and admin workflows, but it lives under `components/dashboard`.
That makes the component directory own a page-level domain and encourages
routes and cross-domain modules to depend on the wrong architectural layer.

## Design

- Move the complete Dashboard UI tree to `features/dashboard` without adding a
  compatibility directory.
- Expose the dashboard sheet through the feature barrel and the route through a
  dedicated `route-entries.ts` boundary.
- Move the reusable `TranslationFields` component and translation helpers to
  `components/content-translations` because both Dashboard forms and the rich
  text editor consume them.
- Keep Dashboard API contracts and endpoint ownership in `lib/features/*`.

## Acceptance criteria

- No application or feature import references `components/dashboard`.
- `/dashboard` and the global dashboard sheet resolve through `features/dashboard`.
- Dashboard internal relative imports remain within the feature boundary.
- Rich text and Dashboard forms share the new content-translations component.
- No runtime behavior or visual styling changes are introduced.

## Verification

- Run formatting, lint, typecheck, unit tests, focused dashboard/browser checks,
  preflight, and production build.
- Review, merge, deploy with Docker, and verify the served revision.
