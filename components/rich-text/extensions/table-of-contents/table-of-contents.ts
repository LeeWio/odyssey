import {
  getHierarchicalIndexes,
  TableOfContents as TiptapTableOfContents,
} from "@tiptap/extension-table-of-contents";

export const TableOfContents = TiptapTableOfContents.configure({
  anchorTypes: ["heading"],
  getIndex: getHierarchicalIndexes,
  getId: (text) => {
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return slug || `section-${Math.random().toString(36).substring(2, 9)}`;
  },
});

export default TableOfContents;
