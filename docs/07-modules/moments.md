# Moments

## Feed Layout

`/moments` defaults to a plain single-column List without a date axis. A small,
default-variant HeroUI Pro `Segment` switches to Grid, implemented with CSS Columns
and a 20rem preferred column width with a maximum of four columns. The feed keeps
the full available width, so wider screens expand cards rather than adding columns
or constraining the content container. The browser adapts the column count; cards
flow vertically without shared rows, row spans, position calculation,
or height measurement. The load-more control sits outside the multicolumn container.

`MomentFeedLayout` reads `view=list|grid` from the URL (missing/invalid values use
List). Selection uses the native History `replaceState` API integrated with Next,
preserving other query parameters and the hash without navigation or a server request.
It changes `data-view`; Tailwind group variants reflow the existing children.
Cards retain the same keyed DOM hierarchy in both modes, including image galleries
and comment state. The page extracts only the topic into a memoized content component,
so view-only URL changes do not rerender data hooks, the sidebar or cards. Topic
selection reads the current URL to preserve the chosen view. Reloads, shared links
and browser history restore the URL's mode, including server-rendered markup.
The feed keeps natural images for one to three photos. Four or more photos use the
supplied `CircularGallery` in a compact media viewport, including other Moment card
consumers. Its original WebGL arc, wave, inertia and internal viewer are retained;
Motion still owns outer card animations, not the canvas renderer. No card positions
or shared row heights are calculated for CSS Columns.

Moment cards opt into `expandOnOpen`: opening a photo enlarges the original gallery
to a full-viewport HeroUI Modal, rather than replacing it with another image viewer.
A stable portal host moves between the reserved inline slot and the modal. The same
canvas, WebGL context, textures, scroll position and engine stay mounted; its existing
ResizeObserver adapts the original arc, wave and image-focus rendering to the new
viewport. Closing restores the inline slot without changing the card's footprint.
Keyboard and pointer opening share the same behavior, and the Modal provides focus
containment and background scroll locking. Standalone galleries retain inline
expansion by default.

Same-origin upload textures do not opt into CORS; only cross-origin images use
`crossOrigin="anonymous"`. Cleanup deletes owned GPU resources without forcibly
losing the canvas context, so React Strict Mode can replay the effect safely. Stale
image callbacks and animation frames are ignored after cleanup. Regression tests
verify real texture uploads and live draw calls, not just nonblank placeholders.

Both views retain the same load-more pagination model. Numbered Pagination was
evaluated against the HeroUI MCP documentation, but it is not added just for Grid:
changing presentation should not change navigation, and continuous browsing plus
the existing cross-page hash lookup remain the feed's primary behavior.

`feed-layout.test.ts` verifies render/mount isolation and preserved child state.
`tests/e2e/moment-view-mode.spec.ts` covers the real Segment, responsive columns,
natural card/image sizing, retained nodes, query and sidebar state, unchanged API requests,
keyboard selection, refresh persistence, and pagination at 390, 820, 1024, 1440,
1920, 2560 and 3440px.

## Feed Motion

The Moments surface uses `motion/react` for its own animations, scoped by
`MomentMotionProvider`. The existing HeroUI menus, image viewer, carousel,
comment sheets, dialogs and toast animations are deliberately unchanged.
The shared browser ViewTransition opts this route out of page fades so a topic
query change cannot flash the whole page or overlap the local Motion entrance.
No CSS stylesheets or handwritten card measurements/positioning are added.
Motion's internal FLIP measurement is used for layout projection, not for Masonry
placement or calculating image aspect ratios.

- First-load and genuinely new cards reveal individually (opacity 0 to 1, y 16
  to 0), with a 400ms ease-out and 160ms between starts. Tails intentionally overlap;
  this is not a 400ms wait followed by an additional 160ms pause. CSS Columns reads
  down each column, then left to right; scheduling follows that same DOM order
  without measuring geometry. A Tailwind scripting/motion-safe initial-opacity
  utility prevents a visible SSR-to-hydration flash; Motion alone animates it and
  its inline values take over after mounting. No-JS and reduced-motion readers see
  SSR content immediately. A
  provider-scoped ID registry prevents replays on refresh, filtering or feed remounts.
  Hash navigation skips entrances; focusing a pending card reveals it immediately.
- List/Grid selection and `data-view` update immediately. A scoped `LayoutGroup`
  coordinates 400ms layout transitions with `[0.22, 1, 0.36, 1]` easing. The body
  uses `layoutDependency` to capture unchanged descendants without rerendering
  the card subtree. Cards animate position/size at opacity 1 without stagger,
  remounts or data requests. Nested text regions correct parent scaling; images
  participate in layout projection and retain their natural ratio. Image buttons
  do not clip the projected image during resizing.
- The default small HeroUI Segment keeps its semantics and styling. Only its
  built-in selection indicator is hidden and replaced with a Motion shared-layout
  background, scoped to this feed's group so other Segments are unaffected.
- Filter requests retain the entire previous feed, including appended pages, with
  opacity 0.72. Only `currentData` for the requested arguments commits a result.
  Successful results restore full opacity without replaying old cards; failures retain
  readable content and offer retry. Genuine filter results reset pagination, but
  switching presentation does not.
  This behavior is opt-in via `retainPreviousData`; archive consumers keep their
  normal loading/error states.
- Initial skeletons wait 150ms to avoid flashing on quick requests. On this feed,
  static HeroUI skeletons share a Motion opacity pulse instead of CSS shimmer.
  Added cards use the same 400ms/160ms sequence. Removed cards fade for 140ms and are
  inert while exiting. CSS Columns still owns layout and can rebalance on additions
  or natural image loading; Motion never fixes card heights or changes column flow.
  Successful deletions are also excluded locally from SSR-provided feed data.
- Natural images reveal for 180ms on their first uncached load and have a small
  image-only press response. Their native aspect ratio and intrinsic layout remain
  untouched. User-triggered likes/bookmarks pulse only their icon; count changes
  fade locally. These effects do not replace HeroUI Button animations.
- Cadence period changes fade only the dot matrix for 160ms, with reserved vertical
  space. Anchor targets receive a one-shot ring pulse without animated scrolling.
- The SSR-safe reduced-motion preference disables delays, spatial movement,
  pulses and layout transitions, and settles interrupted transitions immediately.

Unit coverage includes cancelled view sequences, child render/mount isolation,
reduced-motion interruption, stale filter responses, retained content on errors,
and empty results. Browser tests exercise real Motion on desktop and mobile,
including frame-by-frame geometry and opacity, stable card/image nodes, natural
image ratios throughout transitions, sidebar state and API isolation.

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

The original reduced-motion hydration mismatch in the home page's Hello SVG is
covered by the visitor-home regressions. See [Home](home.md) for the shared motion
preference behavior and loading-error recovery.
