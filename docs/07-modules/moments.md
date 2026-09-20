# Moments

## Content rendering

Moment content is stored as Tiptap JSON. The publisher uses HeroUI Pro's
`RichTextEditor`; the feed and home board use Tiptap's `renderToReactElement`
from `@tiptap/static-renderer/pm/react`, wrapped in HeroUI `Typography.Prose`.

The reported formatting issue came from flattening the document for display:
`hardBreak` nodes disappeared, and paragraph boundaries became single newlines.
The saved document was intact. Native rendering preserves paragraphs, hard breaks,
marks, lists, links, and code blocks without creating an editor per card.
Paragraph spacing and empty paragraph height are presentation styles; legacy
plain-text newlines are preserved with `white-space: pre-wrap`.

`content-schema.ts` matches the publisher's content schema: StarterKit with heading
levels 1–3, including Link and Underline already provided by StarterKit v3.
HeroUI adds placeholder and character-count behavior, which do not change the
stored content schema. Update the renderer schema when publisher extensions change.
The article extension kit is intentionally separate: its custom node views and
editing features are not needed by Moments.

`parseMomentContent` remains the storage boundary. It decodes the JSON string and
uses the Tiptap schema's `nodeFromJSON`, `check`, and `toJSON` APIs. It does not
walk or rewrite nodes. Link URI safety comes from the native Link extension's
`renderHTML` validation, and React escapes literal text.
Legacy text and malformed or unsupported documents are displayed as literal text,
so one bad record cannot break the feed. This does not rewrite persisted data.
`isDocumentEmpty` delegates to Tiptap's `isNodeEmpty`, ignoring whitespace.
The dashboard table alone uses `generateText` for its compact summary.
Initial character counting uses ProseMirror's `textBetween`, matching Tiptap
CharacterCount's default behavior. There is no custom recursive text serializer,
character counter, or JSON tree normalizer in the Moment content path.

## Alternatives considered

- A read-only `RichTextEditor` preserves formatting, but creates an editor and
  associated lifecycle for every card, including repeated home-board cards.
- Generating an HTML string is useful outside React. React element output avoids
  an HTML injection boundary and fits this application's existing render tree.
- The static renderer's JSON-only entry point requires manual node/mark mappings.
  The ProseMirror entry point instead reuses the extensions' own render rules.

The feed remains a client component for loading and interactions. Static rendering
here means no editor instance; it does not move API fetching to the server or
remove Tiptap schema code from the client bundle.

## References and verification

- `.reference/tiptap-docs/src/content/editor/api/utilities/static-renderer.mdx`
- `.reference/tiptap/packages/core/src/helpers/generateText.ts`
- `.reference/tiptap/packages/core/src/helpers/isNodeEmpty.ts`
- `.reference/tiptap/packages/extension-hard-break/src/hard-break.ts`
- `.reference/tiptap-templates/templates/next-block-editor-app/src/hooks/useBlockEditor.ts`
- Installed HeroUI Pro `dist/components/rich-text-editor/rich-text-editor.js`
- [Tiptap Static Renderer](https://tiptap.dev/docs/editor/api/utilities/static-renderer)

Tests include the reported document's seven paragraphs and nine hard breaks,
formatting marks and lists, link safety, legacy text, empty notes, and malformed
content. Browser coverage exercises ordinary cards, stacked image cards, and
home cards against mocked APIs, without publishing content.

The browser regressions use the default motion preference. An additional run
with reduced motion exposed an existing hydration mismatch in the home page's
`HelloApple` SVG (`animate` children differ between server and client). It is
outside the Moment rendering path and remains a separate issue.
