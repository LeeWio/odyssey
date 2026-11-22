# ENG-20261122 Moments feed controls

Target `main` from `d6330b0` in the `fix/moments-feed-controls` worktree.
The original checkout has a local `tsconfig.json` edit. The feed uses Next.js,
RTK Query, HeroUI and container queries. GitHub requires a pull request and
status checks for `main`. The existing Chronicle work provides a shared
client-only query mode for same-page controls.

## Requirements

- View changes update the shareable URL immediately and leave the current
  feed mounted. Consecutive view, topic and page actions compose against the
  live URL. Topic changes reset pagination, and view changes preserve the
  anchor. Direct visits, reload and Back/Forward restore the requested feed.
- On phones, publishing cadence starts collapsed with a short summary. Topic
  controls stay directly above the feed, display the selected topic and let the
  reader clear it. An empty filtered feed offers a return to all moments.
- Show the view selector when the feed has room for at least two columns.
  At the sidebar breakpoint, retain enough feed width for two columns. Keep
  the URL preference when a narrow viewport shows one column.

## Implementation and verification

Reuse the shared query boundary and the existing feed, card and cadence
components. Keep the selected topic and layout control outside the loading
body so readers can change them during requests. Verify rapid successive
actions, retained content, pagination and anchors in Chromium, then check the
first fold and column counts across phone, tablet and desktop widths. Run the
repository preflight and production build. Revert this change to roll back
the page interaction and layout.

## Review evidence

- PASS. `bun run preflight` completed formatting, lint, type checking, and all
  454 unit tests. `bun run build` completed a production build.
- PASS. Eleven focused Chromium scenarios covered compact controls, URL state,
  empty results, pagination, editor access, and repeated view switching.
- PASS. With sample data, the first card started about 212px down at 390px.
  Grid kept two columns before and after the sidebar appeared at 1024px.
  A rapid Grid and topic change made zero Next.js page requests. Browser Back
  from a topic archive and reload restored the chosen topic and view.
- BASELINE FAIL. The Chinese homepage slogan assertion and both entrance
  timing assertions also failed on the unmodified `d6330b0` checkout.
