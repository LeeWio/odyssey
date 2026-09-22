# Guestbook

## Role

Guestbook is the moderated visitor log. Guests read publicly; signing in is required to leave an entry or reply.

## Implementation

- Page: `features/guestbook/guestbook-page.tsx` → `/guestbook`
- Thread UI: shared `CommentSystem` with `isGuestbook`
- Auth gate: unauthenticated visitors see a HeroUI `Card` invitation (`Sign in to write`); the comment composer stays behind login
- Page chrome: `Surface` shell, `Chip` eyebrows (`Guestbook` + `Moderated conversation`), `Separator` before the thread
- Home also offers a quick guestbook popover that posts through the same guestbook mutation
- Home `#guestbook` guest invite uses the same secondary `Card` pattern as `/guestbook`, plus a Link to the full page

## Explicitly out of scope (for now)

- Star ratings and emoji reaction counters are not product features. Fake social-proof panels were removed so the page only shows the real conversation thread.

## Related

- Comment module docs: `docs/07-modules/comment.md`
- Home visitor recovery notes: `docs/07-modules/home.md`
