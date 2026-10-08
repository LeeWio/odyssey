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
