# Personal Library

The `/library` page uses HeroUI cards, buttons, dialogs, and loading states for reading history, recommendations, followed categories, favorites, and collections.

## Collection contents

- A collection displays 20 articles per page, ordered by `addedAt` descending. Previous/Next controls show the current page and total article count.
- The contents component is keyed by collection ID. Selecting another collection resets its page to the beginning and isolates pending article removals.
- Rendering uses the query's `currentData`, so a pending page or collection request cannot display articles or totals belonging to the previous query. Page navigation is disabled while fetching.
- Loading errors offer an explicit retry. A failed later page retains a Previous action so readers can recover without closing the collection.
- When removal reduces the page count, the view returns to the last valid page. Revisiting a page refetches its data, including when a cached response exists.
- Each article removal has a synchronous duplicate guard and an independent pending state. Completing one removal does not unlock another; failures keep the article available for retry and use the API mutation's existing error notification.
- Collection selection buttons include the collection name and pressed state for assistive technology. The selected contents are a named region.

## Collection management

- Create/edit and delete dialogs live in `features/library/collection-management-dialogs.tsx`. Each explicit opening mounts a fresh instance with its own draft, collection target, pending guard, and error state.
- Create and edit reject whitespace-only names before sending requests. Names and descriptions are trimmed when submitted.
- A synchronous guard prevents repeated requests before React renders the pending state. While a request is pending, fields are read-only and submission, Cancel, close controls, Escape, and backdrop dismissal cannot interrupt the operation.
- Failures keep the dialog open with an inline error and restore the controls for retry. Create/edit retain the draft; deletion retains the target. Cancelling and reopening starts a fresh dialog.
- Successful saves select the saved collection. Successful deletion clears the selection only if that collection was selected. Responses arriving after the dialog unmounts cannot close a subsequent dialog or change its selection.

## Reading history

- The history section owns its pagination and mutation state, and mounts only for authenticated readers. Each page uses `currentData` so previous-page rows and totals do not appear during loading. Navigation pauses while fetching, errors provide retry and Previous actions, and removing a final-page record returns to the last valid page with a fresh query.
- Individual removals have independent synchronous guards. One completion cannot unlock another pending record, and failed records remain available for retry.
- Clearing history and individual removals are mutually exclusive within the section. The clear confirmation locks submission, dismissal, navigation, and row actions during its request. Failures keep the confirmation open with an inline error and restore retry/cancel controls; reopening clears the old error.
- The clear confirmation button uses HeroUI's pending state to prevent interaction without losing keyboard focus. After failure, Escape can dismiss the dialog from that retained focus.
- Successful clearing resets pagination to the first page. Existing API invalidation refreshes both history and the overview's Continue reading section. Late mutation completions after unmount do not change local UI state.
- Article links retain their saved reading anchors.

Following-feed pagination retains its existing behavior.

## Verification

`tests/e2e/library-collections.spec.ts` covers pagination beyond the first 20 articles, loading and failure recovery, late responses during collection switches, page correction after removal, concurrent removals and retries, and removing the same article from different collections. All API requests are intercepted with fixtures, including writes.

It also covers create/edit validation, duplicate submissions, locked dismissal and fields during delayed requests, preserved drafts and failure retries, fresh state after cancellation, deletion retry, and selection behavior when deleting the selected or another collection.

`tests/e2e/library-history.spec.ts` covers history pagination and retry, final-page removal, concurrent row locks, coordination with clearing, failed clear retry, cancellation, page/overview reset, and preserved reading anchors. Its API reads and writes are also fully mocked.
