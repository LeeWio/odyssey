# ADR-0006: Comment Thread Model

## Status

Accepted

## Context

Comments are a core shared surface (articles, moments, guestbook, admin). The UI already converged on a single `CommentSystem`, but orchestration grew into a large `useComments` hook with dual pagination, optimistic publish edge cases, and unused API surface. Author actions still key off display-name strings. Several backend capabilities (permalink context, new-count, pin/feature) exist but are not wired.

## Decision

1. **One UI owner** — `components/comment/` remains the only public thread implementation; feature pages only configure it.
2. **Two-level presentation** — keep parent/child in data; render root + flattened replies with `author → parent author`. Do not build infinite nested cards.
3. **Server-led pagination** — newest uses cursor roots; oldest/likes use offset/hot roots; replies use cursor. Prefer showing each fetched server page directly over a second client “reveal N of M” slice.
4. **Optimistic writes with one sync model** — publish keeps local pending + idempotency + deferred invalidation; likes use UI overrides plus RTK collection patches with rollback; publish/delete also invalidate related `Post` / `Moment` count tags.
5. **Backend adjudicates status and authorship** — moderation status is server-authoritative; API exposes `authorUserId`, `viewerCanEdit`, and `viewerCanDelete`, with temporary username fallback only when those fields are absent. Moments use dedicated `moment_id` / `/comments/moment/...` APIs — never post comment routes.
6. **Permalink via context API** — deep links that miss the loaded window must fetch comment context, seed the root/replies window, then highlight rather than failing silently.
7. **Newest-sort freshness** — poll `new-count` and prepend via `.../new` instead of full-thread refetch or websockets.
8. **Tests and docs are part of the module** — contracts, pure thread helpers, and this ADR travel with behavior changes.

## Alternatives considered

- **Recursive nested UI** — richer trees, worse mobile density and higher render cost; rejected for product consistency.
- **Full-tree fetch only** — simpler client, poor scale; rejected in favor of roots + lazy replies.
- **Separate guestbook/moment comment stacks** — duplicates composer and sync bugs; rejected.

## Consequences

- Refactors should thin `useComments` into read/write helpers without changing the public `CommentSystem` API.
- Dead or duplicate wrappers (e.g. thin `CommentSection`) should be removed rather than kept “for convenience”.
- Dashboard governance features should reuse comment feature APIs instead of forking OpenAPI-only call sites long term.
- Backend contract work (`authorUserId`, context guarantees, count sync) is in scope when it unblocks consistency and permissions.
