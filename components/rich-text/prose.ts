import { typographyVariants } from "@heroui/styles";

/**
 * HeroUI Prose is the typography source for both editing and reading.
 * Important utilities bridge Pro's unlayered editor CSS and OSS Prose's
 * component layer; spacing belongs to document blocks, never NodeView internals.
 */
export const RICH_TEXT_PROSE_CLASS_NAME = [
  typographyVariants().prose(),
  "font-sans text-base! leading-7! tracking-normal wrap-anywhere",
  "[&>*]:my-4! [&>:first-child]:mt-0! [&>:last-child]:mb-0!",
  "[&_:where(blockquote,[data-type=column],[data-type=detailsContent])>*]:my-4!",
  "[&_h1]:text-4xl! [&_h1]:leading-10! [&_h1]:mt-8! [&_h1]:mb-4!",
  "[&_h2]:text-3xl! [&_h2]:leading-9! [&_h2]:mt-8! [&_h2]:mb-4!",
  "[&_h3]:text-2xl! [&_h3]:leading-8! [&_h3]:mt-6! [&_h3]:mb-4!",
  "[&_:is(h1,h2,h3)]:tracking-normal! [&_:is(h1,h2,h3)+:is(h1,h2,h3)]:mt-4!",
  "[&_p:not([data-slot])]:my-4 [&_li>p]:min-h-0",
  "[&_li>:first-child]:mt-0! [&_li>:last-child]:mb-0!",
  "[&_li_:is(ul,ol)]:my-2! [&_li+li]:mt-2!",
  "[&_ul[data-type=taskList]]:list-none! [&_ul[data-type=taskList]]:ps-0!",
  "[&_.node-taskItem_[data-node-view-content-react]>:first-child]:mt-0! [&_.node-taskItem_[data-node-view-content-react]>:last-child]:mb-0!",
  "[&_.node-taskItem>[data-checked=true]>[data-node-view-content]>[data-node-view-content-react]>p:first-child]:text-muted [&_.node-taskItem>[data-checked=true]>[data-node-view-content]>[data-node-view-content-react]>p:first-child]:line-through",
  "[&_blockquote]:border-s-4! [&_blockquote]:italic [&_blockquote>:first-child]:mt-0! [&_blockquote>:last-child]:mb-0!",
  "[&_pre]:max-w-full [&_pre]:p-4! [&_pre]:leading-relaxed! [&_pre]:whitespace-pre! [&_pre]:[overflow-wrap:normal]",
  "[&_pre_code]:rounded-none! [&_pre_code]:bg-transparent! [&_pre_code]:p-0! [&_pre_code]:text-inherit! [&_pre_code]:[font-size:inherit]! [&_pre_code]:[line-height:inherit]!",
  "[&_.node-codeBlock>[data-node-view-content-react]]:block [&_.node-codeBlock>[data-node-view-content-react]]:max-w-full [&_.node-codeBlock>[data-node-view-content-react]]:overflow-x-auto [&_.node-codeBlock>[data-node-view-content-react]]:p-4 [&_.node-codeBlock>[data-node-view-content-react]]:whitespace-pre!",
  "[&_hr]:my-8! [&_hr]:border-separator",
  "[&_img]:m-0! [&_img]:h-auto [&_img]:max-w-full [&_figure]:m-0",
  // Match HeroUI Table's theme-driven outer radius, including square-corner themes.
  "[&_.tableWrapper]:min-w-0 [&_.tableWrapper]:max-w-full [&_.tableWrapper]:overflow-x-auto [&_.tableWrapper]:overflow-y-hidden [&_.tableWrapper]:rounded-[min(32px,calc(var(--radius)*2.5))]! [&_.tableWrapper]:border [&_.tableWrapper]:border-separator [&_.tableWrapper]:bg-surface",
  // prosemirror-tables marks the editor itself when the pointer is on a column edge.
  "[&.resize-cursor]:cursor-col-resize!",
  // The wrapper owns the outer edge; collapsed cell borders keep merged cells seamless.
  "[&_.tableWrapper_table]:m-0! [&_.tableWrapper_table]:border-collapse! [&_.tableWrapper_table]:border-hidden!",
  "[&_.tableWrapper_:is(td,th)]:box-border [&_.tableWrapper_:is(td,th)]:border-separator-tertiary/50! [&_.tableWrapper_:is(td,th)]:px-3! [&_.tableWrapper_:is(td,th)]:py-2.5! sm:[&_.tableWrapper_:is(td,th)]:px-4! sm:[&_.tableWrapper_:is(td,th)]:py-3!",
  // Unsized columns need a stable floor. Otherwise the first typed glyph widens the column and the row jumps.
  "[&_.tableWrapper_:is(td,th):not([data-colwidth])]:min-w-[var(--default-cell-min-width,100px)]",
  "[&_.tableWrapper_th]:border-separator/50! [&_.tableWrapper_th]:bg-surface-secondary! [&_.tableWrapper_th]:text-muted [&_.tableWrapper_th]:font-medium! [&_.tableWrapper_th]:text-start",
  // Zero every cell child, not only :first/:last. The resize handle is a trailing widget,
  // so a :last-child rule lets the paragraph margin return and the header jumps.
  "[&_:is(td,th)>*]:my-0!",
  "[&_:is(td,th)>p+p]:mt-3!",
  // Empty cell paragraphs collapse to 0 until the caret or first glyph arrives.
  "[&_:is(td,th)>p]:min-h-[1lh]",
  "[&_[data-type=column]>:first-child]:mt-0! [&_[data-type=column]>:last-child]:mb-0!",
  "[&_[data-type=detailsContent]>:first-child]:mt-0! [&_[data-type=detailsContent]>:last-child]:mb-0!",
  "[&_[data-youtube-video]]:aspect-video [&_[data-youtube-video]]:max-w-full [&_[data-youtube-video]_iframe]:h-full [&_[data-youtube-video]_iframe]:w-full",
  "[&_[data-type=block-math]]:overflow-x-auto [&_[data-type=block-math]]:py-4 [&_[data-type=block-math]]:text-center [&_.katex-display]:m-0",
  "[&[contenteditable=false]_.ProseMirror-selectednode]:rounded-none! [&[contenteditable=false]_.ProseMirror-selectednode]:outline-none!",
].join(" ");
