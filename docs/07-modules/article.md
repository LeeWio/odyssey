# Article Module

Handles long-form content and article presentation.

## Responsibilities

- render article pages
- support reading-oriented layout and typography
- integrate with content metadata and related modules

## Read later

The `/single` journal exposes standalone bookmark buttons on its latest article
cards, using `features/library/reading-list-button.tsx`. The embedded Chronicle
feed reuses the same action. Neither nests a button in an anchor. Guests open the sign-in dialog
without issuing a reading-list mutation. Authenticated readers use the existing
PUT/DELETE reading-list endpoints. The button reflects the server response rather
than a separate persistent local toggle; pending writes and article refreshes
block duplicate submissions. Failed writes retain the previous server state and
can be retried. Successful writes invalidate the reading list, overview, and the
affected Post tag so subscribed list and detail queries stay in sync.

Regression coverage includes keyboard and pointer interaction, guest sign-in,
failed-save retry, duplicate prevention, reload, and list/detail cache refresh.

The article Action Bar includes a bookmark action for the authenticated user's reading list.

- The server returns `isInReadingList` with the public post response.
- Adding and removing use the personal library endpoints and update the icon optimistically.
- Guests are prompted to sign in. A failed request rolls the icon state back and leaves the article available for retry.

## Create a collection while reading

The article actions menu opens `features/library/create-collection-dialog.tsx`.
Creating a collection and adding the current article are two separate API calls.

- One synchronous submission lock covers both calls. Pending work prevents repeat
  submissions, editing the submitted details, and dismissing the dialog through
  Cancel, Close, Escape, or the backdrop.
- Creation failure keeps editable details and shows a persistent retry message.
  Once creation succeeds, the dialog retains that collection's ID and makes its
  details read-only. A failed article save can retry the save without creating
  another collection. Only completion of both calls closes the dialog automatically.
- Closing after a failed save leaves the already-created collection intact. A
  later explicit create action starts a fresh form. This is not a transaction:
  an ambiguous creation response still requires checking the collection list.
- Dialog state belongs to the selected article and user. Leaving its mounted
  context prevents a late creation response from starting the save step or closing
  a later dialog. An already-sent request may still complete on the server.
- The reader uses `currentData` so a previous article cannot supply the destination
  for a collection action while the requested article is loading.

`tests/e2e/article-collections.spec.ts` uses mocked mutations to verify duplicate
submission prevention, dismissal locking across both steps, creation failure and
editable retry, blank names, and save retry without duplicate collection creation.

## Canonical Journal Route

`/single` is the canonical article index. The former `/blog` page has been removed;
permanent redirects translate its `keyword` and `categoryId` parameters to `q`
and `category` while preserving pagination. Internal navigation, recovery links,
newsletter status actions, and library browse links point directly to `/single`.
Backend `/api/v1/public/blog/...` routes are unchanged.

The latest journal cards use the existing full-post query (six per page), because
digest responses do not provide viewer-specific reading-list state. This avoids
per-card detail requests and guessed bookmark membership. Loading, debounce, and
page correction suppress stale cards and empty-state flashes. Search fields stay
controlled without remounting on every URL update, and pagination is disabled
during refresh. `tests/e2e/journal.spec.ts` covers the canonical route and actions.

## Embedded Article Feed

`features/blog/feed/blog-feed.tsx` powers the Orbit tab embedded in `/chronicle`.

- Search text is normalized before requesting. While React defers the new keyword,
  previous results and counts are hidden and no request is made for the old keyword
  with the newly reset page. Search and topic changes return to page one.
- The list and its reading statistics use `currentData`. Results and pagination
  animation boundaries are keyed by the active input, topic, and page, so an old
  card cannot remain clickable during an exit animation after selection changes.
- Returning to a cached selection refreshes that query. Cached content for that
  exact selection can remain visible during the refresh; uncached selections show
  a loading skeleton. Pagination is disabled while updating.
- Failed later pages keep Previous and retry available. A successful response that
  reduces the page count returns to the last valid page and refreshes its cached
  data. Failed responses do not trigger page adjustment.
- An empty topic offers a return to all topics; an empty keyword search offers
  Clear search.

`tests/e2e/blog-feed.spec.ts` covers search replacement with animations enabled,
topic changes and empty-state recovery, failed-page navigation, out-of-order search
responses, and retry after the collection shrinks. All API responses are mocked.

## Chronological archive

`features/archive/archive-page.tsx` presents `/archive`, with year, month, and
one-based page selection stored in the URL. API requests use zero-based pages.

- Results and counts read RTK Query's `currentData` so an earlier period or page
  cannot appear beneath the current selection. Uncached requests show the archive
  skeleton; a late response for another period only updates its own cache entry.
- Pagination is disabled during fetching. If a later page fails, Previous and
  retry remain available without borrowing the previous page's totals.
- A successful response with a page count corrects obsolete page links to the last
  valid page. Empty archives return to page one. Correction preserves the period
  and unrelated query parameters, uses history replacement, and suppresses
  misleading empty states or result ranges during navigation. Pending and failed
  responses never trigger page correction.
- Clearing the month selection removes the URL parameter. Pagination scrolling
  respects the reader's reduced-motion preference.

`tests/e2e/archive.spec.ts` covers delayed year changes, failed-page recovery,
out-of-order period responses, and obsolete links to populated or empty archives.
All API responses are mocked.
