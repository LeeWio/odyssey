# Chronicle and Explore query state — #94, #95

Status: READY_FOR_REVIEW. Preserve the existing HeroUI controls and backend API contracts.

- #94: the search field was keyed by the current URL term, replacing the focused input after a debounced update. Keep a stable controlled field and distinguish local commits from history navigation; the current request owns the rendered result.
- #95: Explore and Archive hard-coded their standalone paths even when embedded. Use in-place Next.js-compatible history updates for these client-owned queries. Chronicle resets panel-specific keys on tab changes and pushes a history entry so Back restores the previous panel and filters.
- Validate paused typing, the caret, clear and Back, embedded search and filters, embedded Archive pagination and correction, reload, and standalone routes. Revert the scoped PR to roll back; no schema or API changes.

Both reports reproduced on production Chromium before changes. Explore lost focus after committing `MAX`; Chronicle navigated to `/explore?section=explore&q=MAX96781` and `/archive?section=archive&page=2`. The corrected local branch passed all nine Chronicle, Explore, and Archive browser cases. The two new regression cases are in the CI browser smoke suite.
