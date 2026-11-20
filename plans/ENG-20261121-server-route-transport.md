# ENG-20261121 Server Route Transport

## Requirement

Make RSS and Sitemap route handlers consume the shared server API transport
instead of duplicating API origin resolution, headers, timeout, caching, and
response parsing.

## Scope

- Add a shared text response path beside the existing JSON path.
- Validate RSS API data with the same envelope and Zod boundary as feature data.
- Keep the public feed and sitemap response formats unchanged.
- Preserve route-level cache policies and graceful unavailable responses.

## Acceptance criteria

- RSS and Sitemap no longer read API URL environment variables directly.
- RSS only renders schema-valid posts.
- Sitemap preserves XML content and cache headers.
- Transport, typecheck, lint, tests, and production build pass.
