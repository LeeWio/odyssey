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
- User-triggered pagination, reply expansion, and new-comment loads use `use-comment-loader` to lock requests synchronously and expose loading state per thread/sort or reply parent.
- Failures show a retry hint without discarding loaded comments or advancing the cursor/baseline. Reply expansion stays collapsed when its initial load fails.
- Root queries consume RTK Query's `currentData` so switching posts or moments cannot display the previous target's comments, total, or pagination cursor.
- Regression coverage: `use-comment-loader.test.ts`, `use-comment-roots.test.ts`, and mocked browser scenarios in `tests/e2e/comment-loading.spec.ts`.

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

### Composer drafts

- `use-comment-draft` is the composer's single source of text state. Drafts are isolated by post, moment, or guestbook and by reply target.
- Draft recovery must not replace text typed before hydration completes or expose the previous thread's text during a context switch.
- Browser storage is best effort: blocked access or exhausted quota keeps editing available in memory for the mounted composer; persistence across reloads requires working storage.
- A successful publish clears only the unchanged submitted draft. Edits made while waiting and drafts in other threads remain intact; failed publishes preserve the text.
- `use-comment-draft.test.ts` covers storage and context races. `tests/e2e/comment-drafts.spec.ts` verifies persistence and publishing with mocked APIs, including clean hydration of a persisted login.

### Editing existing comments

- Each edit session starts from the current comment text. Cancel discards its local changes; reopening reads the latest server-backed content.
- Background thread refreshes do not overwrite an active edit. A deleted placeholder takes precedence over the editor.
- Saving locks the text and action buttons and guards duplicate submissions synchronously. Failure preserves the text and allows retry; success closes the editor.
- Successful edits also reconcile retained root pages across sorts, prepended/anchor roots, loaded replies (including nested data), and local pending submissions. Each update stays scoped to the thread where the request began, even if the user switches threads while waiting.
- `utils/editing.ts` preserves metadata and unrelated rows; a deleted placeholder takes precedence over a late edit response. The edit endpoint returns no comment snapshot, so these local copies use the submitted text and a client timestamp; authoritative content and moderation status still depend on existing query invalidation/refetch.
- `editing.test.ts` and `use-comment-roots.test.ts` cover nested data, metadata preservation, deletion precedence, and sort/thread isolation. `tests/e2e/comment-editing.spec.ts` covers cancellation, failed saves, successful updates, background refreshes, accumulated pages, and pending submissions through the real UI with mocked APIs and keyboard menu navigation.

### Comment reactions

- A `CommentSystem` locks each comment's like/unlike operation until its request settles, while other comments remain interactive. The button exposes its pressed and busy states to assistive technology.
- Optimistic cache updates and authoritative server counts apply to post, moment, guestbook, reply, and management collections; failed requests undo their cache patches and local display changes.
- Moment lists include paged roots, hot roots, cursor roots, and new roots. `comment-reactions.test.ts` checks all four caches for like/unlike success and rollback.
- `tests/e2e/comment-reactions.spec.ts` covers independent busy states, authoritative counts, failure/retry, and the guest login flow using mocked APIs.

### Deleting comments

- Confirmation can be cancelled or closed before submission. Once deletion starts, a synchronous guard blocks duplicate submissions and the dialog locks confirmation, cancellation, and dismissal until the request settles; closing a dialog cannot cancel an already sent delete request.
- The pending button retains its accessible name and exposes its busy state, with a visible live status message. Failure unlocks retry and dismissal; unexpected callback rejection also keeps the dialog usable.
- After a successful delete, reconcile locally accumulated root pages (across the thread's sort orders), prepended/anchor roots, loaded replies, and pending submissions. A failed delete keeps the comment and confirmation dialog available for retry.
- Remove leaves; retain a non-interactive deleted placeholder when local counts or loaded children indicate replies. This preserves conversation context for both nested and flattened reply data.
- `utils/deletion.ts` shares this reconciliation without mutating existing snapshots. Removing a leaf also adjusts its direct parent's count when both are present in the snapshot.
- Existing tag invalidation refreshes authoritative server lists and counts; local reconciliation uses only known reply information and cannot detect hidden replies.
- `deletion.test.ts` covers list shapes, placeholders, counts, and immutability. `tests/e2e/comment-deletion.spec.ts` covers accumulated pages, reply placeholders, pending submissions, failure/retry, delayed responses, and cancellation before submission with mocked APIs.

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
