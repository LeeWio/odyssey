# Editor

The editor is the Tiptap surface in `components/rich-text`. Publishing state stays on the post, not in the editor.

## Where it opens

- Admin posts call `openRichText` from `components/dashboard/views/posts-page.tsx`.
- `components/global-control.tsx` mounts `RichTextModal` when that UI flag is set.
- `/test/rich-text` exists only when `ENABLE_RICH_TEXT_TEST_ROUTE=1`.

Readers never get this editor. Article pages render saved JSON through the reading body.

## What it edits

Images, attachments, audio, video, tables, mathematics, and a table of contents are extensions under `components/rich-text/extensions`. Draft text for the test route is stored locally by `components/rich-text/utils/editor-draft`.

## What it does not own

- Post status (`DRAFT`, `SCHEDULED`, `PUBLISHED`, and the rest) is the post API.
- Comments use their own composer.
- Moments use `features/moment/components/publisher`, not this modal.

A new content type that needs this editor should open the same modal and persist through its own feature API.

## Glass BubbleMenus

All six selection menus use `components/rich-text/menus/bubble-menu.tsx`, which
keeps HeroUI's native BubbleMenu and its visual styles. In a modal, it mounts the
menu in the owning `Modal.Container`, alongside `Modal.Dialog`; outside a modal,
it mounts in `document.body`.

The glass theme applies `backdrop-filter` to both Modal.Dialog and BubbleMenu.
Mounting a menu inside the glass dialog reproduced sharp editor text behind the
menu in Chromium even though its computed blur was correct. Mounting alongside
the dialog restores backdrop sampling while retaining the modal's focus scope.
Menus explicitly accept pointer events because Modal.Container disables them.

`/test/rich-text?modal=1` opens the real article editor with a local test draft.
`tests/e2e/rich-text-glass.spec.ts` checks six menus in light and dark glass,
in both page and modal contexts, plus formatting, nested dropdowns and focus.
The blur probe lives inside the editor's content: a probe inserted directly
beside the menu bypasses the nested backdrop problem and gives a false positive.
Pixel checks measure whether blur smooths stripes in the menu's padding, away
from the buttons' own backdrop filters.
An additional negative control places actual editor glyphs behind the same menu:
the old dialog mount leaves sharp text, while the container mount smooths it.

## Suggestions In Modals

HeroUI Pro's native `SuggestionMenu` portals to `document.body`, below the article
modal. `SuggestionToolbar` moves the `/` and `@` menu roots into the owning
`Modal.Container` using their element refs, and restores the original portal
parent during ref cleanup so React can remove them safely. The menus retain
HeroUI styling and explicitly accept pointer events.

The React Aria top-layer marker keeps menus interactive when the modal's queued
body mutation observer runs, and allows their focus and pointer interactions.
ListBox uses the official action-list pattern (`selectionMode="none"` with
`onAction`) so a single click inserts the command or mention. Active suggestion
highlighting follows the suggestion plugin's index. Escape exits the active
plugin before reaching the modal, including when focus is inside the list.

`tests/e2e/rich-text-suggestions.spec.ts` covers hit testing, mouse insertion,
keyboard selection, repeated dismissal, menu focus and modal reopening across
light and dark glass themes and the standalone editor.
