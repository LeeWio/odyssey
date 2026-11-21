import { Extension } from "@tiptap/core";
import {
  getHierarchicalIndexes,
  TableOfContents as TiptapTableOfContents,
  type TableOfContentDataItem,
  type TableOfContentsOptions,
} from "@tiptap/extension-table-of-contents";

import { ARTICLE_OUTLINE_TOP_OFFSET, readingScrollOffset } from "@/lib/reading-scroll";

export { ARTICLE_OUTLINE_TOP_OFFSET, readingScrollOffset } from "@/lib/reading-scroll";

/**
 * The extension marks a heading active once `scrollY` passes its `offsetTop`.
 * Shift the recorded position by the sticky header so that line matches the jump.
 */
const OutlineScrollOffset = Extension.create({
  name: "outlineScrollOffset",

  onCreate() {
    if (!this.editor.storage.tableOfContents || typeof window === "undefined") return;

    const onScroll = () => {
      const outline = this.editor.storage.tableOfContents;
      if (!outline?.content.length) return;
      const items = outline.content;

      const position = readingScrollOffset() + ARTICLE_OUTLINE_TOP_OFFSET;
      let activeId = items[0]?.id ?? null;
      const scrolledOver = new Set<string>();

      for (const item of items) {
        if (!item.dom) continue;
        const top = item.dom.getBoundingClientRect().top + window.scrollY;
        if (position >= top) {
          activeId = item.id;
          scrolledOver.add(item.id);
        }
      }

      const changed = items.some(
        (item) =>
          item.isActive !== (item.id === activeId) ||
          item.isScrolledOver !== scrolledOver.has(item.id)
      );
      outline.scrollPosition = position;
      if (!changed) return;

      for (const item of items) {
        item.isActive = item.id === activeId;
        item.isScrolledOver = scrolledOver.has(item.id);
      }
      window.dispatchEvent(new CustomEvent("odyssey-outline-scroll"));
    };

    // Tiptap populates the outline during editor creation. Heading-free
    // documents can stay empty for their entire lifetime.
    const frame = window.requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    this.editor.on("destroy", () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    });
  },
});

export function createTableOfContents(options: Partial<TableOfContentsOptions> = {}) {
  return [
    TiptapTableOfContents.configure({
      anchorTypes: ["heading"],
      getIndex: getHierarchicalIndexes,
      // OutlineScrollOffset owns the window listener and applies the sticky-header offset.
      scrollParent: undefined,
      ...options,
    }),
    OutlineScrollOffset,
  ];
}

export type { TableOfContentDataItem };

export const TableOfContents = TiptapTableOfContents;

export default TableOfContents;
