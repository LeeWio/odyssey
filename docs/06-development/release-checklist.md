# Release checklist

Run this on the production host before pushing `web`.

1. `bun run preflight` — format, lint, types, unit tests.
2. Playwright for the journey you changed. Reading work includes `tests/e2e/article-reading-list.spec.ts` and the library specs under `tests/e2e/library-*.spec.ts`.
3. When the OpenAPI document URL is reachable, `bun run api:coverage`.
4. New visitor copy exists in both `messages/en.json` and `messages/zh.json`.
5. A route that is still a demo keeps its `Demo` label. A dashboard view without an API keeps the sample or not-connected label.
6. Update the module note in `docs/07-modules/` when a boundary changes.

Do not commit `.env` or credentials. Sync the work to the server, then commit there.
