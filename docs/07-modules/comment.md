# Comment Module

Handles discussion and interaction around content (posts, moments, guestbook).

## Responsibilities

- render one shared `CommentSystem` for posts, moments, and guestbook entries
- keep complete parent/child relationships in the data model while presenting a **two-level** thread (root + flattened replies)
- make reply targets explicit with `author → parent author`
- support sorting, reply disclosure, likes, edit/delete/report, optimistic drafts, and comment anchors

## Ownership

| Layer         | Path                                                                | Owns                                                                                                          |
| ------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| UI            | `components/comment/`                                               | Composer, list, sheet, context, client orchestration hooks                                                    |
| Data          | `lib/features/comment/`                                             | Zod contracts, RTK Query endpoints, Comment cache tags                                                        |
| Admin surface | `components/dashboard/views/comments-page.tsx` + `comments/` panels | Governance console (moderate / reports / high-risk / logs / preview); must not fork a second public thread UI |
| Feature pages | guestbook / blog reader / moment card / article sheet               | Configure `CommentSystem` / `CommentSheet` only                                                               |

Feature-specific entry points may wrap or configure `CommentSystem`, but must **not** implement another composer, query flow, or recursive comment card.

## Surfaces

| Surface     | Entry                                        | Notes                                                                                                 |
| ----------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Article     | `CommentSheet` on `app/(main)/single/[slug]` | Query `?comments=1` opens sheet                                                                       |
| Blog reader | `<CommentSystem postId={...} />`             | Inline                                                                                                |
| Moments     | `<CommentSystem momentId={...} />`           | Uses `/api/v1/public/comments/moment/...` (independent of postId)                                     |
| Guestbook   | `<CommentSystem isGuestbook />`              | Separate guestbook public APIs                                                                        |
| Dashboard   | governance console                           | Overview KPIs, batch moderate, pin/feature, reports, high-risk, logs, repair counters, thread preview |

## Admin governance

Owned by `lib/features/comment` (not the OpenAPI catch-all client):

| Capability       | Endpoint family                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------- |
| List / filter    | `GET /api/v1/admin/comments` (`status`, `postId`, `username`, `keyword`, `featuredOnly`) |
| Moderate / batch | `PATCH .../status`, `POST .../batch/status`                                              |
| Pin / feature    | `PATCH .../{id}/pin\|feature`                                                            |
| Overview         | `GET .../overview`                                                                       |
| Reports          | `GET .../reports` + `PATCH .../reports/{commentId}/{reporterId}`                         |
| High risk        | `GET .../high-risk`                                                                      |
| Logs             | `GET .../moderation-logs`                                                                |
| Repair counters  | `POST .../repair-counters` (confirm dialog)                                              |

Public reply lists under a **root** return path descendants (all nested replies), so the two-level UI can flatten reliably.

## Data model

Backend is source of truth for moderation status: `PENDING | APPROVED | REJECTED | SPAM`.

Key client types:

- `CommentResponse` — Zod contract in `lib/features/comment/comment-contracts.ts`
- `EnhancedComment` — response plus transient `isPending` / `isFailed` for optimistic publish

Threading rules:

- storage uses `parentId` (full tree possible)
- UI flattens each root’s subtree into one reply column
- soft-delete uses `deletedPlaceholder`

## Read path

```text
CommentProvider (postId | guestbook, sort, reply target, highlight, auth)
  → useComments
      → roots query (cursor for newest; page for oldest; hot page for likes)
      → lazy reply pages via replies/cursor
      → merge pending optimistic items
  → CommentList / CommentItem
```

### Sorting

| UI sort     | API                                     |
| ----------- | --------------------------------------- |
| Newest      | `.../roots/cursor` (guestbook parallel) |
| Oldest      | `.../roots?sort=createdAt,asc`          |
| Top / likes | `.../roots/hot`                         |

### Pagination

- Server page/cursor size: 20; each fetched page is shown directly (no secondary client “reveal 5 of 20” slice)
- Replies: cursor pagination per root (`load more replies`)
- Client must not invent a third sync model beyond RTK tags + local pending
- Orchestration is split across `use-comment-roots`, `use-comment-replies`, and `use-comments` (pending merge)

### Cache tags

Helpers: `publishedCommentTags(postId, parentId?)`, `publishedGuestbookCommentTags`.

Collection ids include `POST_{id}_ROOTS`, `POST_{id}_HOT_ROOTS`, `REPLIES_{parentId}`, `GUESTBOOK`, `ADMIN_LIST`, `MY_COMMENTS`.

Boundary rule: comment mutations must **not** directly rewrite post list caches; use tag invalidation (and, when adding count sync, invalidate `Post` / `Moment` tags rather than hand-patching post fields from comment UI).

## Write path

| Action        | Client behavior                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Publish       | Optimistic temp id + `Idempotency-Key`; optional `deferInvalidation` then invalidate after reconcile; also invalidate `Post` / `Moment` count tags for the thread `postId`                                                |
| Like / unlike | Optimistic UI override + RTK collection cache patch; rollback on failure (no full-list invalidation)                                                                                                                      |
| Edit / delete | User APIs; prefer `viewerCanEdit` / `viewerCanDelete` / `authorUserId` from API with username fallback; authors can manage `PENDING` comments; public delete asks for confirmation; delete also refreshes Post count tags |
| Report        | Public report endpoint                                                                                                                                                                                                    |

Unauthenticated write actions open the login modal instead of failing silently.

## Freshness

On **newest** sort, poll `.../new-count` (post or guestbook) about once a minute and on focus. A header control loads `.../new` and prepends roots without resetting the whole thread.

## Anchors

Hash form: `#comment-{id}`. Highlight + scroll live in `use-comment-highlight`. When the target is not already loaded (posts only), fetch `GET .../comments/{id}/context`, ensure the root is present, seed the replies window, then scroll.

## Related systems

- Notifications: backend-owned; preferences include comment email/in-app flags
- Post/moment `commentsCount`: separate aggregates; keep in sync via invalidation after publish/delete
- OpenAPI admin extras (pin/feature/reports/high-risk): converge into comment feature when wiring dashboard governance

## Explicit non-goals

- Infinite nested reply UI
- WebSocket live comment stream (use new-count / focus refresh first)
- A second comment composer outside `components/comment/`

## Decision record

See [ADR-0006: Comment Thread Model](../09-decisions/ADR-0006-comment-thread-model.md).
