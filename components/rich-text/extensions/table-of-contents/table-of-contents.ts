import {
  getHierarchicalIndexes,
  TableOfContents as TiptapTableOfContents,
  type TableOfContentsOptions,
} from "@tiptap/extension-table-of-contents";

export function createTableOfContents(options: Partial<TableOfContentsOptions> = {}) {
  return TiptapTableOfContents.configure({
    anchorTypes: ["heading"],
    getIndex: getHierarchicalIndexes,
    ...options,
  });
}

export const TableOfContents = createTableOfContents();

export default TableOfContents;
