import {
  getHierarchicalIndexes,
  TableOfContents as TiptapTableOfContents,
} from "@tiptap/extension-table-of-contents";

export const TableOfContents = TiptapTableOfContents.configure({
  anchorTypes: ["heading"],
  getIndex: getHierarchicalIndexes,
});

export default TableOfContents;
