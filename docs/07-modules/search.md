# Search Module

The command palette combines remote content discovery with local navigation, theme,
and workspace commands. Open it from the navigation search button or its keyboard
shortcut.

## Responsibilities

- Help readers find content through the unified search API.
- Keep local commands available when content search is unavailable.
- Keep visible results and executable commands aligned with the current keyword
  and selected scope.

## Search lifecycle

- Only the **All** and **Search** scopes request remote content. **AI**, **Themes**,
  and **System** use local commands and hide remote loading and error feedback.
- Input is trimmed and debounced for 250 ms. Changing the normalized keyword
  immediately removes previous content results and executable search commands,
  including during the debounce interval.
- Results use RTK Query's `currentData`, so a response for an earlier keyword cannot
  replace the current keyword's results. Cached results for the current keyword
  remain eligible for display.
- Empty input and a closed palette suppress content results and new requests.
  Existing requests may finish and populate their own cache entries.
- Loading, failed search, and successful empty results have distinct feedback.
  Search failures leave local shortcuts available.
- Closing resets the input and scope. A pending delayed reset is cancelled if the
  palette reopens before it runs.

## Implementation

- `components/command-palette/index.tsx`: scope selection, command rendering,
  feedback, and execution.
- `components/command-palette/search/use-post-search-commands.ts`: debouncing,
  query isolation, and remote result mapping.
- `lib/features/post`: unified search API integration.

## Verification

- Hook tests use the real Redux query cache and controlled responses to cover
  immediate removal of stale commands, out-of-order responses, and disabled/error
  state transitions.
- `tests/e2e/search.spec.ts` covers keyword replacement, late responses, and local
  scope isolation in the browser. API responses are mocked.
