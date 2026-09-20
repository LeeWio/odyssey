# Notification Module

Notifications provide a reader's inbox, saved/completed activity, and delivery preferences. UI lives in `features/notification`; contracts and API operations live in `lib/features/notification`.

## Delivery preferences

`/notifications/settings` exposes six switches for comment, followed-category, and system notifications across in-app and email delivery. Unauthenticated visitors see the sign-in entry point.

- Edits stay local until Save preferences is pressed. A synchronous guard prevents overlapping saves in the form, and the save button exposes its pending state.
- Switches remain usable during saving. Completion adopts the server response and retains fields changed after submission as an unsaved draft; a second save sends those changes.
- Failure is handled through the existing mutation toast and keeps the draft available for retry, without an unhandled promise rejection.
- A successful mutation updates the existing preferences query cache before relying on a background refresh, preserving confirmed values when that refresh fails. The direct cache update is skipped if the captured account/token has changed; permission metadata updates do not suppress it.
- Failed saves do not invalidate the preferences query. Initial load failures replace the loading skeleton with retry controls; a failed background refresh keeps previously available settings visible.
- The form reads RTK Query's `currentData`, including confirmed mutation updates. The hook's `data` fallback can retain an older successful query snapshot when a subsequent refresh fails.

## Notification lists

- The center's Inbox/Saved/Done views and the popover's All/Unread filters render `currentData`, so rows and totals from a previous query do not appear under a new selection. Uncached queries show a loading state; existing data remains available during a refresh of the same query.
- Pagination is disabled while fetching. An uncached failed page keeps Previous and retry available without inventing a total from the prior page.
- After a successful response reduces the page count (for example, deleting the final item), the center moves to the last valid page. Failed or in-flight responses do not trigger this adjustment.
- Empty states distinguish the inbox, saved items, and completed history.

## Row actions

- The center and popover use `use-notification-actions` to track pending work by notification ID within each mounted surface. Claims happen synchronously, preventing repeated events before the next render.
- Reading, saving, completing, reopening, and deleting the same center row are mutually exclusive while its request runs. Only the active action shows a pending indicator; other controls on that row are disabled. Other rows remain usable.
- Each request releases only its own row on success or failure. Errors use the existing API feedback, and a failed read does not navigate or close the popover.

## Bulk actions

- Within each mounted surface, marking all read and clearing read notifications
  require all row actions to finish. A running bulk action blocks other bulk
  actions and row mutations. The hook claims the lock synchronously, before React
  renders disabled controls, and releases it on success or failure.
- Center and popover locks are independent; this coordination does not extend
  across mounted surfaces, browser tabs, or other clients.
- The clear-read confirmation stays open while its request is pending. Cancel,
  Close, and confirmation controls are disabled; Escape and overlay close events
  cannot dismiss the pending operation.
- A failed clear keeps the dialog open with the existing error toast and restores
  retry/cancel controls. Only success closes the dialog and returns to page one.

## Validation

- `notification-preferences.test.ts` exercises real RTK Query cache behavior: canonical save responses survive refresh failures, late saves cannot directly patch a changed session, and failed saves retain the previous cache.
- `tests/e2e/notification-preferences.spec.ts` covers failed saves/retry, edits during a delayed save, refresh failure after saving, and initial loading failure/retry. API requests are mocked; no real notification settings change.
- `tests/e2e/notification-lists.spec.ts` covers delayed view/page/filter changes, page-load failure and back navigation, retry with view-specific empty states, and pagination after deleting the last item. Requests and deletion are mocked.
- `use-notification-actions.test.ts` covers synchronous duplicate/conflict prevention, independent completion, and retry after rejection. Notification list browser tests also cover concurrent saves with failure/retry and concurrent popover reads.
- Bulk hook tests cover row/bulk exclusion, repeated bulk events before rendering,
  and lock release after rejection or a synchronous throw. Browser tests cover
  clear-read dismissal locking and failure/retry, plus bulk-read locking and
  recovery in both the center and popover. All mutations are mocked.
